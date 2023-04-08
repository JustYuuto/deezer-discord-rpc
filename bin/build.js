#!/bin/env /usr/bin/node

const { existsSync, rmSync, copyFileSync } = require('fs');
const { copySync } = require('fs-extra');
const { resolve } = require('path');
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
console.log('Compiling icon to an ICO file...');
execSync('yarn run icon');
console.log('Compiled icon to an ICO file');
copySync(resolve('src', 'img'), resolve('build', 'src', 'img'));

// App build
console.log('Building EXE...');
const config = {
  appId: 'com.github.yuuto.deezerdiscordrpc',
  productName: 'Deezer Discord RPC',
  mac: {
    category: 'public.app-category.music',
    target: 'dmg'
  },
  win: {},
  protocols: [
    {
      name: 'Deezer Discord RPC',
      schemes: ['deezer-discord-rpc']
    }
  ],
  files: [
    '!src/*',
    '!src/**/*',
    'build/package.json',
    'build/src/*',
    'build/src/**/*'
  ]
};
builder.build({ targets: builder.Platform.MAC.createTarget(), config }).then(() => {
  console.log(`\nEXE built!`);
});