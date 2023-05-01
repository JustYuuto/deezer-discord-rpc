import { WebSocketServer, WebSocket } from 'ws';
import { log } from './Log';
import { runJs } from '../functions';
import { win } from './Window';
import { findTrackInAlbum } from '../activity/album';
import { getTrack } from '../activity/track';

export let server: WebSocket;
export const events = {
  PLAYER_STATE_CHANGED: 'PLAYER_STATE_CHANGED',
  PLAYER_TRACK_CHANGED: 'PLAYER_TRACK_CHANGED'
};

export function start() {
  const socket = new WebSocketServer({
    port: 5432,
  });

  socket.on('listening', () => {
    log('Local WS', 'Started server');
  });

  socket.on('connection', (ws) => {
    log('Local WS', 'New connection detected');
    server = ws;
    ws.on('error', console.error);

    ws.on('message', (rawData) => {
      const payload = JSON.parse(rawData.toString());
      const { type, event, data }: { type: 'ping' | 'message', event: Events, data: any } = payload;

      switch (type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' })); break;
      }

      switch (event) {
        case 'CURRENT_TRACK':
          let code =
            `(() => {
              const albumId = document.querySelector('.track-link[href*="album"]')?.getAttribute('href').split('/')[3];
              const trackName = document.querySelector('.track-link[href*="album"]')?.textContent;
              const playing = dzPlayer.isPlaying();
              const position = dzPlayer.getPosition() * 1000;
              const volume = dzPlayer.getVolume();
              const repeat = dzPlayer.getRepeat();
              const shuffle = dzPlayer.isShuffle();
              return JSON.stringify({ albumId, trackName, playing, position, volume, repeat, shuffle });
            })()`;
          runJs(win, code).then(async (r) => {
            const result: JSResult = JSON.parse(r);
            const trackId = await findTrackInAlbum(result.trackName, result.albumId);
            const track = await getTrack(trackId);
            ws.send(JSON.stringify({
              type: 'message',
              event: 'CURRENT_TRACK',
              data: {
                track, playing: result.playing, position: result.position, volume: result.volume,
                repeat: result.repeat, shuffle: result.shuffle
              }
            }));
          });
          break;
        case 'SET_PLAYING':
          runJs(win, `window.dzPlayer.control.${data.playing ? 'play' : 'pause'}()`); break;
        case 'PREVIOUS':
          runJs(win, 'window.dzPlayer.control.prevSong()'); break;
        case 'NEXT':
          runJs(win, 'window.dzPlayer.control.nextSong()'); break;
        case 'SET_VOLUME':
          runJs(win, `window.dzPlayer.control.setVolume(${data.volume / 100})`); break;
        case 'SET_REPEAT':
          runJs(win, `window.dzPlayer.repeat = ${data.state}`); break;
        case 'SET_SHUFFLE':
          runJs(win, `window.dzPlayer.shuffle = ${data.state}`); break;
        case 'SEEK':
          // @ts-ignore
          runJs(win, `window.dzPlayer.control.seek(${parseFloat(String((100 * data.position_ms) / data.track_duration)).toPrecision(3) / 100})`); break;
      }
    });
  });
}

declare type Events = 'CURRENT_TRACK' | 'SET_PLAYING' | 'NEXT';
