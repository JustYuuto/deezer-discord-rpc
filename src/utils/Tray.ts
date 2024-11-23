import { join } from 'path';
import updater from './Updater';
import * as Config from './Config';
import * as RPC from './RPC';
import { Menu, Tray } from 'electron';
import { version } from '../../package.json';
import { log } from './Log';
import { win } from './Window';

const iconPath = join(__dirname, '..', 'img', 'tray.png');

export let tray: Tray | null = null;
export async function init(app: Electron.App, client: import('@xhayper/discord-rpc').Client) {
  app?.whenReady().then(() => {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Deezer Discord RPC', type: 'normal', click: () => win.show() },
      { label: `Version: ${version}${process.argv0.includes('node') ? ' (debug)' : ''}`, type: 'normal', enabled: false },
      { label: 'Check for updates', type: 'normal', click: () => updater() },
      { type: 'separator' },
      {
        label: 'Tooltip text', type: 'submenu', submenu: [
          ['App name', 'app_name'],
          ['App version', 'app_version'],
          ['App name and version', 'app_name_and_version'],
          ['Artists song - Song title', 'artists_and_title'],
          ['Song title - Artists song', 'title_and_artists'],
        ].map(v => ({
          label: v[0], type: 'radio', id: v[1], checked: Config.get(app, 'tooltip_text') === v[1],
          click: (menuItem) => Config.set(app, 'tooltip_text', menuItem.id)
        }))
      },
      {
        label: 'Don\'t close to tray', type: 'checkbox', checked: Config.get(app, 'dont_close_to_tray'),
        click: (menuItem) => Config.set(app, 'dont_close_to_tray', menuItem.checked)
      },
      {
        id: 'reconnect',
        label: 'Reconnect RPC',
        type: 'normal',
        visible: false,
        click: () => {
          client.login()
            .then(() => {
              log('RPC', 'Reconnected');
            })
            .catch(console.error);
        }
      },
      { type: 'separator' },
      {
        label: 'Quit', type: 'normal', click: async () => {
          RPC.disconnect().catch(console.error);
          win.close();
          app.quit();
          process.exit(0);
        }
      }
    ]);

    tray.setToolTip('Deezer Discord RPC');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (!win.isVisible()) win.show();
    });
  });
}
