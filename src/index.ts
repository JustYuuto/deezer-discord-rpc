import * as RPC from 'discord-rpc';
import { CLIENT_ID, ACTIVITY_REFRESH_EVERY } from './variables';
import { initTrayIcon, setActivity, loadWindow } from './functions';
import { app, BrowserWindow, Notification } from 'electron';

const client = new RPC.Client({
  transport: 'ipc'
});

app.commandLine.appendSwitch('disable-site-isolation-trials');

app.whenReady().then(() => {
  initTrayIcon(app);
  loadWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) loadWindow();
  });
});

app.on('window-all-closed', () => {
  const notification = new Notification({
    title: 'Deezer Discord RPC',
    body: 'The RPC launched in background mode. Click on the tray icon to show the window.'
  });
  notification.show();
})

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