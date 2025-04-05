// Simple WebSocket test script
import WebSocket from 'ws';

// Create WebSocket connection
console.log('Creating WebSocket connection to ws://localhost:5000/ws');
const socket = new WebSocket('ws://localhost:5000/ws');

// Connection opened
socket.on('open', () => {
  console.log('Connection established');
  
  // Send a message
  const message = {
    type: 'join',
    roomId: 'test-room',
    userId: 'test-user'
  };
  
  console.log('Sending message:', JSON.stringify(message));
  socket.send(JSON.stringify(message));
  
  // Send chat message
  setTimeout(() => {
    const chatMessage = {
      type: 'chat',
      roomId: 'test-room',
      userId: 'test-user',
      payload: {
        sender: 'Test User',
        message: 'Hello from test script'
      }
    };
    
    console.log('Sending chat message:', JSON.stringify(chatMessage));
    socket.send(JSON.stringify(chatMessage));
  }, 1000);
  
  // Leave room after 3 seconds
  setTimeout(() => {
    const leaveMessage = {
      type: 'leave',
      roomId: 'test-room'
    };
    
    console.log('Sending leave message:', JSON.stringify(leaveMessage));
    socket.send(JSON.stringify(leaveMessage));
    
    // Close connection after 1 more second
    setTimeout(() => {
      console.log('Closing connection');
      socket.close();
      process.exit(0);
    }, 1000);
  }, 3000);
});

// Listen for messages
socket.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Message from server:', message);
});

// Listen for errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Connection closed
socket.on('close', (code, reason) => {
  console.log(`Connection closed: ${code} - ${reason}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing connection due to process termination');
  socket.close();
  process.exit(0);
});