import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.env.DEMO_PORT || 5174);
const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png'};

http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = pathname === '/__reservation-test'
      ? path.resolve('tests/browser-reservation.html')
      : path.resolve(root, `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
    if (pathname !== '/__reservation-test' && !file.startsWith(root + path.sep) && file !== root) throw new Error('Path outside site root');
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`RailYatra browser-only demo at http://localhost:${port}`));
