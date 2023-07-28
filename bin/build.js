const { existsSync, rmSync, copyFileSync, readFileSync } = require('fs');
const { copySync } = require('fs-extra');
const { resolve } = require('path');
const { execSync } = require('child_process');
const builder = require('electron-builder');
const packageJson = require('../package.json');

// If the TypeScript build folder exists, we need to delete it
if (existsSync(resolve('build'))) {
  rmSync(resolve('build'), { recursive: true });
  console.log('Removed "build" directory');
}

// If the Electron app build folder exists, we need to delete it
if (existsSync(resolve('dist')) && !readFileSync(resolve('dist', 'latest.yml')).toString().includes(packageJson.version)) {
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
console.log('Building setup...');
const config = {
  appId: 'com.github.yuuto.deezerdiscordrpc',
  productName: 'Deezer Discord RPC',
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
  console.log(`\nSetup built in the "dist" folder.`);
});
