import axios from 'axios';
import * as Config from './Config';
import { log } from './Log';

const apiBase = 'https://api.spotify.com/v1';
const accountsApiBase = 'https://accounts.spotify.com/api';

async function getAccessToken() {
  return (await axios.post(`${accountsApiBase}/token`, 'grant_type=client_credentials', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ODc0NWM1ODNjYzZiNDJiODk1ZDU2Mjc2Y2RmMzkxYWQ6MzQxNWFmOWJjZDQwNDc3N2JjZTk0MjVhMTI5MjJiZjY='
    }
  })).data;
}

export async function getCover(track: {
  albumTitle: string, title: string, artists: string, track?: boolean
}, app: Electron.App): Promise<string|null> {
  const { access_token, token_type } = await getAccessToken();
  const searchParams = new URLSearchParams();
  searchParams.append('q', `${track.track ? 'track' : 'album'}:${track[track.track ? 'title' : 'albumTitle']} artist:${track.artists.split(',')[0]}`);
  searchParams.append('limit', '1');
  searchParams.append('type', track.track ? 'track' : 'album');
  const albumCoverReq = await axios.get(`${apiBase}/search?${searchParams}`, {
    headers: {
      Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `${token_type} ${access_token}`
    }
  });
  if (albumCoverReq.status !== 200) {
    return null;
  } else if (!track.track && albumCoverReq.data.albums.items.length === 0) { // Retrying with track instead of album
    log('Spotify Covers', 'Retrying with track instead of album...');
    return getCover({
      title: track.title, artists: track.artists, albumTitle: track.albumTitle, track: true
    }, app);
  } else if (track.track === true && albumCoverReq.data[track.track ? 'tracks' : 'albums'].items.length === 0) {
    return null;
  } else {
    return track.track ?
      albumCoverReq.data.tracks.items[0].album.images[0].url.split('/').pop() || null :
      albumCoverReq.data.albums.items[0].images[0].url.split('/').pop() || null;
  }
}
