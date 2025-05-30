// Using native fetch since we're in ESM mode

async function getPublicUrl() {
  // Get the Replit URL
  return 'https://f470c34b-0c76-4fd3-9e43-c8e055673fa7-00-2lmujphv9v144.spock.replit.dev';
}

async function testDataQualityRules() {
  try {
    // Get the public URL for the application
    const baseUrl = await getPublicUrl();
    
    console.log(`Testing API at ${baseUrl}`);
    
    // Test getting all data quality rules
    const response = await fetch(`${baseUrl}/api/data-quality/rules`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const rules = await response.json();
    
    console.log('=== Data Quality Rules ===');
    console.log(JSON.stringify(rules, null, 2));
    
    // If successful, try to get available metrics
    if (rules && rules.length > 0) {
      const metricsResponse = await fetch(`${baseUrl}/api/data-quality/metrics?entityType=PARCEL`);
      
      if (!metricsResponse.ok) {
        throw new Error(`HTTP error ${metricsResponse.status}: ${metricsResponse.statusText}`);
      }
      
      const metrics = await metricsResponse.json();
      
      console.log('=== Data Quality Metrics for PARCEL ===');
      console.log(JSON.stringify(metrics, null, 2));
    }
  } catch (error) {
    console.error('Error testing data quality API:', error);
    console.error(error.stack);
  }
}

// Run the test
testDataQualityRules();