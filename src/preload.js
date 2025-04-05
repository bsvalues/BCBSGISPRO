// Preload script for Electron app
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // File operations
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    writeFile: (path, data) => ipcRenderer.invoke('write-file', { filePath: path, data }),
    listDirectory: (path) => ipcRenderer.invoke('list-directory', path),
    
    // Dialog operations
    openFile: () => ipcRenderer.send('open-file'),
    saveFile: (defaultPath, data) => ipcRenderer.send('save-file', { defaultPath, data }),
    
    // System info
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    
    // Document operations
    printDocument: (options) => ipcRenderer.send('print-document', options),
    exportData: (format, data, defaultFilename) => 
      ipcRenderer.send('export-data', { format, data, defaultFilename }),
    
    // Event listeners
    on: (channel, callback) => {
      // Whitelist channels to listen to
      const validChannels = [
        'file-opened', 
        'file-saved', 
        'export-completed', 
        'print-completed',
        'error'
      ];
      
      if (validChannels.includes(channel)) {
        // Remove the event listener if it exists to avoid leaks
        ipcRenderer.removeAllListeners(channel);
        // Add a new listener
        ipcRenderer.on(channel, (_, ...args) => callback(...args));
      }
    },
    
    // Remove event listeners
    removeAllListeners: (channel) => {
      // Whitelist channels to listen to
      const validChannels = [
        'file-opened', 
        'file-saved', 
        'export-completed', 
        'print-completed',
        'error'
      ];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  }
);