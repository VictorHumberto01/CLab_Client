// Electron entry point
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Determine if we're in development or production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// In production, we need to use the Next.js build output
if (!isDev) {
  // Serve the built Next.js app
  const nextDir = path.join(__dirname, '.next');
  if (!fs.existsSync(nextDir)) {
    console.error('Error: .next directory not found. Please run "npm run build" first.');
    app.quit();
  }
}

// Start Electron with our main process
require('./electron/main');

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});