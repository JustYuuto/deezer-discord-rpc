import { BrowserWindow, dialog, Menu, shell, Tray, ipcMain } from 'electron';
import { clientId, useAsMainApp } from './variables';
import * as RPC from 'discord-rpc';
import { resolve, join } from 'path';
import { version } from '../package.json';
import axios from 'axios';
import { existsSync, writeFileSync } from 'fs';
import { client as rpcClient } from './index';

const WebSocket = require('websocket').client;

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

export function updater(fromStartup: boolean = false) {
  console.log('Checking for updates...');
  return getLatestRelease()
    .then(release => {
      if (release.tag_name !== version) {
        console.log(`The version ${release.tag_name} is available to download!`);
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
        console.log('No updates found.');
        if (!fromStartup)
          dialog.showMessageBox(null, {
            type: 'info',
            title: 'No update available',
            message: 'You are using the latest version.',
          });
      }
    })
    .catch(reason => {
      console.log(`Cannot get the latest release: ${reason?.toString()}`);
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
        label: 'Hide/show window', type: 'normal', enabled: true, click: () => win.isVisible() ? win.hide() : win.show(),
        visible: useAsMainApp
      },
      {
        label: 'Tooltip text', type: 'submenu', submenu: [
          {
            label: 'App name', type: 'radio', id: 'app_name', checked: getConfig(app, 'tooltip_text') === 'app_name',
            click: (menuItem) => saveConfigKey(app, 'tooltip_text', menuItem.id)
          },
          {
            label: 'App version', type: 'radio', id: 'app_version', checked: getConfig(app, 'tooltip_text') === 'app_version',
            click: (menuItem) => saveConfigKey(app, 'tooltip_text', menuItem.id)
          },
          {
            label: 'App name and version', type: 'radio', id: 'app_name_and_version', checked: getConfig(app, 'tooltip_text') === 'app_name_and_version',
            click: (menuItem) => saveConfigKey(app, 'tooltip_text', menuItem.id)
          },
          {
            label: 'Artists song - Song title', type: 'radio', id: 'artists_and_title', checked: getConfig(app, 'tooltip_text') === 'artists_and_title',
            click: (menuItem) => saveConfigKey(app, 'tooltip_text', menuItem.id)
          },
          {
            label: 'Song title - Artists song', type: 'radio', id: 'title_and_artists', checked: getConfig(app, 'tooltip_text') === 'title_and_artists',
            click: (menuItem) => saveConfigKey(app, 'tooltip_text', menuItem.id)
          }
        ]
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
  const tooltipText = getConfig(app, 'tooltip_text');
  switch (tooltipText) {
    case 'app_name':
      tray.setToolTip('Deezer Discord RPC'); break;
    case 'app_version':
      tray.setToolTip(`Version ${version}`); break;
    case 'app_name_and_version':
      tray.setToolTip(`Deezer Discord RPC version ${version}`); break;
    case 'artists_and_title':
      tray.setToolTip(`${trackArtists} - ${trackTitle}`); break;
    case 'title_and_artists':
      tray.setToolTip(`${trackTitle} - ${trackArtists}`); break;
  }
  if (!client) return;

  if (getConfig(app, 'only_show_if_playing') && !playing) {
    await client.clearActivity(process.pid); return;
  }

  const buttons = [];
  if (trackLink !== undefined) buttons.push({ label: 'Listen along', url: trackLink });
  buttons.push({
    label: 'View RPC on GitHub', url: 'https://github.com/JustYuuto/deezer-discord-rpc'
  });
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
  });
}

export async function getLatestRelease() {
  const url = 'https://api.github.com/repos/JustYuuto/deezer-discord-rpc/releases/latest';
  const release = await axios.get(url);
  return release.data;
}

export async function prompt(message: string, options?: {
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

  ipcMain.on('token-received', (e, data) => {
    console.log(data);
  });

  win.setMenuBarVisibility(false);
  await win.loadFile(join(__dirname, 'prompt.html'), { hash: message });
}