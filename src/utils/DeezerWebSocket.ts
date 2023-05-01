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
              const playing = !!document.querySelector('#page_player > div > div.player-controls > ul > li:nth-child(3) > button > svg[data-testid="PauseIcon"]');
              const position = parseInt(document.querySelector('input.slider-track-input.mousetrap').getAttribute('value')) * 1000;
              return JSON.stringify({ albumId, trackName, playing, position });
            })();`;
          runJs(win, code).then(async (result) => {
            result = JSON.parse(result);
            const trackId = await findTrackInAlbum(result.trackName, result.albumId);
            const track = await getTrack(trackId);
            const album = await getAlbum(result.albumId);
            ws.send(JSON.stringify({
              type: 'message',
              event: 'CURRENT_TRACK',
              data: {
                track, album, playing: result.playing, position: result.position
              }
            }));
          });
          break;
        case 'SET_PLAYING':
          runJs(win, 'document.querySelector(\'.player-controls > .svg-icon-group > .svg-icon-group-item:nth-child(3) > button\')?.click()');
          break;
        case 'NEXT':

      }
    });
  });
}

declare type Events = 'CURRENT_TRACK' | 'SET_PLAYING' | 'NEXT';
