import * as RPC from 'discord-rpc';
import { clientId } from './variables';
import { initTrayIcon, loadWindow, updater, discordWebSocket, wsClient } from './functions';
import { app, BrowserWindow } from 'electron';
import { log } from './utils/Log';
import * as Protocol from './utils/Protocol';
import * as Config from './utils/Config';
import * as Tray from './utils/Tray';
import updater from './utils/Updater';
import * as DiscordWebSocket from './utils/WebSocket';
import * as RPC from './utils/RPC';

Protocol.register(app);
Protocol.handle(app);

log('App', 'Deezer Discord RPC version', require('../package.json').version);

app.whenReady().then(async () => {
  await loadWindow();
  await initTrayIcon(app, rpcClient);
  await updater(true);

  Config.get(app, 'use_listening_to') ?
    DiscordWebSocket.connect(Config.get(app, 'discord_token')).catch(console.error) :
    RPC.connect();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadWindow();
  });
});

process.on('beforeExit', () => {
  (Config.get(app, 'use_listening_to') ? DiscordWebSocket : RPC).disconnect();
});