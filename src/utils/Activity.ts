import * as Config from './Config';
import { tray } from './Tray';
import { version } from '../../package.json';
import { ActivityType } from 'discord-api-types/v10';

export async function setActivity(options: {
  client: import('@xhayper/discord-rpc').Client, albumId: number, trackId: string, playing: boolean, timeLeft: number,
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

  if (Config.get(app, 'only_show_if_playing') && !playing) {
    await client.user.clearActivity();
    return;
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
  const useListening = Config.get(app, 'use_listening_to');
  client.user.setActivity({
    type: useListening ? ActivityType.Listening : ActivityType.Playing,
    details: trackTitle,
    state: trackArtists,
    largeImageKey: albumCover,
    largeImageText: albumTitle,
    instance: false,
    startTimestamp: playing && Date.now(),
    [isLivestream ? 'startTimestamp' : 'endTimestamp']: playing && Date.now() + timeLeft,
    buttons: button ? [button] : undefined,
  }).catch(() => {});
}
