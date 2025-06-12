//runs before renderer.js
//can expose Node.js APIs to renderer safely, preventing direct Node.js access from renderer for security

//works with ipcRenderer in main.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadChannels: () => ipcRenderer.invoke('load-channels'),
  saveChannels: (channels) => ipcRenderer.invoke('save-channels'),
  minimizeWindow: ()=>ipcRenderer.send('minimize-window'),
  closeWindow: ()=>ipcRenderer.send('close-window'),
  exitApp:()=>ipcRenderer.send('exit-app')
});