import { log } from './Log';
import axios from 'axios';
import { version } from '../../package.json';
import { dialog, shell } from 'electron';

export default function updater(fromStartup: boolean = false) {
  log('Updater', 'Checking for updates...');
  return getLatestRelease()
    .then(release => {
      if (release.tag_name !== version) {
        log('Updater', 'The version', release.tag_name, 'is available to download!');
        dialog.showMessageBox({
          type: 'info',
          title: 'Update available',
          buttons: ['Cancel', 'Download'],
          message: `The version ${release.tag_name} is available to download!`,
          defaultId: 1,
        }).then(({ response }) => {
          if (response === 1) {
            const file = () => {
              let extension;
              if (process.platform === 'win32') extension = 'exe';
              else if (process.platform === 'darwin') extension = 'dmg';
              return release.assets.find(f => f.name.split('.').pop() === extension);
            };
            shell.openExternal(file() ? file()?.browser_download_url : release.html_url);
          }
        });
      } else {
        log('Updater', 'No updates found.');
        if (!fromStartup)
          dialog.showMessageBox(null, {
            type: 'info',
            title: 'No update available',
            message: 'You are using the latest version.',
          });
      }
    })
    .catch(reason => {
      log('Updater', 'Cannot get the latest release:', reason?.toString());
      dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['Close', 'Retry'],
        title: 'Cannot get latest release',
        message: 'Cannot get the latest release.',
        detail: reason?.toString(),
        defaultId: 1
      }).then(({ response }) => {
        if (response === 1) updater();
      });
    });
}

export async function getLatestRelease() {
  const url = 'https://api.github.com/repos/JustYuuto/deezer-discord-rpc/releases/latest';
  const release = await axios.get(url);
  return release.data;
}
