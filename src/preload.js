const { contextBridge, ipcRenderer } = require('electron');

// Define a set of functions that will be available to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Send messages to the main process
  send: (channel, data) => {
    // Allow only specific channels
    const validChannels = ['save-file', 'open-file', 'print-document', 'export-data'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Listen for messages from the main process
  receive: (channel, func) => {
    const validChannels = ['file-saved', 'file-opened', 'print-completed', 'export-completed', 'error'];
    if (validChannels.includes(channel)) {
      // Remove the event listener if it exists
      ipcRenderer.removeAllListeners(channel);
      // Add a new listener
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // Invoke a function in the main process and get the result (async)
  invoke: async (channel, data) => {
    const validChannels = ['read-file', 'write-file', 'list-directory', 'get-system-info'];
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
    return null;
  }
});