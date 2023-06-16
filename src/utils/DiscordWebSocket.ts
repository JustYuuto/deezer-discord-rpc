import WebSocket from 'ws';
import { userAgents } from '../variables';
import { log } from './Log';
import * as Config from './Config';
import * as RPC from './RPC';
import { app, dialog } from 'electron';
import { clearInterval } from 'timers';
import * as os from 'os';
import axios from 'axios';

export let client: WebSocket;
export let status: string;
const wsURLParams = new URLSearchParams();
wsURLParams.append('v', '10');
wsURLParams.append('encoding', 'json');
const wsURL = `wss://gateway.discord.gg/?${wsURLParams}`;

export async function connect(token: string, resumeUrl?: string) {
  status = (await axios.get('https://discord.com/api/v10/users/@me/settings', {
    headers: { Authorization: token, 'User-Agent': userAgents.discordApp }
  })).data.status;

  return new Promise<void>(async (resolve, reject) => {
    if (!await checkToken(token)) throw new Error('Invalid token provided');

    const socket = new WebSocket(resumeUrl || wsURL);
    const payload = {
      op: 2,
      d: {
        token,
        capabilities: 8189,
        properties: {
          os: (() => {
            if (process.platform === 'win32') return 'Windows';
            else if (process.platform === 'darwin') return 'Mac OS';
            else if (process.platform === 'linux') return 'Linux';
          })(),
          browser: 'Deezer Discord RPC',
          release_channel: 'stable',
          client_version: '1.0.60',
          os_version: os.release(),
          os_arch: os.arch(),
          system_locale: 'en',
        },
        presence: {
          status: 'dnd', since: 0, afk: false, activities: []
        }
      }
    };

    socket.on('open', async () => {
      if (!Config.get(app, 'use_listening_to')) {
        await RPC.client.clearActivity(process.pid);
        await RPC.client.destroy();
      }
      log('WebSocket', 'Connected to Discord WebSocket server');
      resolve();
      client = socket;

      socket.send(JSON.stringify(payload), () => {
        log('WebSocket', 'Sent authentication payload');
      });
      if (resumeUrl) {
        socket.send(JSON.stringify({
          op: 6,
          d: {
            token, session_id: sessionId
          }
        }), () => {
          log('WebSocket', 'Sent resume payload');
        });
      }
    });

    socket.on('error', reject);

    let resumeURL;
    let sessionId;
    socket.on('message', (data) => {
      const payload = JSON.parse(data.toString());
      const { t, d, op } = payload;

      switch (op) {
        case 10:
          const { heartbeat_interval } = d;
          heartbeat(heartbeat_interval);
          break;
      }

      switch (t) {
        case 'READY':
          resumeURL = d.resume_gateway_url;
          sessionId = d.session_id;
      }
    });

    socket.on('close', (code, desc) => {
      if (code === 1006) {
        if (resumeUrl) return; // Can create multiple `setInterval`s
        let retries = 0;
        const interval = setInterval(async () => {
          if (retries === 5) {
            clearInterval(interval);
            log('WebSocket', 'Connection failed, giving up');
            await dialog.showMessageBox(null, {
              type: 'error',
              buttons: ['OK'],
              title: 'Error',
              message: 'Failed to connect to the Discord WebSocket server!',
              detail: 'This means you can\'t use the "Listening to" status. Check your Internet connection.'
            });
            return;
          }
          log('WebSocket', 'Retrying connection...');
          await connect(token, `${resumeURL}/?${wsURLParams}`)
            .then(() => clearInterval(interval))
            .catch(() => {
              log('WebSocket', `Connection failed, retrying in 5 seconds (retries left: ${4 - retries})`);
              retries++;
            });
        }, 5000);
      } else {
        dialog.showMessageBox({
          type: 'error',
          buttons: ['Cancel', 'Retry'],
          title: 'Disconnected from WebSocket',
          message: 'This might be a problem with your Internet connection, the token you provided, or just Discord.',
          defaultId: 1,
        })
          .then(async ({ response }) => {
            if (response === 1) {
              await connect(token);
            }
          });
      }
    });

    function heartbeat(ms: number) {
      return setInterval(() => socket.send(JSON.stringify({op: 1, d: null})), ms);
    }
  });
}

export function disconnect(code?: number) {
  log('WebSocket', 'Disconnecting...');
  client.close(code);
  log('WebSocket', 'Disconnected');
}

export async function checkToken(token: string) {
  return (await axios.get('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: token }
  })).status === 200;
}
