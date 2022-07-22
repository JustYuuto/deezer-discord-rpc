import axios from 'axios';
import { DEEZER_API_BASE } from '../variables';

export async function getAlbum(albumId: number) {
  const album = await axios.get(`${DEEZER_API_BASE}/album/${albumId}`);
  return album.data;
}

export async function getAlbumTitle(albumId: number) {
  return await getAlbum(albumId).then((album: Album) => album.title);
}

export async function getAlbumLink(albumId: number) {
  return await getAlbum(albumId).then((album: Album) => album.link);
}

export async function getAlbumDuration(albumId: number) {
  return await getAlbum(albumId).then((album: Album) => album.duration);
}

export async function getAlbumCover(albumId: number) {  
  return await getAlbum(albumId).then((album: Album) => album.cover_xl);
}

export async function findTrackInAlbum(trackName: string, albumId: number) {
  return (async () => (await axios.get(`${DEEZER_API_BASE}/album/${albumId}/tracks`)).data)()
    .then((tracks: AlbumTrack) => tracks.data)
    .then((tracks: AlbumTrack['data']) => {
      const find = tracks.find(elem => {
        return elem.title.includes(trackName);
      });
      if (!find) {
        console.error('Nothing found');
      } else {
        return find.id;
      }
    });
}

interface Album {
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
  data: [
    {
      id: number,
      readable: boolean,
      title: string,
      title_short: string,
      title_version: string,
      isrc: string,
      link: string,
      duration: number,
      track_position: number,
      disk_number: number,
      rank: number,
      explicit_lyrics: boolean,
      explicit_content_lyrics: number,
      explicit_content_cover: number,
      preview: string,
      md5_image: string,
      artist: {
        id: number,
        name: string,
        tracklist: string,
        type: string
      },
      type: string
    }
  ],
  total: number
}