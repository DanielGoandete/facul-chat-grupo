# Bate-papo em tempo real — Facul Chat Grupo

Aplicação acadêmica de chat.

## Requisitos

- Node.js 20 ou superior e npm.
- Navegador d internet e Visual Studio Code.

## Instalação e execução

1. Abra esta pasta no VS Code  --> Arquivo → Abrir Pasta.
2. Abra: Terminal → Novo Terminal e instale a dependência:

   ```sh
   npm install
   ```

3. Inicie o servidor:

   ```sh
   npm start
   ```

4. Acesse **http://localhost:3000** no navegador, informe um nome e clique em: Entrar no chat.
5. Abra outra aba ou janela, entre com outro nome e envie mensagen. 
6. Para encerrar o servidor, pressione **Ctrl+C** no terminal.


Para desenvolvimento com reinício automático: `npm run dev`.
Para usar outra porta no PowerShell: `$env:PORT=3001; npm start`.
O servidor escuta apenas neste computador (127.0.0.1).

## Organização

```text
src/server.js        Servidor HTTP e inicialização
src/websocket.js     Conexões, validação, presença e distribuição de mensagens
src/store.js         Fila de gravação e persistência JSON
public/index.html    Interface
public/style.css     Estilos responsivos
public/app.js        Cliente WebSocket do navegador
data/messages.json   Histórico de mensagens
test/chat.test.js    Testes de integração
```

## Funcionamento

O navegador conecta ao caminho `/ws` do mesmo servidor HTTP. Ao entrar, recebe o histórico e a lista de participantes. Cada mensagem recebe um identificador e uma data gerados no servidor, é salva e então distribuída aos usuários conectados. O módulo de armazenamento serializa as gravações e substitui o JSON por meio de um arquivo temporário, evitando sobrscritas entre mensagens simultâneas. O histórico reaparece após reiniciar o servidor.

Os nomes têm até 30 caracteres e as mensagens até 1.000. Conteúdo recebido é exibido como texto, sem execução de HTML. Conexões interrompidas são detectadas por mensagens de verificação e resposta do protocolo WebSocket. A interface permite reconectar pelo botão de entrada.

É uma sala pública de demonstração, sem autenticação, salas privadas ou banco de dados. Nomes não são exclusivos. Execute uma única instância por arquivo JSON. Para colocar o serviço na internet seria necessário configurar hospdagem com WebSockets, HTTPS, controle de acesso e limites de uso. Publicar o código no GitHub não hospeda o servidor; GitHub Pages não executa esse servidor Node.js.

## Testes

```sh
npm test
```

O teste usa uma porta temporária e um histórico separado. Verifica HTTP, bloqueio de arquivos internos, mensagens entre dois clientes, validação e recuperação do histórico após reinicialização, sem modificar o histórico da aplicação.

Teste manual: entre em duas abas, envie uma mensagem em cada uma, reinicie o servidor e reconecte. As mensagens devem continuar aparecendo.



Referência da dependência: https://github.com/websockets/ws.
