import axios from 'axios';
import { DEEZER_API_BASE } from '../variables';

export async function getTrack(trackId: number) {
  const track = await axios.get(`${DEEZER_API_BASE}/track/${trackId}`);
  return track.data;
}

export async function getTrackTitle(trackId: number) {
  return await getTrack(trackId).then(track => track.title);
}

export async function getTrackArtist(trackId: number) {
  return await getTrack(trackId).then(track => track.artist.name);
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