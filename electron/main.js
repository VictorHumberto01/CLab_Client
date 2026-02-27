const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const serve = require('electron-serve');

const loadURL = serve({ directory: 'out' });

let mainWindow;
const isMac = process.platform === 'darwin';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // macOS: use hiddenInset for native traffic lights
    // Windows/Linux: use frameless window
    titleBarStyle: 'hidden',
    // Always use frame: true with titleBarStyle hidden so Window Controls Overlay (WCO) works on Windows
    frame: true, 
    titleBarOverlay: !isMac ? {
      color: '#0a0a0b',
      symbolColor: '#ffffff',
      height: 38
    } : false,
    backgroundColor: '#0a0a0b',
  });

  // Use appropriate loading based on environment
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    loadURL(mainWindow); // Using electron-serve for stable production paths
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('run-code', async (event, data) => {
    // Placeholder for run-code if needed here, 
    // but the Client uses fetch to Go server directly usually.
    // If you need native stuff, add here.
    return { success: true };
});

ipcMain.handle('toggle-exam-mode', async (event, isExam) => {
  if (mainWindow) {
    if (isExam) {
      mainWindow.setKiosk(true);
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
      
      // Hook system shortcuts on Windows to aggressively prevent exiting
      if (!isMac) {
          try {
              globalShortcut.register('Alt+Tab', () => { console.log('Blocked Alt+Tab'); });
              globalShortcut.register('CommandOrControl+Tab', () => { console.log('Blocked Ctrl+Tab'); });
              globalShortcut.register('Alt+Shift+Tab', () => { console.log('Blocked Alt+Shift+Tab'); });
              globalShortcut.register('Alt+F4', () => { console.log('Blocked Alt+F4'); });
              globalShortcut.register('CommandOrControl+Esc', () => { console.log('Blocked Ctrl+Esc'); });
          } catch(e) {
              console.error("Failed to register some global shortcuts", e);
          }
      }
    } else {
      mainWindow.setKiosk(false);
      mainWindow.setAlwaysOnTop(false, 'normal');
      mainWindow.setFullScreen(false);
      if (!isMac) {
          globalShortcut.unregisterAll();
      }
    }
  }
  return { success: true };
});
