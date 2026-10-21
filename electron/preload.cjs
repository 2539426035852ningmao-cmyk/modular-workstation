const {contextBridge,ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('workstation', Object.freeze({
 load: () => ipcRenderer.invoke('workspaces:load'),
 change: command => ipcRenderer.invoke('workspaces:change',command),
 recover: () => ipcRenderer.invoke('workspaces:recover'),
}));
