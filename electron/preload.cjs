const {contextBridge,ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('workstation', Object.freeze({
 load: () => ipcRenderer.invoke('workspaces:load'),
 change: command => ipcRenderer.invoke('workspaces:change',command),
 recover: () => ipcRenderer.invoke('workspaces:recover'),
 appearance: Object.freeze({
  load: () => ipcRenderer.invoke('appearance:load'),
  change: command => ipcRenderer.invoke('appearance:change',command),
  recover: () => ipcRenderer.invoke('appearance:recover'),
 }),
}));
