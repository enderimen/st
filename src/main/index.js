import { app, BrowserWindow, ipcMain, shell, nativeImage } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { autoUpdater } from "electron-updater";

const iconPath = is.dev
  ? join(process.cwd(), 'resources/icon.png')
  : join(process.resourcesPath, 'app.asar.unpacked/resources/icon.png');

let mainWindow

function createWindow() {
  const image = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 390,
    height: 480,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    center: true,
    icon: image,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  if (process.platform === 'darwin') {
    app.dock.setIcon(image);
  }

  mainWindow.on('ready-to-show', () => {
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

  if (!is.dev) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', 'Yeni bir güncelleme bulundu, indiriliyor...');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', 'Sistem güncellendi. Yeni özelliklerin devreye girmesi için uygulama yeniden başlatılıyor, lütfen tekrar giriş yapın.');
    
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 5000);
  }
});

autoUpdater.on('error', (err) => {
  console.error("Güncelleme hatası:", err);
});

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit', (e) => {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript('localStorage.removeItem("token")');
  }
});