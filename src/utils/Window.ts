import { artistsSeparator, useAsMainApp, userAgents } from '../variables';
import { resolve } from 'path';
import loadAdBlock from './AdBlock';
import * as Config from './Config';
import * as DiscordWebSocket from './WebSocket';
import * as RPC from './RPC';
import { log } from './Log';
import { findTrackInAlbum, getAlbum } from '../activity/album';
import { getTrack } from '../activity/track';
import * as Spotify from './Spotify';
import { runJs, wait } from '../functions';
import { BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { setActivity } from './Activity';

export let win: BrowserWindow;
let currentTrack;

export async function load(app: Electron.App) {
  win = new BrowserWindow({
    width: useAsMainApp ? 1920 : 450,
    height: useAsMainApp ? 1080 : 575,
    minimizable: useAsMainApp,
    maximizable: useAsMainApp,
    closable: true,
    resizable: true,
    webPreferences: {
      preload: resolve(__dirname, '..', 'preload.js')
    }
  });

  await loadAdBlock(app, win);

  const trayMenu = Menu.buildFromTemplate([
    process.platform === 'darwin' && { role: 'appMenu' },
    {
      label: 'Player',
      type: 'submenu',
      submenu: [
        {
          label: 'Play/Pause',
          accelerator: 'Shift+Space',
          click: () => {
            const code = 'document.querySelector(\'.player-controls > .svg-icon-group > .svg-icon-group-item:nth-child(3) > button\')?.click()';
            runJs(win, code);
          }
        },
        {
          label: 'Previous',
          accelerator: 'Shift+Left'
        },
        {
          label: 'Next',
          accelerator: 'Shift+Right'
        },
        { type: 'separator' },
        {
          id: 'shuffle_mode',
          label: 'Shuffle mode',
          type: 'checkbox',
          click: async () => await runJs(win, 'document.querySelector(\'.player-options .svg-icon-group > .svg-icon-group-item:nth-child(3) > button\')?.click()'),
          checked: false, enabled: false
        }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]);

  Menu.setApplicationMenu(trayMenu);
  win.setMenu(trayMenu);
  win.setMenuBarVisibility(true);

  await win.loadURL('https://www.deezer.com/login', {
    // The default user agent does not work with Deezer (the player does not update by itself)
    userAgent: userAgents.deezerApp
  });

  const updateMenu = async () => {
    log('Menu', 'Updating menu entries...');
    Menu.getApplicationMenu().getMenuItemById('shuffle_mode').enabled = true;
    const shuffleJs = 'document.querySelector(\'.player-options .svg-icon-group > .svg-icon-group-item:nth-child(3) > button > svg\')?.classList?.contains(\'css-1qsky21\')';
    Menu.getApplicationMenu().getMenuItemById('shuffle_mode').checked = await runJs(win, shuffleJs);

    log('Menu', 'Updated menu entries');
    win.removeListener('page-title-updated', () => {});
  };

  win.on('page-title-updated', updateMenu);
  win.webContents.on('devtools-reload-page', updateMenu);

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  win.on('close', (e) => {
    e.preventDefault();
    win.hide();

    return false;
  });

  wait(5000).then(() => {
    runJs(win, `document.querySelector('.slider-track-input.mousetrap').addEventListener('click', () => ipcRenderer.send('update_activity', 'update_activity'))`);
    ipcMain.on('update_activity', () => updateActivity(app, true));
    setInterval(() => updateActivity(app), 1000);
  });
}

async function updateActivity(app: Electron.App, currentTimeChanged?: boolean) {
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
  runJs(win, code, true).then(async (result) => {
    result = JSON.parse(result);
    const lengthFormat = (minutes: string, seconds: string): number => ((+0) * 60 * 60 + (+minutes) * 60 + (+seconds)) * 1000;
    const songTime = Date.now() + lengthFormat(result.songTime.minutes, result.songTime.seconds);
    const timeLeft = songTime - lengthFormat(result.timeLeft.minutes, result.timeLeft.seconds);
    if (currentTrack?.trackTitle !== result.trackName || currentTrack?.playing !== result.playing || currentTimeChanged === true) {
      let reason;
      if (currentTrack?.trackTitle !== result.trackName) reason = 'music got changed';
      else if (currentTrack?.playing !== result.playing) reason = `music got ${result.playing ? 'played' : 'paused'}`;
      else if (currentTimeChanged && currentTimeChanged === true) reason = 'current song time changed';
      log('Activity', 'Updating because', reason);
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
            albumTitle: album.title, title: track.title, artists: track.contributors?.map(c => c.name)?.join(', ')
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
}
