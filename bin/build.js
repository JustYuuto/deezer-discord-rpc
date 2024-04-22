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
    category: 'Audio',
    target: ['snap', 'deb', 'AppImage'],
    icon: join(__dirname, '..', 'src', 'img', 'app.png'),
  },
  files: [
    '!src/*',
    '!src/**/*',
    'build/package.json',
    'build/src/*',
    'build/src/**/*'
  ]
};

const options = {
  config,
  win: ['nsis'],
  x64: true,
  publish: 'never',
};
if (process.platform === 'darwin') options.mac = ['dmg'];
// Linux programs like chmod are not supported on Windows
if (process.platform !== 'win32') options.linux = ['snap', 'deb', 'AppImage'];

builder.build(options).then(() => {
  console.log('\nSetup built in the "dist" folder.');
});
