import * as RPC from 'discord-rpc';
import { clientId } from './variables';
import { initTrayIcon, loadWindow, updater, discordWebSocket, wsClient } from './functions';
import { app, BrowserWindow } from 'electron';
import { log } from './utils/Log';
import * as Protocol from './utils/Protocol';
import * as Config from './utils/Config';

Protocol.register(app);
Protocol.handle(app);

log('App', 'Deezer Discord RPC version', require('../package.json').version);

export const rpcClient = new RPC.Client({
  transport: 'ipc'
});
export const noRPC = Config.get(app, 'use_listening_to');

app.whenReady().then(async () => {
  await loadWindow();
  await initTrayIcon(app, rpcClient);
  await updater(true);

  Config.get(app, 'use_listening_to') ?
    discordWebSocket(Config.get(app, 'discord_token')).catch(console.error) :
    rpcClient.login({ clientId }).catch(console.error);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadWindow();
  });
});

rpcClient.on('ready', () => {
  log('RPC', `Authed for user ${rpcClient.user?.username}#${rpcClient.user?.discriminator}`);
});

process.on('beforeExit', () => {
  Config.get(app, 'use_listening_to') ? wsClient?.close() : rpcClient?.destroy();
});