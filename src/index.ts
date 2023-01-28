import * as RPC from 'discord-rpc';
import { CLIENT_ID } from './variables';
import { initTrayIcon, setActivity, loadWindow, win } from './functions';
import { app, BrowserWindow } from 'electron';
import { findTrackInAlbum, getAlbum } from './activity/album';
import './server';
import { getTrack } from './activity/track';

const client = new RPC.Client({
  transport: 'ipc'
});

app.whenReady().then(async () => {
  await loadWindow();
  await initTrayIcon(app);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadWindow();
  });
});

client.on('ready', () => {
  console.log([
    `Authed for user ${client.user?.username}#${client.user?.discriminator}`
  ].join('\n'));

  win.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      let currentTrack;
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
          const songTime = Date.now() + (((+0) * 60 * 60 + (+result[3]) * 60 + (+result[4])) * 1000);
          const timeLeft = songTime - (((+0) * 60 * 60 + (+result[5]) * 60 + (+result[6])) * 1000);
          if (currentTrack?.title !== result[1]) {
            const trackId = await findTrackInAlbum(result[1], result[0]);
            currentTrack = {
              id: trackId, title: (await getTrack(trackId)).title, contributors: (await getTrack(trackId)).contributors,
              link: (await getTrack(trackId)).link, albumCover: (await getAlbum(result[0])).cover_medium,
              albumTitle: (await getAlbum(result[0])).title,
            };
            await setActivity({
              client, albumId: result[0], trackId, playing: result[2] === 'true', timeLeft, trackTitle: (await getTrack(trackId)).title,
              trackArtists: (await getTrack(trackId)).contributors?.map(c => c.name)?.join(', '), trackLink: (await getTrack(trackId)).link,
              albumCover: (await getAlbum(result[0])).cover_medium, albumTitle: (await getAlbum(result[0])).title,
            });
          } else {
            if (!currentTrack) {
              const trackId = await findTrackInAlbum(result[1], result[0]);
              currentTrack = {
                id: trackId, title: (await getTrack(trackId)).title, contributors: (await getTrack(trackId)).contributors,
                link: (await getTrack(trackId)).link, albumCover: (await getAlbum(result[0])).cover_medium,
                albumTitle: (await getAlbum(result[0])).title,
              };
            }
            await setActivity({
              client, albumId: result[0], trackId: currentTrack?.id, playing: result[2] === 'true', timeLeft,
              trackTitle: currentTrack?.title, trackArtists: currentTrack?.contributors?.map(c => c.name)?.join(', '),
              trackLink: currentTrack?.link, albumCover: currentTrack?.albumCover, albumTitle: currentTrack?.albumTitle,
            });
          }
          currentTrack.title = result[1];
        });
      }, 500);
    }, 5000);
  });
});

client.login({ clientId: CLIENT_ID }).catch(console.error);
