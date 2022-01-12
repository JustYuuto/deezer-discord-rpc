import axios from 'axios';
import { DEEZER_API_BASE } from '../variables';

export async function getAlbum(albumId: number) {
  const album = await axios.get(`${DEEZER_API_BASE}/album/${albumId}`);
  return album.data;
}

export async function getAlbumTitle(albumId: number) {
  return await getAlbum(albumId).then(album => album.title);
}

export async function getAlbumLink(albumId: number) {
  return await getAlbum(albumId).then(album => album.link);
}

export async function getAlbumDuration(albumId: number) {
  return await getAlbum(albumId).then(album => album.duration);
}

export async function getAlbumCover(albumId: number) {  
  return await getAlbum(albumId).then(album => album.cover_xl);
}