const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { MessageStore } = require('../src/store');

test('gravações simultâneas preservam mensagens e histórico pode ser reaberto', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-store-'));
  try {
    const file = path.join(dir, 'messages.json');
    const store = new MessageStore(file);
    await store.init();
    await Promise.all(Array.from({ length: 20 }, (_, i) => store.add({ id: String(i), user: 'Teste', text: `Mensagem ${i}`, createdAt: new Date().toISOString() })));
    const reopened = new MessageStore(file);
    await reopened.init();
    assert.equal(reopened.all().length, 20);
    assert.equal(new Set(reopened.all().map(m => m.id)).size, 20);
    await fs.writeFile(file, '{inválido');
    await assert.rejects(() => new MessageStore(file).init());
    assert.equal(await fs.readFile(file, 'utf8'), '{inválido');
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
