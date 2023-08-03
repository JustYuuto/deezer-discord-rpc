import axios from 'axios';
import { deezerApiBase } from '../variables';
import { Artist } from './artist';
import { Album } from './album';

export async function getTrack(trackId: number | string): Promise<Track> {
  const track = await axios.get(`${deezerApiBase}/track/${trackId}`);
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
