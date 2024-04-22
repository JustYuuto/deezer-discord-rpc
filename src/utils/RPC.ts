import * as RPC from 'discord-rpc';
import { log } from './Log';
import { clientId } from '../variables';

export const client = new RPC.Client({
  transport: 'ipc',
});

export function connect() {
  client.on('ready', () => {
    log('RPC', `Authed for user @${client.user?.username}`);
  });

  client.on('disconnected', () => {
    log('RPC', 'Disconnected, trying to reconnect...');
    const attempts = 0;
    const attemptsInterval = setInterval(() => {
      client.login({ clientId }).then(() => {
        clearInterval(attemptsInterval);
      }).catch(console.error);
      log('RPC', `Reconnecting... Attempt ${attempts + 1}`);
      if (attempts >= 5) {
        clearInterval(attemptsInterval);
      }
    }, 8000);
  });

  client.login({ clientId }).catch(console.error);
}

export async function disconnect() {
  log('RPC', 'Disconnecting...');
  await client.clearActivity(process.pid);
  await client.destroy().then(() => log('RPC', 'Disconnected'));
}
