const { existsSync, rmSync } = require('fs');
const { resolve, join } = require('path');
const builder = require('electron-builder');

// If the Electron app build folder exists, we need to delete it
if (existsSync(resolve('dist'))) {
  rmSync(resolve('dist'), { recursive: true });
  console.log('Removed "dist" directory');
}

// App build
console.log('Building setup...');
const config = {
  appId: 'com.github.yuuto.deezerdiscordrpc',
  productName: 'Deezer Discord RPC',
  mac: {
    category: 'public.app-category.music',
    target: 'dmg',
    icon: join(__dirname, '..', 'src', 'img', 'app.icns'),
  },
  win: {
    target: 'nsis',
    icon: join(__dirname, '..', 'src', 'img', 'app.ico'),
  },
  linux: {
    category: 'Audio;AudioVideo',
    target: ['snap', 'deb', 'AppImage', 'rpm'],
    icon: join(__dirname, '..', 'src', 'img', 'app.png'),
  },
  artifactName: 'DeezerDiscordRPC-${os}-${arch}.${ext}',
  files: [
    '!src/*',
    '!src/**/*',
    'build/package.json',
    'build/src/*',
    'build/src/**/*'
  ]
};

const specifiedOS = process.argv[2];
if (specifiedOS) {
  if (specifiedOS === 'windows') {
    config.mac = undefined;
    config.linux = undefined;
  } else if (specifiedOS === 'macos') {
    config.linux = undefined;
    config.win = undefined;
  } else if (specifiedOS === 'linux') {
    config.mac = undefined;
    config.win = undefined;
  }
} else if (process.platform === 'win32') {
  config.mac = undefined;
  config.linux = undefined;
}

builder.build({
  config,
  publish: 'never'
}).then(() => {
  console.log('\nSetup built in the "dist" folder.');
});
