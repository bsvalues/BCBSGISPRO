const cp = require('child_process');
const path = require('path');

// Get the path to the mock API server file
const apiServerPath = path.join(__dirname, 'mock-api', 'server.js');

// Start the mock API server
console.log('Starting mock API server...');
const server = cp.spawn('node', [apiServerPath], {
  stdio: 'inherit'
});

// Handle server exit
server.on('exit', (code) => {
  console.log(`Mock API server exited with code ${code}`);
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down mock API server...');
  server.kill('SIGINT');
  process.exit(0);
});