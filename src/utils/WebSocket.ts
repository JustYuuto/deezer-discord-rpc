import WebSocket from 'ws';
import { userAgent } from '../variables';
import UAParser from 'ua-parser-js';
import { log } from './Log';
import * as Config from './Config';
import * as RPC from './RPC';
import { app } from 'electron';

export let client: WebSocket;
const wsURLParams = new URLSearchParams();
wsURLParams.append('v', '10');
wsURLParams.append('encoding', 'json');
const wsURL = `wss://gateway.discord.gg/?${wsURLParams}`;

export function connect(token: string) {
  return new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(wsURL, {
      headers: {
        'User-Agent': userAgent,
        Origin: 'https://discord.com'
      }
    });
    const ua = new UAParser(userAgent);
    const payload = {
      op: 2,
      d: {
        token,
        capabilities: 4093,
        properties: {
          os: ua.getOS().name,
          browser: ua.getBrowser().name,
          device: '',
          system_locale: 'en-US',
          browser_user_agent: userAgent,
          browser_version: ua.getBrowser().version,
          os_version: ua.getOS().version,
          referrer: 'https://discord.com/developers/docs/resources/invite',
          referring_domain: 'discord.com',
          referrer_current: '',
          referring_domain_current: '',
          release_channel: 'stable',
          client_build_number: 176471,
          client_event_source: null
        },
        presence: {
          activities: []
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
      log('WebSocket', code + ':', desc.toString());
      log('WebSocket', 'Disconnected; resuming connection');
      socket.send(JSON.stringify(payload));
    });

    function heartbeat(ms: number) {
      return setInterval(() => socket.send(JSON.stringify({ op: 1, d: null })), ms);
    }
  });
}

export function disconnect(code?: number) {
  log('WebSocket', 'Disconnecting...');
  client.close(code);
}