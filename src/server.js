const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { MessageStore } = require('./store');
const { setupWebSocket } = require('./websocket');

async function createApp({ dataFile = path.join(__dirname, '../data/messages.json') } = {}) {
  const store = new MessageStore(dataFile);
  await store.init();
  const routes = { '/': ['index.html', 'text/html'], '/style.css': ['style.css', 'text/css'], '/app.js': ['app.js', 'application/javascript'] };
  const server = http.createServer(async (req, res) => {
    const route = routes[req.url];
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    if (!route) { res.writeHead(404); return res.end('Não encontrado'); }
    try {
      const content = await fs.readFile(path.join(__dirname, '../public', route[0]));
      res.writeHead(200, {
        'Content-Type': `${route[1]}; charset=utf-8`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { res.writeHead(500); res.end('Erro ao carregar a interface.'); }
  });
  const wss = setupWebSocket(server, store);
  return { server, wss, store };
}
if (require.main === module) {
  createApp().then(({ server }) => {
    server.on('error', error => { console.error('Erro no servidor:', error.message); process.exitCode = 1; });
    server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log(`Chat disponível em http://localhost:${server.address().port}`));
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { createApp };
