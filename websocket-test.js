// WebSocket test script for Achievement Notifications
import WebSocket from 'ws';
import fetch from 'node-fetch';

// Test variables
const userId = 1; // Test user ID
const port = process.env.PORT || 3000;
const baseUrl = `http://localhost:${port}`;

// Create WebSocket connection
console.log(`Creating WebSocket connection to ws://localhost:${port}/ws`);
const socket = new WebSocket(`ws://localhost:${port}/ws`);

// Connection opened
socket.on('open', async () => {
  console.log('Connection established');
  
  // Subscribe to achievement notifications
  const subscribeMessage = {
    type: 'subscribe',
    channel: `user-achievements-${userId}`
  };
  
  console.log('Subscribing to achievement notifications:', JSON.stringify(subscribeMessage));
  socket.send(JSON.stringify(subscribeMessage));
  
  // After 1 second, trigger an achievement award
  setTimeout(async () => {
    try {
      console.log('Triggering achievement award via API...');
      
      // First, get a list of available achievements
      const achievementsResponse = await fetch(`${baseUrl}/api/achievements`);
      
      if (!achievementsResponse.ok) {
        throw new Error(`Failed to fetch achievements: ${achievementsResponse.statusText}`);
      }
      
      const achievements = await achievementsResponse.json();
      
      if (!achievements || !achievements.length) {
        throw new Error('No achievements available to award');
      }
      
      // Pick the first achievement
      const testAchievement = achievements[0];
      console.log(`Using achievement for testing: ${testAchievement.title} (ID: ${testAchievement.id})`);
      
      // Award the achievement to the test user
      const awardResponse = await fetch(`${baseUrl}/api/achievements/user/${userId}/award/${testAchievement.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          progress: 50 // Partial progress
        })
      });
      
      if (!awardResponse.ok) {
        throw new Error(`Failed to award achievement: ${awardResponse.statusText}`);
      }
      
      console.log('Achievement awarded successfully (50% progress)');
      
      // After 2 seconds, update the achievement to 100% to trigger completion notification
      setTimeout(async () => {
        try {
          const updateResponse = await fetch(`${baseUrl}/api/achievements/user/${userId}/achievement/${testAchievement.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              progress: 100, // Complete the achievement
              metadata: {
                completedVia: 'websocket-test'
              }
            })
          });
          
          if (!updateResponse.ok) {
            throw new Error(`Failed to update achievement progress: ${updateResponse.statusText}`);
          }
          
          console.log('Achievement progress updated to 100% (completed)');
          
          // After 3 more seconds, unsubscribe and close
          setTimeout(() => {
            const unsubscribeMessage = {
              type: 'unsubscribe',
              channel: `user-achievements-${userId}`
            };
            
            console.log('Unsubscribing from channel:', JSON.stringify(unsubscribeMessage));
            socket.send(JSON.stringify(unsubscribeMessage));
            
            // Close connection after 1 more second
            setTimeout(() => {
              console.log('Test completed. Closing connection.');
              socket.close();
              process.exit(0);
            }, 1000);
          }, 3000);
          
        } catch (error) {
          console.error('Error updating achievement progress:', error);
          socket.close();
          process.exit(1);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error triggering achievement:', error);
      socket.close();
      process.exit(1);
    }
  }, 1000);
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