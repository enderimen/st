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

ipcMain.on('check-for-updates', () => {
  if (is.dev) {
    if (mainWindow) {
      mainWindow.webContents.send('update-message', 'Güncellemeler denetleniyor...');
      setTimeout(() => {
        mainWindow.webContents.send('update-message', `Uygulamanız güncel (v${app.getVersion()}).`);
      }, 1500);
    }
  } else {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron.app')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

autoUpdater.on('checking-for-update', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', 'Güncellemeler denetleniyor...');
  }
});

autoUpdater.on('update-not-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', `Uygulamanız güncel. En son sürümü (v${app.getVersion()}) kullanıyorsunuz.`);
  }
});

autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', 'Yeni bir güncelleme bulundu, indiriliyor...');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', 'Güncelleme başarıyla indirildi ve hazır! Uygulamayı kapatıp tekrar açtığınızda yeni sürüm otomatik olarak devreye girecektir.');
  }
});

autoUpdater.on('error', (err) => {
  console.error("Güncelleme hatası:", err);
  const errorText = err instanceof Error ? err.message : JSON.stringify(err);
  if (mainWindow) {
    mainWindow.webContents.send('update-message', `Güncelleme denetlenirken bir hata oluştu veya bağlantı sağlanamadı. Hata Detayı: ${errorText}`);
    console.log("Güncelleme hatası: ", errorText);
  }
});

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit', (e) => {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript('localStorage.removeItem("token")');
  }
});