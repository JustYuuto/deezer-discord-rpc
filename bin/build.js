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

const platform = process.argv[2];
if (!builder.Platform[platform.toUpperCase()]) throw new Error(`The platform "${platform}" is not supported for building. Supported: windows, linux, mac`);

builder.build({ targets: builder.Platform[platform.toUpperCase()].createTarget(), config }).then(() => {
  console.log('\nSetup built in the "dist" folder.');
});
