// WebSocket Connectivity Test
import { WebSocket } from 'ws';

async function testWebSocketConnectivity() {
  console.log('========== WEBSOCKET CONNECTIVITY TESTING ==========');
  
  return new Promise((resolve) => {
    // Determine WebSocket URL based on server
    const protocol = 'ws:';
    const host = 'localhost:5000';
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log(`Connecting to WebSocket at: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    
    let messageReceived = false;
    const messageTimeout = setTimeout(() => {
      if (!messageReceived) {
        console.log('ℹ️ No server message received within timeout period');
        cleanup();
      }
    }, 5000);
    
    ws.on('open', () => {
      console.log('✓ WebSocket connection established successfully');
      
      // Send a test message
      const testMessage = {
        type: 'test',
        data: {
          client: 'test-script',
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('Sending test message:', testMessage);
      ws.send(JSON.stringify(testMessage));
      
      // Send an update position message
      const positionMessage = {
        type: 'userPosition',
        data: {
          userId: 'test-user',
          position: {
            lat: 44.5646,
            lng: -123.2620
          },
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('Sending position update message:', positionMessage);
      ws.send(JSON.stringify(positionMessage));
      
      // Send a chat message
      const chatMessage = {
        type: 'chat',
        data: {
          userId: 'test-user',
          username: 'Test User',
          message: 'Hello from testing script!',
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('Sending chat message:', chatMessage);
      ws.send(JSON.stringify(chatMessage));
    });
    
    ws.on('message', (data) => {
      messageReceived = true;
      try {
        const message = JSON.parse(data);
        console.log('✓ Received message from server:', message);
      } catch (e) {
        console.log('✓ Received non-JSON message from server:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      cleanup();
    });
    
    ws.on('close', (code, reason) => {
      console.log(`WebSocket connection closed: Code ${code}, Reason: ${reason || 'No reason provided'}`);
      cleanup();
    });
    
    // Allow some time for communication before closing
    const connectionTimeout = setTimeout(() => {
      console.log('\n✅ WebSocket connectivity test completed');
      cleanup();
    }, 8000);
    
    function cleanup() {
      clearTimeout(messageTimeout);
      clearTimeout(connectionTimeout);
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      
      resolve();
    }
  });
}

// Run the tests
testWebSocketConnectivity();