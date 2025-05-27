const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,        // Changed to false for security
      contextIsolation: true,        // Changed to true (modern Electron standard)
      preload: path.join(__dirname, 'preload.js'),  // Make sure preload is loaded
      webSecurity: true,             // Enable web security
      allowRunningInsecureContent: false
    },
    show: false // Don't show until content is loaded
  });

  // Wait for Next.js development server
  const isDev = process.env.NODE_ENV === 'development';
  const startUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../.next/server/pages/index.html')}`;

  win.loadURL(startUrl);

  // Show window when content is ready
  win.once('ready-to-show', () => {
    win.show();
    if (isDev) {
      win.webContents.openDevTools();
    }
  });

  // Handle load errors with retry logic
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('Failed to load URL:', validatedURL, 'Error:', errorDescription);
    
    // Only retry for network errors, not for invalid URLs
    if (errorCode === -102 || errorCode === -106) { // Connection refused or internet disconnected
      setTimeout(() => {
        console.log('Retrying to load URL...');
        win.loadURL(startUrl);
      }, 2000);
    }
  });

  // Add IPC handlers for file operations
  ipcMain.handle('show-save-dialog', async () => {
    const result = await dialog.showSaveDialog(win, {
      filters: [
        { name: 'C Files', extensions: ['c'] },
        { name: 'C++ Files', extensions: ['cpp', 'cxx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result;
  });

  ipcMain.handle('show-open-dialog', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'C Files', extensions: ['c'] },
        { name: 'C++ Files', extensions: ['cpp', 'cxx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result;
  });

  // Handle code compilation (if you want to move it to main process)
  ipcMain.handle('run-code', async (event, { code, input }) => {
    try {
      // Your existing cloud compilation logic
      const response = await fetch("http://localhost:8080/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, input }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        error: "Failed to connect to compiler service. Make sure your Go API is running on localhost:8080"
      };
    }
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();
  
  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle security - prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Clean up IPC handlers on quit
app.on('before-quit', () => {
  ipcMain.removeAllListeners();
});