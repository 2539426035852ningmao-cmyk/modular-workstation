const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, nativeTheme, Menu, ipcMain, dialog } = require('electron');
const {WorkspaceStore} = require('./workspace-store.cjs');
// Native launch profiles isolate automated tests from the user's real records.
const profile = app.commandLine.getSwitchValue('user-data-dir');
if (profile) app.setPath('userData', path.resolve(profile));
const store = new WorkspaceStore(app.getPath('userData'));
const entry = path.join(__dirname, '..', 'dist', 'index.html');
let mainWindow;
let saveFailed = false;
const primary = app.requestSingleInstanceLock();
if (!primary) app.quit();
app.on('second-instance', () => { if (mainWindow) { mainWindow.restore(); mainWindow.focus(); } });
for (const [channel,operation] of Object.entries({
 'workspaces:load': () => store.load(),
 'workspaces:change': command => store.mutate(command),
 'workspaces:recover': () => store.recover(),
})) ipcMain.handle(channel, async (event, command) => {
 if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame
  || event.senderFrame.url !== pathToFileURL(entry).href) return {ok:false,error:'DENIED'};
 try { const state = await operation(command); if (channel === 'workspaces:change') saveFailed = false; return {ok:true,state}; }
 catch (error) { if (error.message === 'SAVE_FAILED') saveFailed = true; return {ok:false,error:['CORRUPT','UNSUPPORTED','READ_FAILED','SAVE_FAILED','INVALID','LIMIT','NOT_READY'].includes(error.message)?error.message:'READ_FAILED'}; }
});

function createWindow() {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 800,
    minHeight: 540,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1d20' : '#f8f5ef',
    title: '模块化工作站 · 技术原型',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  let closing = false;
  window.on('close', event => {
    if (closing) return;
    event.preventDefault();
    void store.tail.then(async () => {
      if (saveFailed) {
        const zh = app.getLocale().startsWith('zh');
        const result = await dialog.showMessageBox(window, {type:'warning',buttons:zh?['返回工作站','放弃本次更改并退出']:['Return to workstation','Discard failed change and exit'],defaultId:0,cancelId:0,message:zh?'本次更改未保存':'The latest change was not saved',detail:zh?'原有记录保持不变':'Previous records are unchanged'});
        if (result.response !== 1) return;
      }
      closing = true; window.close();
    });
  });
  void window.loadFile(entry);
  mainWindow = window;
  return window;
}

if (primary) app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
