const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  showNotification: (options) => ipcRenderer.send('show-notification', options),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  onWindowStateChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-state-changed', handler);
    return () => ipcRenderer.removeListener('window-state-changed', handler);
  },
  onDesktopAuthSuccess: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('desktop-auth-success', handler);
    return () => ipcRenderer.removeListener('desktop-auth-success', handler);
  },
  onDesktopDeepLink: (callback) => {
    const handler = (_event, url) => callback(url);
    ipcRenderer.on('desktop-deep-link', handler);
    return () => ipcRenderer.removeListener('desktop-deep-link', handler);
  },
});
