const fs = require('node:fs/promises');
const path = require('node:path');

class MessageStore {
  constructor(file) { this.file = file; this.messages = []; this.queue = Promise.resolve(); }
  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      this.messages = JSON.parse(await fs.readFile(this.file, 'utf8'));
      if (!Array.isArray(this.messages) || !this.messages.every(m => m && typeof m.id === 'string' && typeof m.user === 'string' && typeof m.text === 'string' && typeof m.createdAt === 'string')) {
        throw new Error('Histórico JSON inválido. Corrija o arquivo antes de iniciar.');
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await fs.writeFile(this.file, '[]\n', 'utf8');
    }
  }
  all() { return this.messages.slice(); }
  add(message) {
    const operation = this.queue.then(async () => {
      const updated = [...this.messages, message];
      await fs.writeFile(`${this.file}.tmp`, JSON.stringify(updated, null, 2) + '\n', 'utf8');
      await fs.rename(`${this.file}.tmp`, this.file);
      this.messages = updated;
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
}
module.exports = { MessageStore };
