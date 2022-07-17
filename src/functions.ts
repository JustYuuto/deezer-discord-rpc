import { app, Menu, Tray } from 'electron';

export async function initTrayIcon() {
  let tray: Tray|null = null;
  app?.whenReady().then(() => {
    tray = new Tray('/path/to/my/icon')
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Item1', type: 'radio' },
      { label: 'Item2', type: 'radio' },
      { label: 'Item3', type: 'radio', checked: true },
      { label: 'Item4', type: 'radio' }
    ])
    tray.setToolTip('Deezer Discord RPC');
    tray.setContextMenu(contextMenu);
  });
}