import * as RPC from 'discord-rpc';
import { CLIENT_ID, ACTIVITY_REFRESH_EVERY } from './variables';
import { initTrayIcon, setActivity, loadWindow, win } from './functions';
import { app, BrowserWindow, Notification } from 'electron';
import { findTrackInAlbum } from './activity/album';

const client = new RPC.Client({
  transport: 'ipc'
});

app.whenReady().then(() => {
  initTrayIcon(app);
  loadWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadWindow();
  });
});

app.on('window-all-closed', () => {
  const notification = new Notification({
    title: 'Deezer Discord RPC',
    body: 'The RPC launched in background mode. Click on the tray icon to show the window.'
  });
  notification.show();
})

client.on('ready', () => {
  console.log([
    `Logged in as ${client.application?.name}`,
    `Authed for user ${client.user?.username}#${client.user?.discriminator}`
  ].join('\n'));

  setInterval(() => {
    let code =
    `(() => {
      const albumId = document.querySelector('.track-link[href*="album"]')?.getAttribute('href').split('/')[3];
      const trackName = document.querySelector('.track-link[href*="album"]')?.textContent;
      const artistId = document.querySelector('.track-link[href*="artist"]')?.getAttribute('href').split('/')[3];
      return albumId + ',' + trackName + ',' + artistId;
    })();`;
    win.webContents.executeJavaScript(code, true).then(async (result) => {
      const trackId = await findTrackInAlbum(result.split(',')[1], result.split(',')[0]);
      setActivity(client, result.split(',')[0], result.split(',')[2], trackId);
    });
    
  }, ACTIVITY_REFRESH_EVERY);
});

client.login({ clientId: CLIENT_ID }).catch(console.error);