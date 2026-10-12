import 'dotenv/config';
import express from 'express';
import {Pool} from 'pg';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApi} from './api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT || 5173);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Copy .env.example to .env and start PostgreSQL before running RailYatra.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.PG_POOL_SIZE || 5),
  ssl: process.env.PGSSL === 'require' ? {rejectUnauthorized: false} : undefined,
});

pool.on('error', error => console.error('Unexpected PostgreSQL connection error:', error));
await pool.query(await readFile(new URL('./api/schema.sql', import.meta.url), 'utf8'));

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const configured = process.env.ALLOWED_ORIGINS;
  const origins = (configured || 'https://rachit1807.github.io,http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(origin => origin.trim()).filter(Boolean);
  if (process.env.RENDER_EXTERNAL_URL) origins.push(new URL(process.env.RENDER_EXTERNAL_URL).origin);
  const allowed = new Set(origins);
  const origin = req.get('origin');
  if (origin && !allowed.has(origin)) return res.status(403).json({error: 'This website is not allowed to use the RailYatra API.'});
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.json({limit: '32kb'}));
app.use('/api', createApi(pool));
app.get('/__reservation-test', async (_req, res, next) => {
  try { res.type('html').send(await readFile(path.resolve('tests/browser-reservation.html'), 'utf8')); }
  catch (error) { next(error); }
});
app.use(express.static(root, {etag: true, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0}));
app.use((_req, res) => res.status(404).send('Not found'));
app.use((error, _req, res, _next) => {
  console.error('Web request failed:', error);
  if (!res.headersSent) res.status(500).send('The RailYatra service could not complete that request.');
});

const server = app.listen(port, '0.0.0.0', () => console.log(`RailYatra full-stack app listening on port ${port}`));
const shutdown = async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
