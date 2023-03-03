import { ElectronBlocker, fullLists } from '@cliqz/adblocker-electron';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

export default async function (app: Electron.App, win: Electron.BrowserWindow) {
  const blocker = await ElectronBlocker.fromLists(fetch, fullLists, {
    enableCompression: true
  }, {
    path: join(app.getPath('userData'), 'engine.bin'),
    // @ts-ignore
    read: async (...args) => readFileSync(...args),
    // @ts-ignore
    write: async (...args) => writeFileSync(...args),
  });
  blocker.enableBlockingInSession(win.webContents.session);
}