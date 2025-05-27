// Preload script runs in a separate context but has access to both Node.js and browser APIs
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Communication with main process
  ipcRenderer: {
    // Send messages to main process
    send: (channel, data) => {
      // Whitelist channels for security
      const validChannels = ['run-code', 'save-file', 'open-file'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    // Receive messages from main process
    on: (channel, func) => {
      const validChannels = ['run-code-result', 'file-saved', 'file-opened'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Invoke methods and get responses (promise-based)
    invoke: (channel, data) => {
      const validChannels = ['show-save-dialog', 'show-open-dialog'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    }
  },
  
  // Provide information about the environment
  platform: process.platform,
  
  // App version from package.json
  appVersion: process.env.npm_package_version
});

// Log when preload script has run
console.log('Preload script loaded');