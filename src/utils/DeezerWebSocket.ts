import { WebSocketServer, WebSocket } from 'ws';
import { log } from './Log';
import { runJs } from '../functions';
import { findTrackInAlbum } from '../activity/album';
import { getTrack } from '../activity/track';
import * as os from 'os';

export let server: WebSocket;
export const events = {
  PLAYER_STATE_CHANGED: 'PLAYER_STATE_CHANGED',
  PLAYER_TRACK_CHANGED: 'PLAYER_TRACK_CHANGED'
};

export function start() {
  const port = 5432;
  const socket = new WebSocketServer({
    port
  });

  socket.on('listening', () => {
    const interfaces = os.networkInterfaces();
    const ip = (
      interfaces['Wi-Fi'] || interfaces['Ethernet'] || interfaces['en0'] || interfaces['en1'] 
    ).find(i => i.family === 'IPv4').address;
    log('Local WS', `Started server on ws://${ip}:${port}`);
  });

  socket.on('connection', (ws) => {
    log('Local WS', 'New connection detected');
    server = ws;
    ws.on('error', console.error);

    ws.on('message', async (rawData) => {
      const payload = JSON.parse(rawData.toString());
      const { type, event, data }: { type: 'ping' | 'message', event: Events, data: any } = payload;

      switch (type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
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
          await runJs(code).then(async (r) => {
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
          await runJs(`window.dzPlayer.control.${data.playing ? 'play' : 'pause'}()`);
          break;
        case 'PREVIOUS':
          await runJs('window.dzPlayer.control.prevSong()');
          break;
        case 'NEXT':
          await runJs('window.dzPlayer.control.nextSong()');
          break;
        case 'SET_VOLUME':
          await runJs(`window.dzPlayer.control.setVolume(${data.volume / 100})`);
          break;
        case 'SET_REPEAT':
          await runJs(`window.dzPlayer.repeat = ${data.state}`);
          break;
        case 'SET_SHUFFLE':
          await runJs(`window.dzPlayer.shuffle = ${data.state}`);
          break;
        case 'SEEK':
          // @ts-ignore
          await runJs(`window.dzPlayer.control.seek(${parseFloat(String((100 * data.position_ms) / data.track_duration)).toPrecision(3) / 100})`);
          break;
      }
    });
  });
}

declare type Events = 'CURRENT_TRACK' | 'SET_PLAYING' | 'PREVIOUS' | 'NEXT' | 'SET_VOLUME' | 'SEEK' | 'SET_SHUFFLE' | 'SET_REPEAT';

interface JSResult {
  trackName: string,
  albumId: number,
  playing: boolean,
  position: number,
  volume: number,
  repeat: Repeat,
  shuffle: boolean
}

export enum Repeat {
  "off", "on", "track"
}
