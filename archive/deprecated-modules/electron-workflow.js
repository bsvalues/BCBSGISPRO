const { app, BrowserWindow } = require('electron');
const path = require('path');
const cp = require('child_process');

// Start the mock API server
const apiServerPath = path.join(__dirname, 'mock-api', 'server.js');
console.log('Starting mock API server...');
const apiServer = cp.spawn('node', [apiServerPath], {
  stdio: 'inherit'
});

// Handle API server exit
apiServer.on('exit', (code) => {
  console.log(`Mock API server exited with code ${code}`);
});

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'preload.js')
    }
  });

  // Load the index.html from the vite dev server or production build
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    // In development, connect to the vite dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open the DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built app
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Clean up before exit
app.on('before-quit', () => {
  console.log('Shutting down mock API server...');
  if (apiServer && !apiServer.killed) {
    apiServer.kill('SIGINT');
  }
});