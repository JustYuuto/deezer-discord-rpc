import * as RPC from 'discord-rpc';
import { log } from './Log';
import { clientId } from '../variables';

export const client = new RPC.Client({
  transport: 'ipc'
});

export function connect() {
  client.on('ready', () => {
    log('RPC', `Authed for user ${client.user?.username}#${client.user?.discriminator}`);
  });

  client.login({ clientId }).catch(console.error);
}

export async function disconnect() {
  log('RPC', 'Disconnecting...');
  await client.clearActivity(process.pid);
  await client.destroy().then(() => log('RPC', 'Disconnected'));
}