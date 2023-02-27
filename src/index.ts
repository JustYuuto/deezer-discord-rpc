import * as RPC from 'discord-rpc';
import { clientId } from './variables';
import { initTrayIcon, loadWindow, updater, getConfig, discordWebSocket, wsClient } from './functions';
import { app, BrowserWindow } from 'electron';
import { log } from './utils/Log';

log('App', 'Deezer Discord RPC version', require('../package.json').version);

export const rpcClient = new RPC.Client({
  transport: 'ipc'
});
export const noRPC = getConfig(app, 'use_listening_to');

app.whenReady().then(async () => {
  await loadWindow();
  await initTrayIcon(app, rpcClient);
  await updater(true);

  getConfig(app, 'use_listening_to') ?
    discordWebSocket(getConfig(app, 'discord_token')).catch(console.error) :
    rpcClient.login({ clientId }).catch(console.error);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadWindow();
  });
});

rpcClient.on('ready', () => {
  log('RPC', `Authed for user ${rpcClient.user?.username}#${rpcClient.user?.discriminator}`);
});

process.on('beforeExit', () => {
  getConfig(app, 'use_listening_to') ? wsClient?.close() : rpcClient?.destroy();
});