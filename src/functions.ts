import { BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'path';
import * as Config from './utils/Config';
import * as DiscordWebSocket from './utils/DiscordWebSocket';
import { win } from './utils/Window';

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function prompt(message: string, app: Electron.App, options?: {
  closable?: boolean
}) {
  const win = new BrowserWindow({
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: typeof options?.closable !== 'undefined' ? options?.closable : true,
    webPreferences: {
      preload: join(__dirname, 'prompt.js')
    }
  });

  ipcMain.on('autocomplete-token', async () => {
    if (Config.get(app, 'discord_token')) {
      await runJs(`document.querySelector('input#discord-token').value = '${Config.get(app, 'discord_token')}'`);
    }
  });

  ipcMain.on('token-received', async (e, data) => {
    Config.set(app, 'discord_token', data);
    Config.set(app, 'use_listening_to', true);
    win.close();
    DiscordWebSocket.connect(data, app).catch(console.error);
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
  win.setMenuBarVisibility(false);
  await win.loadFile(join(__dirname, 'prompt.html'), { hash: message });
}

export async function runJs(code: string) {
  return win.webContents.executeJavaScript(code);
}
