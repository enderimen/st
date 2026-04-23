import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,
    height: 480,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    center: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Başlangıçta login ekranını aç
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}


// Login sonrası ana sayfaya geç
export function goToMainPage() {
  if (!mainWindow) return;
  mainWindow.setResizable(true);
  mainWindow.maximize();
}

// IPC listener
ipcMain.on('login-success', () => {
  goToMainPage()
});

ipcMain.on('logout', () => {
  BrowserWindow.getAllWindows().forEach(win => win.close());
  app.quit();
});

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});

app.on('before-quit', (e) => {
  // Burada logout gibi cleanup yapabilirsin
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript('localStorage.removeItem("token")');
  }
});