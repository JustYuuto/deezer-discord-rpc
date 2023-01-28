import axios from 'axios';
import { DEEZER_API_BASE } from '../variables';
import { Artist } from './artist';
import { Album } from './album';

export async function getTrack(trackId: number): Promise<Track> {
  const track = await axios.get(`${DEEZER_API_BASE}/track/${trackId}`);
  return track.data;
}

export async function getTrackTitle(trackId: number) {
  return await getTrack(trackId).then(track => track.title);
}

export async function getTrackArtists(trackId: number) {
  return await getTrack(trackId).then(track => track.contributors?.map(c => c.name)?.join(', '));
}

export async function getTrackLink(trackId: number) {
  return await getTrack(trackId).then(track => track.link);
}

export async function getTrackDuration(trackId: number) {
  return await getTrack(trackId).then(track => track.duration);
}

export async function getTrackCover(trackId: number) {
  return await getTrack(trackId).then(track => track.album.cover_xl);
}

export interface Track {
  id: number,
  title: string,
  link: string,
  duration: number,
  artist: Artist,
  contributors: Artist[],
  album: Album
}
