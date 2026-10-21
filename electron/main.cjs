const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, nativeTheme, Menu, ipcMain, dialog } = require('electron');
const {WorkspaceStore} = require('./workspace-store.cjs');
const {AppearanceStore} = require('./appearance-store.cjs');
// Native launch profiles isolate automated tests from the user's real records.
const profile = app.commandLine.getSwitchValue('user-data-dir');
const background = app.commandLine.hasSwitch('workstation-background');
if(background && !profile) app.exit(1);
if (profile) app.setPath('userData', path.resolve(profile));
// Isolated background checks must never open a native confirmation on the user's desktop.
if(background) dialog.showMessageBox=async()=>({response:0});
const store = new WorkspaceStore(app.getPath('userData'));
const appearance = new AppearanceStore(app.getPath('userData'));
const entry = path.join(__dirname, '..', 'dist', 'index.html');
let mainWindow;
const failedSaves = new Set();
let closingWindow = false;
const primary = app.requestSingleInstanceLock();
if (!primary) app.quit();
app.on('second-instance', () => { if (!background && mainWindow && !mainWindow.isDestroyed()) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
for (const [channel,operation] of Object.entries({
 'workspaces:load': () => store.load(),
 'workspaces:change': command => store.mutate(command),
 'workspaces:recover': () => store.recover(),
 'appearance:load': () => store.enqueue(()=>appearance.load()),
 'appearance:change': command => store.enqueue(()=>appearance.change(command)),
 'appearance:recover': () => store.enqueue(()=>appearance.recover()),
})) ipcMain.handle(channel, async (event, command) => {
 if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame
  || event.senderFrame.url !== pathToFileURL(entry).href) return {ok:false,error:'DENIED'};
 if (closingWindow) return {ok:false,error:'CLOSING'};
 const area=channel.split(':')[0];
 try {
  const state = await operation(command);
  if (channel === 'workspaces:change' || channel === 'appearance:change' || channel === 'appearance:recover') failedSaves.delete(area);
  if (area==='appearance') nativeTheme.themeSource=state.theme;
  return {ok:true,state};
 }
 catch (error) { if (error.message === 'SAVE_FAILED') failedSaves.add(area); return {ok:false,error:['CORRUPT','UNSUPPORTED','READ_FAILED','SAVE_FAILED','INVALID','LIMIT','NOT_READY'].includes(error.message)?error.message:'READ_FAILED'}; }
});
nativeTheme.on('updated',()=>{if(mainWindow&&!mainWindow.isDestroyed())mainWindow.setBackgroundColor(nativeTheme.shouldUseDarkColors?'#1c1d20':'#f8f5ef');});

function createWindow() {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 800,
    minHeight: 540,
    show: false,
    focusable: !background,
    skipTaskbar: background,
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
  window.once('ready-to-show', () => {if(!background)window.show();});
  let closing = false;
  window.on('close', event => {
    if (closing) return;
    event.preventDefault();
    if (closingWindow) return;
    closingWindow = true;
    void store.tail.then(async () => {
      if (window.isDestroyed()) return;
      if (failedSaves.size>0) {
        const zh = app.getLocale().startsWith('zh');
        const result = await dialog.showMessageBox(window, {type:'warning',buttons:zh?['返回工作站','放弃本次更改并退出']:['Return to workstation','Discard failed change and exit'],defaultId:0,cancelId:0,message:zh?'本次更改未保存':'The latest change was not saved',detail:zh?'原有记录保持不变':'Previous records are unchanged'});
        if (result.response !== 1) return;
      }
      closing = true; if (!window.isDestroyed()) window.close();
    }).catch(() => {
      // Keep the window open if confirmation fails rather than discard failed changes.
      // The failed operation stays recorded until its own save succeeds.
    }).finally(() => { if (!closing) closingWindow = false; });
  });
  window.on('closed', () => { if (mainWindow === window) mainWindow = null; closingWindow = false; });
  void window.loadFile(entry);
  mainWindow = window;
  return window;
}

if (primary) app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  try {nativeTheme.themeSource=(await store.enqueue(()=>appearance.load())).theme;} catch {nativeTheme.themeSource='system';}
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
