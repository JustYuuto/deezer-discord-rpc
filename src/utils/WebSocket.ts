import WebSocket from 'ws';
import { noWsActivity, userAgents } from '../variables';
import UAParser from 'ua-parser-js';
import { log } from './Log';
import * as Config from './Config';
import * as RPC from './RPC';
import { app, dialog } from 'electron';
import { clearInterval } from 'timers';

export let client: WebSocket;
const wsURLParams = new URLSearchParams();
wsURLParams.append('v', '10');
wsURLParams.append('encoding', 'json');
const wsURL = `wss://gateway.discord.gg/?${wsURLParams}`;

export function connect(token: string, resumeUrl?: string) {
  return new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(resumeUrl ? resumeUrl : wsURL, {
      headers: {
        'User-Agent': userAgents.discordApp,
        Origin: 'https://discord.com'
      }
    });
    const ua = new UAParser(userAgents.discordApp);
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
          browser_user_agent: userAgents.discordApp,
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
          console.log(`${resumeURL}/?${wsURLParams}`);
          await connect(token, `${resumeURL}/?${wsURLParams}`)
            .then(() => clearInterval(interval))
            .catch(() => {
              log('WebSocket', `Connection failed, retrying in 5 seconds (retries left: ${4 - retries})`);
              retries++;
            });
        }, 5000);
      } else {
        log('WebSocket', code + ':', desc.toString());
        log('WebSocket', 'Disconnected; resuming connection');
        socket.send(JSON.stringify(payload));
      }
    });

    function heartbeat(ms: number) {
      return setInterval(() => socket.send(JSON.stringify({ op: 1, d: null })), ms);
    }
  });
}

export function disconnect(code?: number) {
  log('WebSocket', 'Disconnecting...');
  client.send(JSON.stringify(noWsActivity));
  client.close(code);
  log('WebSocket', 'Disconnected');
}
