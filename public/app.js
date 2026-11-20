const $ = id => document.getElementById(id);
let socket;
let username;
const seen = new Set();
function showMessage(message) {
  if (seen.has(message.id)) return;
  seen.add(message.id);
  $('empty')?.remove();
  const article = document.createElement('article');
  const author = document.createElement('strong');
  const time = document.createElement('time');
  const body = document.createElement('p');
  author.textContent = message.user;
  time.dateTime = message.createdAt;
  time.textContent = new Date(message.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  body.textContent = message.text;
  article.append(author, time, body);
  $('messages').append(article);
  $('messages').scrollTop = $('messages').scrollHeight;
}
$('join').addEventListener('submit', event => {
  event.preventDefault();
  username = $('name').value.trim();
  if (!username || socket?.readyState === WebSocket.CONNECTING || socket?.readyState === WebSocket.OPEN) return;
  $('error').textContent = '';
  $('status').textContent = 'Conectando…';
  socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  socket.addEventListener('open', () => socket.send(JSON.stringify({ type: 'join', user: username })));
  socket.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.type === 'history') {
      data.messages.forEach(showMessage);
      $('join').hidden = true;
      $('status').textContent = '● Conectado';
      $('text').disabled = $('send').disabled = false;
      $('text').placeholder = 'Escreva sua mensagem…';
      $('text').focus();
    }
    if (data.type === 'message') showMessage(data.message);
    if (data.type === 'presence') {
      $('count').textContent = data.users.length;
      $('users').replaceChildren(...data.users.map(name => {
        const item = document.createElement('li'); item.textContent = name; return item;
      }));
    }
    if (data.type === 'error') $('error').textContent = data.message;
  });
  socket.addEventListener('error', () => { $('error').textContent = 'Não foi possível conectar ao servidor.'; });
  socket.addEventListener('close', () => {
    $('status').textContent = 'Desconectado';
    $('text').disabled = $('send').disabled = true;
    $('join').hidden = false;
    $('users').replaceChildren(); $('count').textContent = '0';
    $('error').textContent = 'Conexão encerrada. Clique em Entrar no chat para reconectar.';
  });
});
$('composer').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('text').value.trim();
  if (!text || socket?.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'message', text }));
  $('text').value = '';
  $('error').textContent = '';
  $('text').focus();
});
