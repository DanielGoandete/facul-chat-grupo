const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { WebSocket } = require('ws');
const { createApp } = require('../src/server');

test('HTTP, dois clientes, validação e persistência após reiniciar', { timeout: 15000 }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-test-'));
  let app;
  const clients = [];
  async function start() {
    app = await createApp({ dataFile: path.join(dir, 'messages.json') });
    app.server.listen(0, '127.0.0.1');
    await once(app.server, 'listening');
    return app.server.address().port;
  }
  async function stop() {
    clients.splice(0).forEach(c => c.terminate());
    await new Promise(resolve => app.wss.close(resolve));
    await new Promise(resolve => app.server.close(resolve));
  }
  function waitFor(client, type) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { client.off('message', handler); reject(new Error(`Sem resposta: ${type}`)); }, 3000);
      function handler(raw) {
        const data = JSON.parse(raw);
        if (data.type === type) { clearTimeout(timer); client.off('message', handler); resolve(data); }
      }
      client.on('message', handler);
    });
  }
  async function join(port, user) {
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    clients.push(client);
    await once(client, 'open');
    const history = waitFor(client, 'history');
    client.send(JSON.stringify({ type: 'join', user }));
    return { client, history: await history };
  }
  try {
    let port = await start();
    const response = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Sala geral/);
    assert.equal((await fetch(`http://127.0.0.1:${port}/data/messages.json`)).status, 404);
    const { client: a } = await join(port, 'Ana');
    const { client: b } = await join(port, 'Bruno');
    const first = waitFor(a, 'message');
    const second = waitFor(b, 'message');
    a.send(JSON.stringify({ type: 'message', text: 'Olá, Bruno! <b>teste</b>' }));
    const [one, two] = await Promise.all([first, second]);
    assert.deepEqual(one, two);
    assert.equal(two.message.user, 'Ana');
    const invalid = waitFor(a, 'error');
    a.send(JSON.stringify({ type: 'message', text: 'x'.repeat(1001) }));
    assert.match((await invalid).message, /1000/);
    const reply = waitFor(a, 'message');
    b.send(JSON.stringify({ type: 'message', text: 'Oi, Ana!' }));
    assert.equal((await reply).message.user, 'Bruno');
    await stop();
    port = await start();
    const { history } = await join(port, 'Carla');
    assert.equal(history.messages.length, 2);
    assert.equal(history.messages[0].text, 'Olá, Bruno! <b>teste</b>');
    assert.equal(history.messages[1].text, 'Oi, Ana!');
  } finally {
    if (app) await stop();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
