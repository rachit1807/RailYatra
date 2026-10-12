import 'dotenv/config';
import express from 'express';
import {createHash, randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createApi, expireSeatHolds} from './api.js';
import {migrateDatabase} from './api/migrate.mjs';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.join(projectRoot, 'dist');

function configuredOrigins() {
  const values = (process.env.ALLOWED_ORIGINS || 'https://rachit1807.github.io,http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (process.env.RENDER_EXTERNAL_URL) values.push(new URL(process.env.RENDER_EXTERNAL_URL).origin);
  return new Set(values);
}

function createTrafficMonitor() {
  const byRoute = new Map();
  const durationBuckets = [50, 100, 250, 500, 1000, 2500, 5000];
  let requests = 0;
  let serverErrors = 0;
  let durationTotal = 0;

  const observe = (req, res, next) => {
    const started = performance.now();
    const requestId = /^[A-Za-z0-9-]{8,80}$/.test(req.get('x-request-id') || '') ? req.get('x-request-id') : randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store');
    res.once('finish', () => {
      const durationMs = Number((performance.now() - started).toFixed(2));
      const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path
        .replace(/(\/checkouts\/)[^/]+/g, '$1:id')
        .replace(/(\/bookings\/)[^/]+/g, '$1:id')
        .replace(/(\/pnr\/)[^/]+/g, '$1:id')
        .replace(/\d{6,}/g, ':id');
      const key = `${req.method}|${route}|${res.statusCode}`;
      const current = byRoute.get(key) ?? {count: 0, durationMs: 0, buckets: durationBuckets.map(() => 0)};
      current.count += 1;
      current.durationMs += durationMs;
      durationBuckets.forEach((boundary, index) => { if (durationMs <= boundary) current.buckets[index] += 1; });
      byRoute.set(key, current);
      requests += 1;
      durationTotal += durationMs;
      if (res.statusCode >= 500) serverErrors += 1;
      console.info(JSON.stringify({event: 'http.request', requestId, method: req.method, route, status: res.statusCode, durationMs}));
    });
    next();
  };

  const metrics = () => {
    const lines = [
      '# HELP railyatra_http_requests_total HTTP requests handled since this process started.',
      '# TYPE railyatra_http_requests_total counter',
      '# HELP railyatra_http_request_duration_ms HTTP request duration in milliseconds.',
      '# TYPE railyatra_http_request_duration_ms histogram',
    ];
    for (const [key, stats] of byRoute) {
      const [method, route, status] = key.split('|');
      const labels = `method="${method}",route="${route.replaceAll('"', '\\"')}",status="${status}"`;
      lines.push(`railyatra_http_requests_total{${labels}} ${stats.count}`);
      lines.push(`railyatra_http_request_duration_ms_sum{${labels}} ${stats.durationMs.toFixed(2)}`);
      durationBuckets.forEach((boundary, index) => lines.push(`railyatra_http_request_duration_ms_bucket{${labels},le="${boundary}"} ${stats.buckets[index]}`));
      lines.push(`railyatra_http_request_duration_ms_bucket{${labels},le="+Inf"} ${stats.count}`);
      lines.push(`railyatra_http_request_duration_ms_count{${labels}} ${stats.count}`);
    }
    lines.push('# HELP railyatra_process_uptime_seconds Time since the API process started.');
    lines.push('# TYPE railyatra_process_uptime_seconds gauge');
    lines.push(`railyatra_process_uptime_seconds ${Math.floor(process.uptime())}`);
    lines.push('# HELP railyatra_http_server_errors_total HTTP 5xx responses since this process started.');
    lines.push('# TYPE railyatra_http_server_errors_total counter');
    lines.push(`railyatra_http_server_errors_total ${serverErrors}`);
    lines.push('# HELP railyatra_http_request_duration_ms_average Average request duration since process start.');
    lines.push('# TYPE railyatra_http_request_duration_ms_average gauge');
    lines.push(`railyatra_http_request_duration_ms_average ${requests ? (durationTotal / requests).toFixed(2) : '0'}`);
    return `${lines.join('\n')}\n`;
  };
  return {observe, metrics};
}

function createAuthLimiter() {
  const windows = new Map();
  const windowMs = 15 * 60 * 1000;
  const consume = (key, max, now) => {
    let bucket = windows.get(key);
    if (!bucket || bucket.until <= now) bucket = {count: 0, until: now + windowMs};
    bucket.count += 1;
    windows.set(key, bucket);
    if (windows.size > 2000) {
      for (const [savedKey, saved] of windows) if (saved.until <= now) windows.delete(savedKey);
    }
    return bucket.count <= max ? 0 : Math.ceil((bucket.until - now) / 1000);
  };
  return (req, res, next) => {
    if (req.method !== 'POST' || !['/api/auth/login', '/api/auth/register'].includes(req.path)) return next();
    const now = Date.now();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const identityHash = createHash('sha256').update(email).digest('hex');
    const retryByIdentity = consume(`identity:${ip}:${identityHash}`, 10, now);
    const retryByAddress = consume(`address:${ip}`, 80, now);
    const retryAfter = Math.max(retryByIdentity, retryByAddress);
    if (retryAfter) {
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({error: 'Too many sign-in attempts. Wait a little and try again.'});
    }
    next();
  };
}

export function createServer({pool, checkoutHoldSeconds} = {}) {
  if (!pool) throw new Error('A PostgreSQL pool is required to create the RailYatra server.');
  const app = express();
  const origins = configuredOrigins();
  const monitor = createTrafficMonitor();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(monitor.observe);
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin && !origins.has(origin)) return res.status(403).json({error: 'This website is not allowed to use the RailYatra API.'});
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-RailYatra-Request, X-Request-ID, Idempotency-Key');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (!origin || !origins.has(origin) || req.get('x-railyatra-request') !== '1') {
        return res.status(403).json({error: 'This request could not pass the browser security check. Refresh and try again.'});
      }
    }
    next();
  });
  app.use(express.json({limit: '32kb'}));
  app.use(createAuthLimiter());
  app.use('/api', createApi(pool, {checkoutHoldSeconds}));
  app.get('/api/metrics', (_req, res) => res.type('text/plain; version=0.0.4').send(monitor.metrics()));
  app.get('/__reservation-test', async (_req, res, next) => {
    try { res.type('html').send(await readFile(path.join(projectRoot, 'tests/browser-reservation.html'), 'utf8')); }
    catch (error) { next(error); }
  });
  app.use(express.static(staticRoot, {etag: true, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0}));
  app.use((_req, res) => res.status(404).send('Not found'));
  app.use((error, req, res, _next) => {
    console.error(JSON.stringify({event: 'http.error', requestId: req.requestId, code: error.code ?? 'INTERNAL_ERROR', name: error.name}));
    if (!res.headersSent) res.status(500).send('The RailYatra service could not complete that request.');
  });
  return app;
}

