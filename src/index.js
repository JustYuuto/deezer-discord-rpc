const RPC = require('discord-rpc');
const album = require('./activity/album');

const clientId = '899229435130183690';

const rpc = new RPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

async function setActivity() {
  if (!rpc) return;
  
  rpc.setActivity({
    details: `Title`,
    state: 'By Someone',
    startTimestamp,
    largeImageKey: album.getAlbumCover(302127),
    largeImageText: 'Deezer',
    smallImageKey: 'snek_small',
    smallImageText: 'no',
    instance: false,
    buttons: [
      {
        label: 'See album',
        url: 'https://www.deezer.com/'
      }
    ]
  });
}

rpc.on('ready', () => {
  setActivity();

  setInterval(() => {
    setActivity();
  }, 15e3);
});

rpc.login({ clientId }).catch(console.error);