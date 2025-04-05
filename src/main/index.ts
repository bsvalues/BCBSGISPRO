import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js')
    }
  });

  // In production, load the bundled app
  // In development, connect to the vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }

  // Register IPC handlers
  registerIpcHandlers();
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC messages from the renderer process
function registerIpcHandlers() {
  // Handle file operations
  
  // Read a file
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error('Error reading file:', err);
      return null;
    }
  });

  // Write a file
  ipcMain.handle('write-file', async (event, { filePath, data }) => {
    try {
      fs.writeFileSync(filePath, data);
      return true;
    } catch (err) {
      console.error('Error writing file:', err);
      return false;
    }
  });

  // List directory contents
  ipcMain.handle('list-directory', async (event, dirPath) => {
    try {
      return fs.readdirSync(dirPath).map(file => {
        const stats = fs.statSync(path.join(dirPath, file));
        return {
          name: file,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          lastModified: stats.mtime
        };
      });
    } catch (err) {
      console.error('Error listing directory:', err);
      return [];
    }
  });

  // Get system info
  ipcMain.handle('get-system-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      hostname: os.hostname(),
      homedir: os.homedir(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };
  });

  // File operations with UI
  ipcMain.on('open-file', async (event) => {
    if (!mainWindow) return;
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tif', 'tiff'] },
        { name: 'GIS Files', extensions: ['geojson', 'json', 'kml', 'shp'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      event.sender.send('file-opened', result.filePaths[0]);
    }
  });

  ipcMain.on('save-file', async (event, { defaultPath, data }) => {
    if (!mainWindow) return;
    
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath,
      filters: [
        { name: 'GeoJSON', extensions: ['geojson'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      try {
        fs.writeFileSync(result.filePath, data);
        event.sender.send('file-saved', result.filePath);
      } catch (err) {
        console.error('Error saving file:', err);
        event.sender.send('error', {
          type: 'file-save-error',
          message: `Failed to save file: ${err.message}`
        });
      }
    }
  });

  // Print a document
  ipcMain.on('print-document', async (event, options) => {
    if (!mainWindow) return;
    
    try {
      const result = await mainWindow.webContents.print(options);
      event.sender.send('print-completed', { success: result });
    } catch (err) {
      console.error('Error printing document:', err);
      event.sender.send('error', {
        type: 'print-error',
        message: `Failed to print document: ${err.message}`
      });
    }
  });

  // Export data
  ipcMain.on('export-data', async (event, { format, data, defaultFilename }) => {
    if (!mainWindow) return;
    
    const extensions = {
      geojson: ['geojson'],
      json: ['json'],
      csv: ['csv'],
      pdf: ['pdf']
    };
    
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultFilename,
      filters: [
        { name: format.toUpperCase(), extensions: extensions[format.toLowerCase()] || ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      try {
        fs.writeFileSync(result.filePath, data);
        event.sender.send('export-completed', result.filePath);
      } catch (err) {
        console.error('Error exporting data:', err);
        event.sender.send('error', {
          type: 'export-error',
          message: `Failed to export data: ${err.message}`
        });
      }
    }
  });
}