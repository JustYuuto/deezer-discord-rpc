import { app, BrowserWindow, session } from 'electron';
import { log } from './utils/Log';
import * as Config from './utils/Config';
import * as Tray from './utils/Tray';
import updater from './utils/Updater';
import * as DiscordWebSocket from './utils/DiscordWebSocket';
import * as RPC from './utils/RPC';
import * as Window from './utils/Window';
import { join } from 'path';

log('App', 'Deezer Discord RPC version', require('../package.json').version, process.argv0.includes('node') ? '(debug)' : '');

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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) Window.load(app);
    else BrowserWindow.getAllWindows()[0].show();
  });

  app.on('second-instance', (e) => {
    e.preventDefault();

    BrowserWindow.getAllWindows()[0].show();
  });
});

process.on('beforeExit', async () => {
  Config.get(app, 'use_listening_to') ? DiscordWebSocket.disconnect(1000) : await RPC.disconnect();
});
