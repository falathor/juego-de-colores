// Optional local development helper; the application itself needs no Node server.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.argv[2] || 8000);
const prefix = process.argv[3] || '';
if (prefix && !/^\/[a-zA-Z0-9_-]+$/.test(prefix)) throw new Error('Use a prefix such as /juego-de-colores');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    let requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (prefix) {
      if (requested === prefix) { res.writeHead(302, { Location: `${prefix}/` }); res.end(); return; }
      if (!requested.startsWith(`${prefix}/`)) throw new Error('Not found');
      requested = requested.slice(prefix.length);
    }
    if (requested.endsWith('/')) requested += 'index.html';
    if (!/^\/(index\.html|styles\.css|favicon\.svg|js\/[\w.-]+\.js|data\/questions\.es\.json|tests\/[\w.-]+\.(html|js))$/.test(requested)) throw new Error('Not found');
    const file = path.resolve(root, `.${requested}`);
    if (!file.startsWith(root)) throw new Error('Not found');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': `${types[path.extname(file)] || 'text/plain'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); }
});
server.listen(port, '127.0.0.1', () => console.log(`¿De qué color? http://localhost:${port}${prefix}/`));
