import axios from 'axios';
import { spotifyRedirectUri } from '../variables';
import * as Config from './Config';

const apiBase = 'https://api.spotify.com/v1';
const accountsApiBase = 'https://accounts.spotify.com/api';

export async function token(code: string) {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', spotifyRedirectUri);
  return await axios.post(`${accountsApiBase}/token`, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ODc0NWM1ODNjYzZiNDJiODk1ZDU2Mjc2Y2RmMzkxYWQ6MzQxNWFmOWJjZDQwNDc3N2JjZTk0MjVhMTI5MjJiZjY='
    }
  });
}

export async function accessToken(refreshToken: string) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  return await axios.post(`${accountsApiBase}/token`, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ODc0NWM1ODNjYzZiNDJiODk1ZDU2Mjc2Y2RmMzkxYWQ6MzQxNWFmOWJjZDQwNDc3N2JjZTk0MjVhMTI5MjJiZjY='
    }
  });
}

export async function getCover(track: {
  albumTitle: string, title: string, artists: string, track?: boolean
}, app: Electron.App): Promise<string|null> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', `${track.track ? 'track' : 'album'}:${track.albumTitle} artist:${track.artists.split(',')[0]}`);
  searchParams.append('limit', '1');
  searchParams.append('type', track.track ? 'track' : 'album');
  const accessToken = Config.get(app, 'spotify_access_token');
  const tokenType = Config.get(app, 'spotify_token_type');
  const albumCoverReq = await axios.get(`${apiBase}/search?${searchParams}`, {
    headers: {
      Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `${tokenType} ${accessToken}`
    }
  });
  if (albumCoverReq.status !== 200 && track.track === true) { // Retrying with track instead of album
    return getCover({
      title: track.title, artists: track.artists, albumTitle: track.albumTitle, track: true
    }, app);
  } else if (albumCoverReq.status !== 200 && !track.track) {
    return null;
  } else {
    return albumCoverReq.data.albums.items[0].images[0].url.split('/').pop() || null;
  }
}