import { Artist } from './artist';
import { Album } from './album';

export interface Track {
  id: number,
  title: string,
  link: string,
  duration: number,
  artist: Artist,
  contributors: Artist[],
  album: Album
}
