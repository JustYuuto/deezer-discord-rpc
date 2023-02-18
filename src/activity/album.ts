import axios from 'axios';
import { deezerApiBase } from '../variables';
import { Track } from './track';

export async function getAlbum(albumId: number): Promise<Album> {
  const album = await axios.get(`${deezerApiBase}/album/${albumId}`);
  return album.data || {};
}

export async function findTrackInAlbum(trackName: string, albumId: number) {
  return (async () => (await axios.get(`${deezerApiBase}/album/${albumId}/tracks`)).data)()
    .then((tracks: AlbumTrack) => tracks.data)
    .then((tracks: AlbumTrack['data']) => {
      const find = tracks?.find(elem => elem.title === trackName);
      if (!find) {
        console.error('Nothing found');
      } else {
        return find.id;
      }
    });
}

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
    data: [{}]
  },
  duration: number;
  tracks: AlbumTrack[]
}

interface AlbumTrack {
  data: Track[],
  total: number
}
