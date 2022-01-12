const fetch = require('node-fetch');
const { DEEZER_API_BASE } = require('../variables');

async function getAlbum(albumId) {
  const album = await fetch(`${DEEZER_API_BASE}/album/${albumId}`);
  return album.then(res => res.json());
}

async function getAlbumCover(albumId) {
  return await getAlbum(albumId).cover;
}

module.exports = {
  getAlbum, getAlbumCover
}