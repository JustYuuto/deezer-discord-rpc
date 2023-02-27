import { BrowserWindow, dialog, Menu, shell, Tray, ipcMain, app } from 'electron';
import { clientId, useAsMainApp, userAgent } from './variables';
import * as RPC from 'discord-rpc';
import { resolve, join } from 'path';
import { version } from '../package.json';
import axios from 'axios';
import { existsSync, writeFileSync } from 'fs';
import { noRPC, rpcClient } from './index';
import { findTrackInAlbum, getAlbum } from './activity/album';
import { getTrack } from './activity/track';
import WebSocket from 'ws';
import UAParser from 'ua-parser-js';
import { log } from './utils/Log';

export let win: BrowserWindow;
export let tray: Tray | null = null;
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

  win.menuBarVisible = false;

  await win.loadURL('https://www.deezer.com/login', {
    // Windows 10 (x64) with Google Chrome 110.0.0.0
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
      const client = getConfig(app, 'use_listening_to') ? wsClient : rpcClient;
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
            trackId,
            trackTitle: track.title,
            trackArtists: track.contributors?.map(c => c.name)?.join(', '),
            trackLink: track.link,
            albumCover: album.cover_medium,
            albumTitle: album.title,
            app
          };
          await setActivity({
            client, albumId: result.albumId, playing: result.playing, timeLeft, app, ...currentTrack, songTime
          });
        } else {
          if (!currentTrack) {
            const trackId = await findTrackInAlbum(result.trackName, result.albumId);
            const track = await getTrack(trackId);
            const album = await getAlbum(result.albumId);
            currentTrack = {
              trackId,
              trackTitle: track.title,
              trackArtists: track.contributors?.map(c => c.name)?.join(', '),
              trackLink: track.link,
              albumCover: album.cover_medium,
              albumTitle: album.title,
              app
            };
          }
          await setActivity({
            client, albumId: result.albumId, playing: result.playing, timeLeft, app, ...currentTrack, songTime
          });
        }
        currentTrack.title = result.trackName;
      });
    }, 1000);
  });
}

export function saveConfigKey(app: Electron.App, key: string, value: any) {
  const userDataPath = app.getPath('userData');
  const path = join(userDataPath, 'config.json');
  if (!existsSync(path)) writeFileSync(path, '{}');
  const data = require(path);
  data[key] = value;
  writeFileSync(path, JSON.stringify(data));
}

export function getConfig(app: Electron.App, key?: string) {
  const userDataPath = app.getPath('userData');
  const path = join(userDataPath, 'config.json');
  if (!existsSync(path)) writeFileSync(path, '{}');
  const data = require(path);
  return key ? data[key] : data;
}

export function updater(fromStartup: boolean = false) {
  log('Updater', 'Checking for updates...');
  return getLatestRelease()
    .then(release => {
      if (release.tag_name !== version) {
        log('Updater', 'The version', release.tag_name, 'is available to download!');
        dialog.showMessageBox({
          type: 'info',
          title: 'Update available',
          buttons: ['Cancel', 'Download'],
          message: `The version ${release.tag_name} is available to download!`,
          defaultId: 0,
        }).then(({ response }) => {
          if (response === 1) {
            shell.openExternal(release.assets.find(f => f.name.split('.').pop() === 'exe').browser_download_url);
          }
        });
      } else {
        log('Updater', 'No updates found.');
        if (!fromStartup)
          dialog.showMessageBox(null, {
            type: 'info',
            title: 'No update available',
            message: 'You are using the latest version.',
          });
      }
    })
    .catch(reason => {
      log('Updater', 'Cannot get the latest release:', reason?.toString());
      dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['Close', 'Retry'],
        title: 'Cannot get latest release',
        message: 'Cannot get the latest release.',
        detail: reason?.toString(),
      }).then(({ response }) => {
        if (response === 1) updater();
      });
    });
}

export async function initTrayIcon(app: Electron.App, client: RPC.Client) {
  app?.whenReady().then(() => {
    const iconPath = join(__dirname, 'img', 'icon.ico');
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Deezer Discord RPC', type: 'normal', enabled: false },
      { label: `Version: ${version}`, type: 'normal', enabled: false },
      { label: 'Check for updates', type: 'normal', enabled: true, click: () => updater() },
      { type: 'separator' },
      {
        label: 'Hide/show window',
        type: 'normal',
        enabled: true,
        click: () => win.isVisible() ? win.hide() : win.show(),
        visible: useAsMainApp
      },
      {
        label: 'Tooltip text', type: 'submenu', submenu: [
          ['App name', 'app_name'],
          ['App version', 'app_version'],
          ['App name and version', 'app_name_and_version'],
          ['Artists song - Song title', 'artists_and_title'],
          ['Song title - Artists song', 'title_and_artists'],
        ].map(v => ({
          label: v[0], type: 'radio', id: v[1], checked: getConfig(app, 'tooltip_text') === v[1],
          click: (menuItem) => saveConfigKey(app, 'tooltip_text', menuItem.id)
        }))
      },
      {
        label: 'Only show RPC if music is playing', type: 'checkbox', checked: getConfig(app, 'only_show_if_playing'),
        click: (menuItem) => saveConfigKey(app, 'only_show_if_playing', menuItem.checked)
      },
      {
        label: 'Reconnect RPC',
        type: 'normal',
        enabled: true,
        click: () => client.connect(clientId).then(() => console.log('Reconnected to RPC'))
      },
      {
        label: 'Use "Listening to" instead of "Playing"', type: 'checkbox', checked: getConfig(app, 'use_listening_to'),
        click: async (menuItem) => {
          if (!menuItem.checked) {
            menuItem.enabled = false;
            menuItem.checked = true;
            await dialog.showMessageBox(null, {
              type: 'question',
              buttons: ['No', 'Yes'],
              title: 'Listening to status',
              message: 'Do you want to disable the Listening to status and use the Playing status?',
            }).then(({ response }) => {
              menuItem.enabled = true;
              if (response === 1) {
                menuItem.checked = false;
                saveConfigKey(app, 'use_listening_to', false);
                rpcClient.login({ clientId }).catch(() => rpcClient.connect(clientId).catch(console.error));
              }
            });
          } else {
            await prompt('ws', app);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit', type: 'normal', click: () => {
          app.quit();
          process.exit();
        }
      }
    ]);

    tray.setToolTip('Deezer Discord RPC');
    tray.setContextMenu(contextMenu);
    useAsMainApp && tray.on('click', () => win.show());
    win.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  });
}

