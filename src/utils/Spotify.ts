import axios from 'axios';
import { spotifyRedirectUri } from '../variables';
import { log } from './Log';
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
  title: string, artists: string
}, app: Electron.App): Promise<string|undefined> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', `track:${track.title} artist:${track.artists.split(',').shift()}`);
  searchParams.append('limit', '1');
  searchParams.append('type', 'track');
  const accessToken = Config.get(app, 'spotify_access_token');
  const albumCoverReq = await axios.get(`${apiBase}/search?${searchParams}`, {
    headers: {
      Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`
    }
  });
  let albumCover;
  if (albumCoverReq.status !== 200) {
    log('Spotify Cover', 'Error while fetching cover:', albumCoverReq.statusText);
  } else {
    albumCover = albumCoverReq.data.tracks.items[0].album.images[0].url.split('/').pop();
  }
  return albumCover;
}