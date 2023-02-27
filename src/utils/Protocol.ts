import { protocol } from '../variables';
import { resolve } from 'path';
import * as Spotify from './Spotify';
import { dialog } from 'electron';

export function register(app: Electron.App) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(protocol, process.execPath, [resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(protocol);
  }
}

export function handle(app: Electron.App) {
  if (process.platform === 'win32') {
    handleWindows(app);
  } else {
    handleLinuxMacOS(app);
  }
}

function handleWindows(app: Electron.App) {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    process.exit();
  } else {
    app.on('second-instance', (event, commandLine) => {
      const { query } = parseURL(commandLine.pop());
      const code = query.get('code');
      const error = query.get('error');
      if (error) {
        dialog.showMessageBox(null, {
          type: 'error',
          title: 'Spotify Callback',
          buttons: ['OK'],
          message: error,
        });
        return;
      }
      if (!code) {
        dialog.showMessageBox(null, {
          type: 'error',
          title: 'Spotify Callback',
          buttons: ['OK'],
          message: 'The code provided is not valid',
        });
        return;
      }
      Spotify.token(code).then(async (res) => {

      }).catch(async (err) => {
        await dialog.showMessageBox(null, {
          type: 'error',
          buttons: ['OK'],
          title: 'Spotify Callback',
          message: 'An error occurred while getting an access token.',
          detail: err.toString()
        });
      });
    });
  }
}

function handleLinuxMacOS(app: Electron.App) {
  app.on('open-url', async (e, url) => {
    await dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['OK'],
      title: 'Successfully authenticated',
      message: 'Your Spotify account has been successfully authenticated.',
    });
  });
}

function parseURL(url: string) {
  url = url.slice((protocol + '://').length);
  const query = new URLSearchParams(url.split('?')[1]);
  return { url, query };
}