export async function setActivity(options: {
  client: RPC.Client | WebSocket, albumId: number, trackId: number, playing: boolean, timeLeft: number,
  trackTitle: string, trackArtists: any, trackLink: string, albumCover: string, albumTitle: string, app: Electron.App,
  songTime: number
}) {
  const {
    timeLeft, playing, client, albumTitle, trackArtists, trackLink, trackTitle, albumCover, app
  } = options;
  const tooltipText = getConfig(app, 'tooltip_text');
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

  if (getConfig(app, 'only_show_if_playing') && !playing) {
    if (client instanceof RPC.Client) {
      await client.clearActivity(process.pid);
      return;
    } else {
      client.close();
      return;
    }
  }

  const buttons = [];
  if (trackLink !== undefined) buttons.push({ label: 'Listen along', url: trackLink });
  buttons.push({
    label: 'View RPC on GitHub', url: 'https://github.com/JustYuuto/deezer-discord-rpc'
  });
  if (client instanceof RPC.Client) {
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
              // start: (useAsMainApp && playing) && Date.now() - songTime,
              end: (useAsMainApp && playing) && timeLeft
            },
            party: {
              id: 'ae488379-351d-4a4f-ad32-2b9b01c91657'
            },
            application_id: parseInt(clientId),
            assets: {
              large_image: albumCover,
              large_text: albumTitle,
              small_image_url: 'https://raw.githubusercontent.com/JustYuuto/deezer-discord-rpc/master/src/img/icon.png',
              small_text: `Deezer Discord RPC ${version}`
            }
          }
        ]
      }
    }));
  }
}

export async function getLatestRelease() {
  const url = 'https://api.github.com/repos/JustYuuto/deezer-discord-rpc/releases/latest';
  const release = await axios.get(url);
  return release.data;
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
    saveConfigKey(app, 'discord_token', data);
    saveConfigKey(app, 'use_listening_to', true);
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
    discordWebSocket(data).catch(console.error);
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
  win.setMenuBarVisibility(false);
  await win.loadFile(join(__dirname, 'prompt.html'), { hash: message });
}

export let wsClient: WebSocket;

export function discordWebSocket(token: string) {
  return new Promise<void>((resolve, reject) => {
    const socket = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json', {
      headers: {
        'User-Agent': userAgent,
        Origin: 'https://discord.com'
      }
    });
    const ua = new UAParser(userAgent);
    const payload = {
      op: 2,
      d: {
        token,
        capabilities: 4093,
        properties: {
          os: ua.getOS().name,
          browser: ua.getBrowser().name,
          device: '',
          system_locale: 'en-US',
          browser_user_agent: userAgent,
          browser_version: ua.getBrowser().version,
          os_version: ua.getOS().version,
          referrer: 'https://discord.com/developers/docs/resources/invite',
          referring_domain: 'discord.com',
          referrer_current: '',
          referring_domain_current: '',
          release_channel: 'stable',
          client_build_number: 176471,
          client_event_source: null
        },
        presence: {
          activities: []
        }
      }
    };

    socket.on('open', async () => {
      if (!noRPC) {
        await rpcClient.clearActivity(process.pid);
        await rpcClient.destroy();
      }
      console.log('[WebSocket] Connected to Discord WebSocket server');
      resolve();
      wsClient = socket;

      socket.send(JSON.stringify(payload), () => {
        console.log('[WebSocket] Sent authentication payload');
      });
    });

    socket.on('error', reject);

    socket.on('message', (data) => {
      const payload = JSON.parse(data.toString());
      const { d, op } = payload;

      switch (op) {
        case 10:
          const { heartbeat_interval } = d;
          heartbeat(heartbeat_interval);
          break;
      }
    });

    socket.on('close', (code, desc) => {
      console.log('[WebSocket]', code + ':', desc.toString());
      console.log('[WebSocket] Connection closed; sending authentication payload');
      socket.send(JSON.stringify(payload));
    });

    function heartbeat(ms: number) {
      return setInterval(() => socket.send(JSON.stringify({ op: 1, d: null })), ms);
    }
  });
}