export async function startServer() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required. Copy .env.example to .env and start PostgreSQL before running RailYatra.');
  const pool = new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.PG_POOL_SIZE || 5),
    ssl: process.env.PGSSL === 'require' ? {rejectUnauthorized: false} : undefined,
  });
  pool.on('error', error => console.error(JSON.stringify({event: 'database.pool.error', message: error.message, code: error.code})));
  await migrateDatabase(pool);
  const app = createServer({pool, checkoutHoldSeconds: Number(process.env.SEAT_HOLD_SECONDS || 300)});
  const port = Number(process.env.PORT || 5173);
  const server = app.listen(port, '0.0.0.0', () => console.info(JSON.stringify({event: 'server.started', port})));
  const maintenance = setInterval(async () => {
    try {
      const expired = await expireSeatHolds(pool);
      await pool.query('DELETE FROM sessions WHERE expires_at <= now()');
      if (expired) console.info(JSON.stringify({event: 'checkout.holds.expired', count: expired}));
    } catch (error) {
      console.error(JSON.stringify({event: 'maintenance.failed', message: error.message, code: error.code}));
    }
  }, 30_000);
  maintenance.unref();
  const shutdown = signal => {
    console.info(JSON.stringify({event: 'server.shutdown', signal}));
    clearInterval(maintenance);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  return {app, server, pool};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer().catch(error => {
    console.error(JSON.stringify({event: 'server.start_failed', message: error.message, code: error.code}));
    process.exit(1);
  });
}
