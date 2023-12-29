const { existsSync, rmSync, copyFileSync } = require('fs');
const { copySync } = require('fs-extra');
const { resolve, join } = require('path');
const { execSync } = require('child_process');
const builder = require('electron-builder');

// If the TypeScript build folder exists, we need to delete it
if (existsSync(resolve('build'))) {
  rmSync(resolve('build'), { recursive: true });
  console.log('Removed "build" directory');
}

// If the Electron app build folder exists, we need to delete it
if (existsSync(resolve('dist'))) {
  rmSync(resolve('dist'), { recursive: true });
  console.log('Removed "dist" directory');
}

// TypeScript Compilation
console.log('Compiling TypeScript...');
try {
  execSync('npx tsc --resolveJsonModule', { stdio: 'inherit' });
  console.log('Compiled TypeScript');
} catch (e) {
  throw e;
}

copyFileSync(resolve('src', 'prompt.html'), resolve('build', 'src', 'prompt.html'));

// Icon
copySync(resolve('src', 'img'), resolve('build', 'src', 'img'));

// App build
console.log('Building setup...');
const config = {
  appId: 'com.github.yuuto.deezerdiscordrpc',
  productName: 'Deezer Discord RPC',
  icon: join(__dirname, '..', 'src', 'img', `app.${process.platform === 'win32' ? 'ico' : 'icns'}`),
  mac: {
    category: 'public.app-category.music',
    target: 'dmg'
  },
  win: {},
  linux: {
    category: 'Audio',
    target: ['snap', 'deb', 'AppImage'],
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
