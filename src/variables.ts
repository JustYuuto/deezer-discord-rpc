export const deezerApiBase = 'https://api.deezer.com';
export const clientId = '899229435130183690';
export const useAsMainApp = true;
export const userAgents = {
  deezerApp: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36`,
  discordApp: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9011 Chrome/91.0.4472.164 Electron/13.6.6 Safari/537.36'
}
export const protocol = 'deezer-discord-rpc';
export const spotifyRedirectUri = `${protocol}://spotify-callback/`;
export const artistsSeparator = ', ';
export const noWsActivity = {
  op: 3,
  d: {
    since: 0,
    afk: false,
    activities: []
  }
};