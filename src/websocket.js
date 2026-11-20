const { WebSocketServer, WebSocket } = require('ws');
const { randomUUID } = require('node:crypto');

function setupWebSocket(server, store) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8192 });
  const send = (client, value) => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(value));
  };
  const broadcast = value => wss.clients.forEach(client => { if (client.user) send(client, value); });
  const presence = () => broadcast({ type: 'presence', users: [...wss.clients].filter(c => c.user && c.readyState === WebSocket.OPEN).map(c => c.user) });
  wss.on('connection', socket => {
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('error', error => console.error('Erro WebSocket:', error.message));
    let pending = Promise.resolve();
    socket.on('message', (raw, binary) => {
      pending = pending.then(async () => {
        let data;
        try { if (binary) throw new Error(); data = JSON.parse(raw.toString()); }
        catch { return send(socket, { type: 'error', message: 'Envie uma mensagem JSON válida.' }); }
        if (!data || typeof data !== 'object') return;
        if (data.type === 'join' && !socket.user) {
          const name = typeof data.user === 'string' ? data.user.trim() : '';
          if (!name || name.length > 30) return send(socket, { type: 'error', message: 'Use um nome de 1 a 30 caracteres.' });
          socket.user = name;
          send(socket, { type: 'history', messages: store.all() });
          presence();
          return;
        }
        if (data.type !== 'message' || !socket.user) return send(socket, { type: 'error', message: 'Entre no chat antes de enviar.' });
        const text = typeof data.text === 'string' ? data.text.trim() : '';
        if (!text || text.length > 1000) return send(socket, { type: 'error', message: 'A mensagem deve ter de 1 a 1000 caracteres.' });
        const message = { id: randomUUID(), user: socket.user, text, createdAt: new Date().toISOString() };
        await store.add(message);
        broadcast({ type: 'message', message });
      }).catch(error => {
        console.error('Não foi possível salvar a mensagem:', error.message);
        send(socket, { type: 'error', message: 'Não foi possível salvar. Tente novamente.' });
      });
    });
    socket.on('close', presence);
  });
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) { socket.terminate(); continue; }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30000);
  wss.on('close', () => clearInterval(heartbeat));
  return wss;
}
module.exports = { setupWebSocket };
