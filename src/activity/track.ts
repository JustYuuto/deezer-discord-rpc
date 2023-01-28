import axios from 'axios';
import { DEEZER_API_BASE } from '../variables';
import { Artist } from './artist';
import { Album } from './album';

export async function getTrack(trackId: number): Promise<Track> {
  const track = await axios.get(`${DEEZER_API_BASE}/track/${trackId}`);
  return track.data;
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
