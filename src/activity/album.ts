import { Track } from './track';

export interface Album {
  id: string;
  title: string;
  upc: string;
  link: string;
  share: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  genre_id: number;
  genres: {
    data: [object]
  },
  duration: number;
  tracks: AlbumTrack[]
}

interface AlbumTrack {
  data: Track[],
  total: number
}
