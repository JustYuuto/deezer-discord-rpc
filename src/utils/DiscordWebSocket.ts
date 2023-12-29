import { log } from './Log';
import * as RPC from './RPC';
import { Client, RawUserSettingsData } from 'discord.js-selfbot-v13';
import { dialog } from 'electron';
import * as Config from './Config';

export const client = new Client({
  checkUpdate: false
});

export async function connect(token: string, app: Electron.App) {
  client.on('ready', async () => {
    if (RPC.client && RPC.client.user) {
      await RPC.client.clearActivity(process.pid);
      await RPC.client.destroy();
    }

    log('WebSocket', `Logged in as ${client.user.tag}`);

    client.user.setStatus((<RawUserSettingsData>client.settings.rawSetting).status);
  });

  client.on('userSettingsUpdate', (settings) => {
    if (!settings.status) return;
    client.user.setStatus(settings.status);
  });

  try {
    await client.login(token);
  } catch (e) {
    log('WebSocket', 'Failed to log in');
    Config.set(app, 'discord_token', '');
    Config.set(app, 'use_listening_to', false);
    dialog.showErrorBox('Error', 'The token you provided for the "Listening to" mode is invalid.');
  }
}

export function disconnect() {
  log('WebSocket', 'Disconnecting...');
  client.destroy();
  log('WebSocket', 'Disconnected');
}
