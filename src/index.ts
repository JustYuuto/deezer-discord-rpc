import { app, BrowserWindow } from 'electron';
import { log } from './utils/Log';
import * as Protocol from './utils/Protocol';
import * as Config from './utils/Config';
import * as Tray from './utils/Tray';
import updater from './utils/Updater';
import * as DiscordWebSocket from './utils/WebSocket';
import * as RPC from './utils/RPC';
import * as Window from './utils/Window';

Protocol.register(app);
Protocol.handle(app);

log('App', 'Deezer Discord RPC version', require('../package.json').version, process.argv0.includes('node') ? '(debug)' : '');

app.whenReady().then(async () => {
  await Tray.init(app, RPC.client);
  await Window.load(app);
  await updater(true);

  Config.get(app, 'use_listening_to') ?
    DiscordWebSocket.connect(Config.get(app, 'discord_token')).catch(console.error) :
    RPC.connect();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) Window.load(app);
  });
});

process.on('beforeExit', async () => {
  Config.get(app, 'use_listening_to') ? DiscordWebSocket.disconnect(1000) : await RPC.disconnect();
});
