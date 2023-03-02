import { BrowserWindow, dialog, shell, ipcMain, app } from 'electron';
import { artistsSeparator, clientId, noWsActivity, useAsMainApp, userAgent } from './variables';
import { resolve, join } from 'path';
import { version } from '../package.json';
import { findTrackInAlbum, getAlbum } from './activity/album';
import { getTrack } from './activity/track';
import WebSocket from 'ws';
import * as Config from './utils/Config';
import { tray } from './utils/Tray';
import * as DiscordWebSocket from './utils/WebSocket';
import * as RPC from './utils/RPC';
import * as Spotify from './utils/Spotify';
import { log } from './utils/Log';

export let win: BrowserWindow;
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loadWindow() {
  win = new BrowserWindow({
    width: useAsMainApp ? 1920 : 450,
    height: useAsMainApp ? 1080 : 575,
    minimizable: useAsMainApp,
    maximizable: useAsMainApp,
    closable: true,
    resizable: true,
    webPreferences: {
      preload: !useAsMainApp && resolve(__dirname, 'preload.js')
    }
  });

  win.setMenuBarVisibility(false);
  await win.loadURL('https://www.deezer.com/login', {
    // The default user agent does not work with Deezer (the player does not update by itself)
    userAgent
  });

  win.on('close', (e) => {
    e.preventDefault();
    win.hide();

    return false;
  });

  wait(5000).then(() => {
    let currentTrack;
    setInterval(() => {
      const client = (Config.get(app, 'use_listening_to') ? DiscordWebSocket : RPC).client;
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
        if (currentTrack?.trackTitle !== result.trackName || currentTrack?.playing !== result.playing) {
          let reason;
          if (currentTrack?.trackTitle !== result.trackName) reason = `music got changed`;
          else if (currentTrack?.playing !== result.playing) reason = `music got ${result.playing ? 'played' : 'paused'}`;
          log('Activity', `Updating because ${reason}`);
          const trackId = await findTrackInAlbum(result.trackName, result.albumId);
          const track = await getTrack(trackId);
          const album = await getAlbum(result.albumId);
          currentTrack = {
            trackId,
            trackTitle: track.title,
            trackArtists: track.contributors?.map(c => c.name)?.join(artistsSeparator),
            trackLink: track.link,
            albumCover: Config.get(app, 'use_listening_to') ?
              await Spotify.getCover({
                title: track.title, artists: track.contributors?.map(c => c.name)?.join(', ')
              }, app).catch(async () => {
                log('Spotify Covers', 'Access token expired; refreshing it');
                await Spotify.accessToken(Config.get(app, 'spotify_refresh_token')).then((res) => {
                  const { access_token, expires_in, token_type } = res.data;
                  Config.set(app, 'spotify_access_token', access_token);
                  Config.set(app, 'spotify_expires_at', Date.now() + expires_in);
                  Config.set(app, 'spotify_token_type', token_type);
                });
              }) :
              album.cover_medium,
            albumTitle: album.title,
            playing: result.playing
          };
          await setActivity({
            client, albumId: result.albumId, timeLeft, app, ...currentTrack, songTime
          }).then(() => log('Activity', 'Updated'));
        }
        currentTrack.trackTitle = result.trackName;
        currentTrack.playing = result.playing;
      });
    }, 1000);
  });
}

export async function setActivity(options: {
  client: import('discord-rpc').Client | WebSocket, albumId: number, trackId: number, playing: boolean, timeLeft: number,
  trackTitle: string, trackArtists: any, trackLink: string, albumCover: string, albumTitle: string, app: Electron.App,
  songTime: number
}) {
  const {
    timeLeft, playing, client, albumTitle, trackArtists, trackLink, trackTitle, albumCover, app, songTime
  } = options;
  const tooltipText = Config.get(app, 'tooltip_text');
  switch (tooltipText) {
    case 'app_name':
      tray.setToolTip('Deezer Discord RPC');
      break;
    case 'app_version':
      tray.setToolTip(`Version ${version}`);
      break;
    case 'app_name_and_version':
      tray.setToolTip(`Deezer Discord RPC version ${version}`);
      break;
    case 'artists_and_title':
      tray.setToolTip(`${trackArtists} - ${trackTitle}`);
      break;
    case 'title_and_artists':
      tray.setToolTip(`${trackTitle} - ${trackArtists}`);
      break;
  }
  if (!client) return;
  const isRPC = 'destroy' in client;

  if (Config.get(app, 'only_show_if_playing') && !playing) {
    if (isRPC) {
      await client.clearActivity(process.pid);
      return;
    } else {
      client.send(JSON.stringify(noWsActivity));
      return;
    }
  }

  const buttons = [];
  if (trackLink !== undefined) buttons.push({ label: 'Listen along', url: trackLink });
  buttons.push({
    label: 'View RPC on GitHub', url: 'https://github.com/JustYuuto/deezer-discord-rpc'
  });
  if (isRPC) {
    await client.setActivity({
      details: trackTitle,
      state: trackArtists,
      largeImageKey: albumCover,
      largeImageText: albumTitle,
      instance: false,
      endTimestamp: (useAsMainApp && playing) && timeLeft,
      smallImageKey: 'https://raw.githubusercontent.com/JustYuuto/deezer-discord-rpc/master/src/img/icon.png',
      smallImageText: `Deezer Discord RPC ${version}`,
      buttons
    }).catch(() => {});
  } else {
    client.send(JSON.stringify({
      op: 3,
      d: {
        status: 'online',
        since: 0,
        afk: false,
        activities: [
          {
            type: 2,
            name: 'Deezer',
            details: trackTitle,
            state: trackArtists,
            timestamps: {
              start: (useAsMainApp && playing) && songTime - Date.now(),
              end: (useAsMainApp && playing) && timeLeft
            },
            application_id: clientId,
            assets: {
              large_image: `spotify:${albumCover}`,
              large_text: albumTitle,
              small_image: '1080780582423892000', // Image ID seems to work better, idk that's the Discord API after all....
              small_text: `Deezer Discord RPC ${version}`
            }
          }
        ]
      }
    }));
  }
}

export async function prompt(message: string, app: Electron.App, options?: {
  closable?: boolean
}) {
  const win = new BrowserWindow({
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: typeof options?.closable !== 'undefined' ? options?.closable : true,
    webPreferences: {
      preload: join(__dirname, 'prompt.js')
    }
  });

  ipcMain.on('token-received', async (e, data) => {
    Config.set(app, 'discord_token', data);
    Config.set(app, 'use_listening_to', true);
    win.close();
    await dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Restart later', 'Restart now'],
      title: 'App restart needed',
      message: 'The app needs to be restarted to apply the changes.',
    }).then(({ response }) => {
      if (response === 1) {
        app.relaunch();
        app.exit();
      }
    });
    DiscordWebSocket.connect(data).catch(console.error);
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
  win.setMenuBarVisibility(false);
  await win.loadFile(join(__dirname, 'prompt.html'), { hash: message });
}
