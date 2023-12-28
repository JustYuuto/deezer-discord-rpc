import { app, BrowserWindow, session } from 'electron';
import { log } from './utils/Log';
import * as Config from './utils/Config';
import * as Tray from './utils/Tray';
import updater from './utils/Updater';
import * as DiscordWebSocket from './utils/DiscordWebSocket';
import * as RPC from './utils/RPC';
import * as Window from './utils/Window';
import { join } from 'path';
import { version } from '../package.json';

log('App', 'Deezer Discord RPC version', version, process.argv0.includes('node') ? '(debug)' : '');

app.whenReady().then(async () => {
  await Tray.init(app, RPC.client);
  if (process.argv0.includes('node')) {
    await session.defaultSession.loadExtension(join(process.cwd(), 'src', 'react-devtools'));
  }
  await Window.load(app);
  await updater(true);

  if (Config.get(app, 'use_listening_to')) {
    DiscordWebSocket.connect(Config.get(app, 'discord_token')).catch((e) => log('WebSocket', e.toString()));
  } else {
    RPC.connect();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length > 0) {
      const window = BrowserWindow.getAllWindows()[0];
      if (!window.isVisible()) window.show();
      if (window.isMinimized()) window.maximize();
    } else {
      await Window.load(app);
    }
  });

  app.on('second-instance', (e) => {
    e.preventDefault();

    const window = BrowserWindow.getAllWindows()[0];
    if (!window.isVisible()) window.show();
    if (window.isMinimized()) window.maximize();
  });
});
