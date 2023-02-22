import { Menu, Tray, BrowserWindow, shell, dialog } from 'electron';
import { clientId, useAsMainApp } from './variables';
import * as RPC from 'discord-rpc';
import { resolve, join } from 'path';
import { version } from '../package.json';
import axios from 'axios';
import { existsSync, writeFileSync } from 'fs';

export let win: BrowserWindow;
export let tray: Tray | null = null;
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
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
  });

  win.on('close', (e) => {
    e.preventDefault();
    win.hide();

    return false;
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

export function updater() {
  return getLatestRelease()
    .then(release => {
      if (release.tag_name !== version) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Update available',
          buttons: ['Cancel', 'Download'],
          message: `The version ${release.tag_name} is available to download!`,
          defaultId: 0,
        }).then((res) => {
          if (res.response === 1) {
            shell.openExternal(release.assets.find(f => f.name.split('.').pop() === 'exe').browser_download_url);
          }
        });
      } else {
        dialog.showMessageBox(null, {
          type: 'info',
          title: 'No update available',
          message: 'You are using the latest version.',
        });
      }
    })
    .catch(reason => {
      dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['Close', 'Retry'],
        title: 'Cannot get latest release',
        message: 'Cannot get the latest release.',
        detail: reason?.toString(),
      }).then((res) => {
        if (res.response === 1) updater();
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
      { type: 'separator' },
      { label: 'Check for updates', type: 'normal', enabled: true, click: updater },
      {
        label: 'Check for updates on startup', type: 'checkbox', checked: getConfig(app, 'check_for_updates_on_startup'),
        click: (menuItem) => saveConfigKey(app, 'check_for_updates_on_startup', menuItem.checked)
      },
      { type: 'separator' },
      {
        label: 'Hide/show window', type: 'normal', enabled: true, click: () => win.isVisible() ? win.hide() : win.show(),
        visible: useAsMainApp
      },
      {
        label: 'Only show RPC if music is playing', type: 'checkbox', checked: getConfig(app, 'only_show_if_playing'),
        click: (menuItem) => saveConfigKey(app, 'only_show_if_playing', menuItem.checked)
      },
      {
        label: 'Reconnect RPC', type: 'normal', enabled: true, click: () => {
          client.connect(clientId).then(() => console.log('Reconnected to RPC'));
        }
      },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: () => { app.quit(); process.exit(); } }
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
  client: RPC.Client, albumId: number, trackId: number, playing: boolean, timeLeft: number,
  trackTitle: string, trackArtists: any, trackLink: string, albumCover: string, albumTitle: string, app: Electron.App
}) {
  const {
    timeLeft, playing, client, albumTitle, trackArtists, trackLink, trackTitle, albumCover, app
  } = options;
  tray.setToolTip(`${trackArtists} - ${trackTitle}`);
  if (!client) return;

  if (getConfig(app, 'only_show_if_playing') && !playing) {
    await client.clearActivity(process.pid); return;
  }

  const buttons = [];
  if (trackLink !== undefined) buttons.push({ label: 'Listen along', url: trackLink });
  buttons.push({
    label: 'View RPC on GitHub', url: 'https://github.com/NetherMCtv/deezer-discord-rpc'
  });
  await client.setActivity({
    details: trackTitle,
    state: trackArtists,
    largeImageKey: albumCover,
    largeImageText: albumTitle,
    instance: false,
    endTimestamp: (useAsMainApp && playing) && timeLeft,
    smallImageKey: 'https://raw.githubusercontent.com/NetherMCtv/deezer-discord-rpc/master/src/img/icon.png',
    smallImageText: `Deezer Discord RPC ${version}`,
    buttons
  });
}

export async function getLatestRelease() {
  const url = 'https://api.github.com/repos/JustYuuto/deezer-discord-rpc/releases/latest';
  const release = await axios.get(url);
  return release.data;
}
