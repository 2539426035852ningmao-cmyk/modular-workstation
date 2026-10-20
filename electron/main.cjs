const path = require('node:path');
const { app, BrowserWindow, nativeTheme } = require('electron');

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
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  return window;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
