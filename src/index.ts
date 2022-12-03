import * as RPC from 'discord-rpc';
import { CLIENT_ID, ACTIVITY_REFRESH_EVERY } from './variables';
import { initTrayIcon, setActivity, loadWindow, win } from './functions';
import { app, BrowserWindow } from 'electron';
import { findTrackInAlbum } from './activity/album';

const client = new RPC.Client({
  transport: 'ipc'
});

app.whenReady().then(async () => {
  await initTrayIcon(app);
  await loadWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadWindow();
  });
});

client.on('ready', () => {
  console.log([
    `Authed for user ${client.user?.username}#${client.user?.discriminator}`
  ].join('\n'));

  setInterval(() => {
    let code =
    `(() => {
      const albumId = document.querySelector('.track-link[href*="album"]')?.getAttribute('href').split('/')[3];
      const trackName = document.querySelector('.track-link[href*="album"]')?.textContent;
      return albumId + ',' + trackName;
    })();`;
    win.webContents.executeJavaScript(code, true).then(async (result) => {
      const trackId = await findTrackInAlbum(result.split(',')[1], result.split(',')[0]);
      await setActivity(client, result.split(',')[0], trackId);
    });

  }, ACTIVITY_REFRESH_EVERY);
});

client.login({ clientId: CLIENT_ID }).catch(console.error);
