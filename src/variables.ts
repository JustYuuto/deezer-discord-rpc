export const deezerApiBase = 'https://api.deezer.com';
export const clientId = '899229435130183690';
export const useAsMainApp = true;
// Windows 10 (x64) with Google Chrome 110.0.0.0
export const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36';
export const protocol = 'deezer-discord-rpc';
export const spotifyRedirectUri = `${protocol}://spotify-callback/`;
export const artistsSeparator = ', ';
export const noWsActivity = {
  op: 3,
  d: {
    status: 'online',
    since: 0,
    afk: false,
    activities: []
  }
};