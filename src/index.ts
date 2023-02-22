import * as RPC from 'discord-rpc';
import { clientId } from './variables';
import { initTrayIcon, setActivity, loadWindow, win, updater, wait } from './functions';
import { app, BrowserWindow } from 'electron';
import { findTrackInAlbum, getAlbum } from './activity/album';
import { getTrack } from './activity/track';

const client = new RPC.Client({
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

client.on('ready', () => {
  console.log([
    `Deezer Discord RPC version ${require('../package.json').version}`,
    `Authed for user ${client.user?.username}#${client.user?.discriminator}`
  ].join('\n'));

  win.webContents.on('did-finish-load', () => {
    wait(5000).then(() => {
      let currentTrack;
      setInterval(() => {
        let code =
          `(() => {
            const albumId = document.querySelector('.track-link[href*="album"]')?.getAttribute('href').split('/')[3];
            const trackName = document.querySelector('.track-link[href*="album"]')?.textContent;
            const playing = !!document.querySelector('#page_player > div > div.player-controls > ul > li:nth-child(3) > button > svg[data-testid="PauseIcon"]');
            const songTime = document.querySelector('#page_player > div > div.player-track > div > div.track-seekbar > div > div.slider-counter-max')?.textContent?.split(':');
            const timeLeft = document.querySelector('#page_player > div > div.player-track > div > div.track-seekbar > div > div.slider-counter-current')?.textContent?.split(':');
            return JSON.stringify({ albumId, trackName, playing, songTime: { minutes: songTime[0], seconds: songTime[1] }, timeLeft: { minutes: timeLeft[0], seconds: timeLeft[1] } });
          })();`;
        win.webContents.executeJavaScript(code, true).then(async (result) => {
          result = JSON.parse(result);
          const songTime = Date.now() + (((+0) * 60 * 60 + (+result.songTime.minutes) * 60 + (+result.songTime.seconds)) * 1000);
          const timeLeft = songTime - (((+0) * 60 * 60 + (+result.timeLeft.minutes) * 60 + (+result.timeLeft.seconds)) * 1000);
          if (currentTrack?.title !== result.trackName) {
            const trackId = await findTrackInAlbum(result.trackName, result.albumId);
            const track = await getTrack(trackId);
            const album = await getAlbum(result.albumId);
            currentTrack = {
              trackId, trackTitle: track.title, trackArtists: track.contributors?.map(c => c.name)?.join(', '), trackLink: track.link,
              albumCover: album.cover_medium, albumTitle: album.title, app
            };
            await setActivity({
              client, albumId: result.albumId, playing: result.playing, timeLeft, app, ...currentTrack
            });
          } else {
            if (!currentTrack) {
              const trackId = await findTrackInAlbum(result.trackName, result.albumId);
              const track = await getTrack(trackId);
              const album = await getAlbum(result.albumId);
              currentTrack = {
                trackId, trackTitle: track.title, trackArtists: track.contributors?.map(c => c.name)?.join(', '), trackLink: track.link,
                albumCover: album.cover_medium, albumTitle: album.title, app
              };
            }
            await setActivity({
              client, albumId: result.albumId, playing: result.playing, timeLeft, app, ...currentTrack
            });
          }
          currentTrack.title = result.trackName;
        });
      }, 500);
    });
  });
});

client.login({ clientId }).catch(console.error);
