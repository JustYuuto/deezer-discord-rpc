import * as Config from './Config';
import { tray } from './Tray';
import { version } from '../../package.json';
import { ActivityType } from 'discord-api-types/v10';

export async function setActivity(options: {
  client: import('@xhayper/discord-rpc').Client, albumId: number, trackId: string, playing: boolean, timeLeft: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackTitle: string, trackArtists: any, albumCover: string, albumTitle: string, app: Electron.App, type: string,
  songTime: number
}) {
  const {
    timeLeft, playing, client, albumTitle, trackArtists, trackTitle,
    albumCover, app, type, trackId, songTime
  } = options;
  const tooltipText = await Config.get(app, 'tooltip_text');
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

  if (!playing)
    return await client.user.clearActivity();

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
  const playedTime = Date.now() - songTime + timeLeft;
  client.user.setActivity({
    type: ActivityType.Listening,
    details: trackTitle,
    state: trackArtists,
    largeImageKey: albumCover,
    largeImageText: albumTitle,
    instance: false,
    startTimestamp: playedTime,
    [isLivestream ? 'startTimestamp' : 'endTimestamp']: Date.now() + timeLeft,
    buttons: button ? [button] : undefined,
  }).catch(() => {});
}
