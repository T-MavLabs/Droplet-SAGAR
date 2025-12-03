// Preload script for Electron
// This script runs in a context that has access to both the DOM and Node.js APIs
// but is isolated from the main renderer process for security

const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the Node.js APIs without exposing the entire Node.js API
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you want to expose to the renderer process here
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
