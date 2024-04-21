import * as Config from './Config';
import { tray } from './Tray';
import { clientId } from '../variables';
import { version } from '../../package.json';
import { RichPresence } from 'discord.js-selfbot-v13';

export async function setActivity(options: {
  client: import('discord-rpc').Client | import('discord.js-selfbot-v13').Client, albumId: number, trackId: string, playing: boolean, timeLeft: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackTitle: string, trackArtists: any, albumCover: string, albumTitle: string, app: Electron.App, type: string
}) {
  const {
    timeLeft, playing, client, albumTitle, trackArtists, trackTitle,
    albumCover, app, type, trackId
  } = options;
  const tooltipText = Config.get(app, 'tooltip_text');
  switch (tooltipText) {
    case 'app_name':
      tray.setToolTip('Deezer Discord RPC');
      break;
    case 'app_version':
      tray.setToolTip(`Version ${version}`);
      break;
    case 'app_name_and_version':
      tray.setToolTip(`Deezer Discord RPC version ${version}`);
      break;
    case 'artists_and_title':
      tray.setToolTip(`${trackArtists} - ${trackTitle}`);
      break;
    case 'title_and_artists':
      tray.setToolTip(`${trackTitle} - ${trackArtists}`);
      break;
  }
  if (!client) return;
  const isRPC = client instanceof (await import('discord-rpc')).Client;

  if (Config.get(app, 'only_show_if_playing') && !playing) {
    if (isRPC) {
      await client.clearActivity(process.pid);
      return;
    } else {
      client.user.setActivity(null);
      return;
    }
  }

  const getTrackLink = () => {
    switch (type) {
      case 'song':
        return `https://www.deezer.com/track/${trackId}`;
      case 'episode':
        return `https://www.deezer.com/episode/${trackId}`;
    }
  };

  const button = (getTrackLink() && parseInt(trackId) > 0) && { label: 'Play on Deezer', url: getTrackLink() };
  const isLivestream = (Date.now() + timeLeft) < Date.now();
  if (isRPC) {
    client.setActivity({
      details: trackTitle,
      state: trackArtists,
      largeImageKey: albumCover,
      largeImageText: albumTitle,
      instance: false,
      startTimestamp: playing && Date.now(),
      [isLivestream ? 'startTimestamp' : 'endTimestamp']: playing && Date.now() + timeLeft,
      buttons: button ? [button] : undefined
    }).catch(() => {});
  } else {
    const presence = new RichPresence()
      .setType('LISTENING')
      .setName('Deezer')
      .setDetails(trackTitle)
      .setState(trackArtists)
      // @ts-expect-error wrong type
      .setStartTimestamp(playing && Date.now())
      // @ts-expect-error wrong type too
      // eslint-disable-next-line no-unexpected-multiline
      [isLivestream ? 'setStartTimestamp' : 'setEndTimestamp'](playing && Date.now() + timeLeft)
      .setApplicationId(clientId)
      .setAssetsLargeImage('mp:'.concat((await RichPresence.getExternal(client, clientId, albumCover, ''))[0].external_asset_path))
      .setAssetsLargeText(albumTitle)
    ;
    if (button) presence.addButton(button.label, button.url);
    client.user.setActivity(presence);
  }
}
