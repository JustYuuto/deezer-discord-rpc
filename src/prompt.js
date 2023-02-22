const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('promptSubmit', {
    send: (channel, payload) => ipcRenderer.send(channel, payload)
});
