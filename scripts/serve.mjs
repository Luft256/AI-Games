import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv[2] || 'site');
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const server = http.createServer(async (req, res) => {
  try {
    let route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Preview both the site root and the real GitHub Pages project prefix.
    if (route === '/AI-Games') { res.writeHead(301, { Location:'/AI-Games/' }); res.end(); return; }
    if (route.startsWith('/AI-Games/')) route = route.slice('/AI-Games'.length);
    let target = resolve(root, `.${route}`);
    if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    if ((await stat(target)).isDirectory()) {
      if (!route.endsWith('/')) { res.writeHead(301, { Location: new URL(req.url, 'http://localhost').pathname + '/' }); res.end(); return; }
      target = resolve(target, 'index.html');
    }
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(body);
  } catch { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/AI-Games/`));
