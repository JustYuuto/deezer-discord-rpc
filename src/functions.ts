import { Menu, Tray, BrowserWindow, Notification } from 'electron';
import { USE_AS_MAIN_APP } from './variables';
import * as RPC from 'discord-rpc';
import { resolve, join } from 'path';
import { version } from '../package.json';
import axios from 'axios';

export let win: BrowserWindow;
export async function loadWindow() {
  win = new BrowserWindow({
    width: USE_AS_MAIN_APP ? 1920 : 450,
    height: USE_AS_MAIN_APP ? 1080 : 575,
    minimizable: USE_AS_MAIN_APP,
    maximizable: USE_AS_MAIN_APP,
    closable: true,
    resizable: true,
    webPreferences: {
      preload: !USE_AS_MAIN_APP && resolve(__dirname, 'preload.js')
    }
  });

  win.menuBarVisible = false;

  await win.loadURL('https://www.deezer.com/login', {
    // Windows 10 (x64) with Google Chrome 103.0.0.0
    // The default user agent does not work with Deezer (the player does not update by itself)
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
  });

  win.on('close', (e) => {
    e.preventDefault();
    win.hide();

    return false;
  });
}

export async function initTrayIcon(app: Electron.App) {
  let tray: Tray | null = null;

  app?.whenReady().then(() => {
    tray = new Tray(join(__dirname, 'img', 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Deezer Discord RPC', type: 'normal', enabled: false },
      { label: `Version: ${version}`, type: 'normal', enabled: false },
      { type: 'separator' },
      { label: 'Check for updates', type: 'normal', enabled: true, click: () => {
          getLatestRelease().then((release) => {
            if (release.tag_name !== version) {
              const notification = new Notification({
                title: 'Deezer Discord RPC',
                body: 'New update available, click to update',
                icon: join(__dirname, 'img', 'icon.png')
              });
              notification.on('click', () => {

              });
              notification.show();
            } else {
              win.webContents.executeJavaScript('alert("You are using the latest version.");');
            }
          });
        } },
      // { label: `Start when Windows start`, type: 'checkbox', enabled: true, checked: true },
      USE_AS_MAIN_APP && {
        label: `${win.isVisible() ? 'Hide' : 'Show'} window`, type: 'normal', enabled: true, click: () => win.isVisible() ? win.hide() : win.show()
      },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: () => process.exit() }
    ]);

    tray.setToolTip('Deezer Discord RPC');
    tray.setContextMenu(contextMenu);
    USE_AS_MAIN_APP && tray.on('click', () => win.show());
  });
}

export async function setActivity(options: {
  client: RPC.Client, albumId: number, trackId: number, playing: boolean, timeLeft: number,
  trackTitle: string, trackArtists: any, trackLink: string, albumCover: string, albumTitle: string,
}) {
  const {
    timeLeft, playing, client, albumTitle, trackArtists, trackLink, trackTitle, albumCover
  } = options;
  if (!client) return;

  const buttons = [];
  (trackLink !== undefined) && buttons.push({ label: 'Listen along', url: trackLink });
  buttons.push({
    label: 'View RPC on GitHub', url: 'https://github.com/NetherMCtv/deezer-discord-rpc'
  });
  await client.setActivity({
    details: trackTitle,
    state: trackArtists,
    largeImageKey: albumCover,
    largeImageText: albumTitle,
    instance: false,
    endTimestamp: (USE_AS_MAIN_APP && playing) && timeLeft,
    smallImageKey: 'https://raw.githubusercontent.com/NetherMCtv/deezer-discord-rpc/master/src/img/icon.png',
    smallImageText: `Deezer Discord RPC ${version}`,
    buttons
  });
}

export async function getLatestRelease() {
  const url = 'https://api.github.com/repos/NetherMCtv/deezer-discord-rpc/releases/latest';
  const release = await axios.get(url);
  return release.data;
}
