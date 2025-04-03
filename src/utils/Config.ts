import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { dialog } from 'electron';

export async function set(app: Electron.App, key: string, value: unknown) {
  const path = getConfigPath(app);
  if (!existsSync(path)) writeFileSync(path, '{}');
  const data = await import(path);
  data[key] = value;
  try {
    writeFileSync(path, JSON.stringify(data));
  } catch (e) {
    dialog.showMessageBox(null, {
      type: 'error',
      buttons: ['Close'],
      title: 'Failed to write config file',
      message: `An error occurred while writing to ${path}`,
      detail: e?.toString(),
      defaultId: 0
    });
  }
}

export async function get(app: Electron.App, key?: string) {
  const path = getConfigPath(app);
  if (!existsSync(path)) writeFileSync(path, '{}');
  const data = await import(path);
  return key ? data[key] : data;
}

function getConfigPath(app: Electron.App) {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'config.json');
}
