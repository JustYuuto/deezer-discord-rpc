import * as RPC from 'discord-rpc';
import { clientId } from './variables';
import { initTrayIcon, setActivity, loadWindow, win, updater, wait } from './functions';
import { app, BrowserWindow } from 'electron';
import { findTrackInAlbum, getAlbum } from './activity/album';
import { getTrack } from './activity/track';

export const client = new RPC.Client({
  transport: 'ipc'
});

app.whenReady().then(async () => {
  await loadWindow();
  await initTrayIcon(app, client);
  await updater(true);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadWindow();
  });
});

rpcClient.on('ready', () => {
  console.log(`[RPC] Authed for user ${rpcClient.user?.username}#${rpcClient.user?.discriminator}`);
});

process.on('beforeExit', () => {
  getConfig(app, 'use_listening_to') ? wsClient?.close() : rpcClient?.destroy();
});