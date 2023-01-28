import * as RPC from 'discord-rpc';
import { CLIENT_ID, ACTIVITY_REFRESH_EVERY } from './variables';
import { initTrayIcon, setActivity, loadWindow, win } from './functions';
import { app, BrowserWindow } from 'electron';
import { findTrackInAlbum } from './activity/album';
import './server';

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
      const playing = !!document.querySelector('#page_player > div > div.player-controls > ul > li:nth-child(3) > button > svg[data-testid="PauseIcon"]');
      const songTime = document.querySelector('#page_player > div > div.player-track > div > div.track-seekbar > div > div.slider-counter-max')?.textContent?.split(':');
      const timeLeft = document.querySelector('#page_player > div > div.player-track > div > div.track-seekbar > div > div.slider-counter-current')?.textContent?.split(':');
      return [albumId, trackName, playing, songTime[0], songTime[1], timeLeft[0], timeLeft[1]].join(',');
    })();`;
    win.webContents.executeJavaScript(code, true).then(async (result) => {
      result = result.split(',');
      const trackId = await findTrackInAlbum(result[1], result[0]);
      const songTime = Date.now() + (((+0) * 60 * 60 + (+result[3]) * 60 + (+result[4])) * 1000);
      const timeLeft = songTime - (((+0) * 60 * 60 + (+result[5]) * 60 + (+result[6])) * 1000);
      await setActivity(client, result[0], trackId, result[2] === 'true', timeLeft);
    });
  }, ACTIVITY_REFRESH_EVERY);
});

client.login({
  clientId: CLIENT_ID
}).catch(console.error);
