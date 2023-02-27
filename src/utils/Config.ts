import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

export function set(app: Electron.App, key: string, value: any) {
  const path = getConfigPath(app);
  if (!existsSync(path)) writeFileSync(path, '{}');
  const data = require(path);
  data[key] = value;
  writeFileSync(path, JSON.stringify(data));
}

export function get(app: Electron.App, key?: string) {
  const path = getConfigPath(app);
  if (!existsSync(path)) writeFileSync(path, '{}');
  const data = require(path);
  return key ? data[key] : data;
}

function getConfigPath(app: Electron.App) {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'config.json');
}