#!/bin/env /usr/bin/bash

const { existsSync, rmSync, copyFileSync } = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');

if (existsSync(resolve('build'))) {
  rmSync(resolve('build'), { recursive: true });
  console.log('Removed "build" directory');
}

if (existsSync(resolve('dist'))) {
  rmSync(resolve('dist'), { recursive: true });
  console.log('Removed "dist" directory');
}

console.log('Compiling TypeScript...');
try {
  execSync('tsc --resolveJsonModule', { stdio: 'inherit' });
  console.log('Compiled TypeScript');
} catch (e) {
  throw e;
}

copyFileSync(resolve('src', 'prompt.html'), resolve('build', 'src', 'prompt.html'));

console.log('Compiling icon to an ICO file...');
execSync('yarn run icon');
console.log('Compiled icon to an ICO file');

console.log('Building EXE...');
execSync('electron-builder', { stdio: 'inherit' });

console.log('');
console.log(`EXE built! The file can be found at "${resolve('dist', `Deezer Discord RPC Setup ${require('../package.json').version}.exe`)}"`);
