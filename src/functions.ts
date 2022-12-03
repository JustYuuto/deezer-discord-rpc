import { Menu, Tray, BrowserWindow } from 'electron';
import { getTrackTitle, getTrackCover, getTrackArtists, getTrack } from './activity/track';
import { getAlbumTitle } from './activity/album';
import * as RPC from 'discord-rpc';
import { resolve } from 'path';
import { version } from '../package.json';

export async function initTrayIcon(app: Electron.App) {
  let tray: Tray | null = null;

  app?.whenReady().then(() => {
    tray = new Tray(resolve('src', 'img', 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Deezer Discord RPC', type: 'normal', enabled: false },
      { label: `Version: ${version}`, type: 'normal', enabled: false },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: () => process.exit() }
    ]);

    tray.setToolTip('Deezer Discord RPC');
    tray.setContextMenu(contextMenu);
  });
}

export let win: BrowserWindow;
export async function loadWindow() {
  win = new BrowserWindow({
    width: 450,
    height: 575,
    minimizable: false,
    maximizable: false,
    closable: true,
    resizable: true,
    webPreferences: {
      preload: resolve(__dirname, 'preload.js')
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

export async function setActivity(client: RPC.Client, albumId: number, trackId: number) {
  if (!client) return;

  console.log(await getTrack(trackId));
  await client.setActivity({
    details: await getTrackTitle(trackId),
    state: `${await getTrackArtists(trackId)}`,
    largeImageKey: await getTrackCover(trackId),
    largeImageText: await getAlbumTitle(albumId),
    instance: false
  });
}
