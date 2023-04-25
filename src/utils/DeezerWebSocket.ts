import { WebSocketServer, WebSocket } from 'ws';

export let server: WebSocket;
export const events = {
  PLAYER_STATE_CHANGED: 'PLAYER_STATE_CHANGED',
};

export function start() {
  const socket = new WebSocketServer({
    port: 5432,
  });

  socket.on('connection', (ws) => {
    server = ws;
    ws.on('error', console.error);

    ws.on('message', (rawData) => {
      const payload = JSON.parse(rawData.toString());
      const { type } = payload;

      switch (type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' })); break;
      }
    });
  });
}
