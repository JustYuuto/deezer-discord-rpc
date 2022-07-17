import * as RPC from 'discord-rpc';
import { CLIENT_ID, ACTIVITY_REFRESH_EVERY } from './variables';
import { initTrayIcon, setActivity } from './functions';
import { app } from 'electron';

const client = new RPC.Client({
  transport: 'ipc'
});

app.whenReady().then(() => {
  initTrayIcon(app);
});

client.on('ready', () => {
  console.log([
    `Logged in as ${client.application?.name}`,
    `Authed for user ${client.user?.username}#${client.user?.discriminator}`
  ].join('\n'));
  setActivity(client);

  setInterval(() => {
    setActivity(client);
  }, ACTIVITY_REFRESH_EVERY);
});

client.login({ clientId: CLIENT_ID }).catch(console.error);