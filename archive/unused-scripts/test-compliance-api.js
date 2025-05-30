// Using native fetch since we're in ESM mode

async function getPublicUrl() {
  // Get the Replit URL
  return 'https://f470c34b-0c76-4fd3-9e43-c8e055673fa7-00-2lmujphv9v144.spock.replit.dev';
}

async function testComplianceApi() {
  try {
    // Get the public URL for the application
    const baseUrl = await getPublicUrl();
    
    console.log(`Testing API at ${baseUrl}`);
    
    // Test getting all RCW requirements
    const response = await fetch(`${baseUrl}/api/compliance/requirements`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const requirements = await response.json();
    
    console.log('=== RCW Requirements ===');
    console.log(JSON.stringify(requirements, null, 2));
    
    // If successful, try to get compliance statistics
    if (requirements && requirements.length > 0) {
      const statsResponse = await fetch(`${baseUrl}/api/compliance/stats?entityType=ASSESSMENT`);
      
      if (!statsResponse.ok) {
        throw new Error(`HTTP error ${statsResponse.status}: ${statsResponse.statusText}`);
      }
      
      const stats = await statsResponse.json();
      
      console.log('=== Compliance Statistics for ASSESSMENT ===');
      console.log(JSON.stringify(stats, null, 2));
    }
  } catch (error) {
    console.error('Error testing compliance API:', error);
    console.error(error.stack);
  }
}

// Run the test
testComplianceApi();