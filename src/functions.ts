import { Menu, Tray, BrowserWindow } from 'electron';
import {
  getTrackTitle, getTrackCover, getTrackLink, getTrackArtist, getTrackDuration
} from './activity/track';
import {
  getAlbumLink, getAlbumTitle
} from './activity/album';
import ms from 'ms';
import * as RPC from 'discord-rpc';
import { resolve } from 'path';
import { version } from '../package.json';

export async function initTrayIcon(app: Electron.App) {
  let tray: Tray|null = null;

  app?.whenReady().then(() => {
    tray = new Tray(resolve('src', 'img', 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Deezer Discord RPC', type: 'normal', enabled: false },
      { label: `Version: ${version}`, type: 'normal', enabled: false },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: () => app.quit() }
    ]);

    tray.setToolTip('Deezer Discord RPC');
    tray.setContextMenu(contextMenu);
  });
}

export async function loadWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 575,
    minimizable: true,
    maximizable: false,
    resizable: false
  });

  win.webContents.openDevTools();
  win.menuBarVisible = false;

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('deezer.com')) {
      return {
        action: 'allow',
        menuBarVisible: false,
        overrideBrowserWindowOptions: {
          minimizable: false,
          maximizable: false,
          resizable: false,
          autoHideMenuBar: true
        }
      };
    }
    return { action: 'deny' };
  });
  
  win.loadFile(resolve('src', 'app', 'index.html'));
}

export async function setActivity(client: RPC.Client) {
  if (!client) return;
  
  let isPlaying = false;

  client.setActivity({
    details: await getTrackTitle(3135556),
    state: `By ${await getTrackArtist(3135556)}`,
    endTimestamp: new Date().getTime() + ms(await getTrackDuration(3135556) + 's'),
    largeImageKey: await getTrackCover(3135556),
    largeImageText: await getAlbumTitle(302127),
    smallImageKey: isPlaying && 'play' || 'pause',
    smallImageText: isPlaying && 'Playing' || 'Paused',
    instance: false,
    buttons: [
      {
        label: 'See title on Deezer',
        url: await getTrackLink(3135556)
      },
      {
        label: 'See album on Deezer',
        url: await getAlbumLink(302127)
      }
    ]
  });
}