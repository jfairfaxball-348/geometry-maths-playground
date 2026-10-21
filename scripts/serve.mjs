import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('dist');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (!(await stat(path)).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' });
    res.end(await readFile(path));
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(5173, () => console.log('Geometry Maths Playground: http://localhost:5173'));
