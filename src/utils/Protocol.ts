import { protocol } from '../variables';
import { resolve } from 'path';
import * as Spotify from './Spotify';
import { dialog } from 'electron';
import { log } from './Log';
import * as Config from './Config';

export function register(app: Electron.App) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(protocol, process.execPath, [resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(protocol);
  }
  log('Protocol', 'Registered protocol');
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
      handleCall(commandLine.pop(), app);
    });
  }
}

function handleLinuxMacOS(app: Electron.App) {
  app.on('open-url', async (e, url) => {
    handleCall(url, app);
  });
}

function handleCall(url: string, app: Electron.App) {
  const { query } = parseURL(url);
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
  if (!code) return;
  Spotify.token(code).then((res) => {
    Spotify.accessToken(res.data.refresh_token).then(async () => {
      const { access_token, expires_in } = res.data;
      Config.set(app, 'spotify_access_token', access_token);
      Config.set(app, 'spotify_expires_at', Date.now() + expires_in);
      await dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['Close'],
        title: 'Spotify Callback',
        message: 'Your Spotify account has been successfully authorized.',
        detail: 'Covers can now be shown on your profile.'
      });
    });
  }).catch(async (err) => {
    await dialog.showMessageBox(null, {
      type: 'error',
      buttons: ['OK'],
      title: 'Spotify Callback',
      message: 'An error occurred while getting an access token.',
      detail: err.toString()
    });
  });
}

function parseURL(url: string) {
  url = url.slice((protocol + '://').length);
  const query = new URLSearchParams(url.split('?')[1]);
  return { url, query };
}
