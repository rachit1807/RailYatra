import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer(async(req,res)=>{try {const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const p=path.resolve(root,'.'+pathname);if(!p.startsWith(root+path.sep)&&p!==root)throw Error();const file=pathname==='/__reservation-test'?path.resolve('tests/browser-reservation.html'):p===root||p.endsWith('/')?path.join(p,'index.html'):p;const data=await readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(5173,'127.0.0.1',()=>console.log('RailYatra running at http://localhost:5173'));
