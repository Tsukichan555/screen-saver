const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('loopPlayback', {
  selectMedia: () => ipcRenderer.invoke('select-media'),
  loadLastSelection: () => ipcRenderer.invoke('load-last-selection'),
  saveLastSelection: (descriptor) => ipcRenderer.invoke('save-last-selection', descriptor),
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  pathToFileURL: (filePath) => {
    if (!filePath) return '';
    let resolved = path.resolve(filePath);
    if (process.platform === 'win32') {
      resolved = '/' + resolved.replace(/\\/g, '/');
    }
    return encodeURI(`file://${resolved}`);
  }
});
