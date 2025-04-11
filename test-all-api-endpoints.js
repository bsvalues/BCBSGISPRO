// Comprehensive test script for data engineering API endpoints

async function getPublicUrl() {
  // Get the Replit URL
  return 'https://f470c34b-0c76-4fd3-9e43-c8e055673fa7-00-2lmujphv9v144.spock.replit.dev';
}

async function testAllApis() {
  try {
    // Get the public URL for the application
    const baseUrl = await getPublicUrl();
    
    console.log(`=============================================`);
    console.log(`Testing all Data Engineering APIs at ${baseUrl}`);
    console.log(`=============================================\n`);

    // 1. Test DATA QUALITY endpoints
    console.log(`\n=== DATA QUALITY API TESTS ===\n`);
    
    // 1.1 Get all data quality rules
    console.log(`Fetching data quality rules...`);
    const rulesResponse = await fetch(`${baseUrl}/api/data-quality/rules`);
    if (!rulesResponse.ok) {
      throw new Error(`HTTP error ${rulesResponse.status}: ${rulesResponse.statusText}`);
    }
    const rules = await rulesResponse.json();
    console.log(`✓ Successfully retrieved ${rules.length} data quality rules`);
    
    if (rules.length > 0) {
      // 1.2 Get a specific data quality rule
      const ruleId = rules[0].id;
      console.log(`Fetching data quality rule with ID ${ruleId}...`);
      const ruleResponse = await fetch(`${baseUrl}/api/data-quality/rules/${ruleId}`);
      if (!ruleResponse.ok) {
        throw new Error(`HTTP error ${ruleResponse.status}: ${ruleResponse.statusText}`);
      }
      const rule = await ruleResponse.json();
      console.log(`✓ Successfully retrieved data quality rule: "${rule.name}"`);
    }
    
    // 1.3 Get data quality metrics
    console.log(`Fetching data quality metrics for PARCEL entity type...`);
    const metricsResponse = await fetch(`${baseUrl}/api/data-quality/metrics?entityType=PARCEL`);
    if (!metricsResponse.ok) {
      throw new Error(`HTTP error ${metricsResponse.status}: ${metricsResponse.statusText}`);
    }
    const metrics = await metricsResponse.json();
    console.log(`✓ Successfully retrieved data quality metrics:\n   - Average Score: ${metrics.averageScore}\n   - Pass Rate: ${metrics.passRate}\n   - Entity Count: ${metrics.entityCount}`);

    // 2. Test COMPLIANCE endpoints
    console.log(`\n=== COMPLIANCE API TESTS ===\n`);
    
    // 2.1 Get all RCW requirements
    console.log(`Fetching compliance requirements...`);
    const requirementsResponse = await fetch(`${baseUrl}/api/compliance/requirements`);
    if (!requirementsResponse.ok) {
      throw new Error(`HTTP error ${requirementsResponse.status}: ${requirementsResponse.statusText}`);
    }
    const requirements = await requirementsResponse.json();
    console.log(`✓ Successfully retrieved ${requirements.length} compliance requirements`);
    
    if (requirements.length > 0) {
      // 2.2 Get a specific RCW requirement
      const reqId = requirements[0].id;
      console.log(`Fetching compliance requirement with ID ${reqId}...`);
      const reqResponse = await fetch(`${baseUrl}/api/compliance/requirements/${reqId}`);
      if (!reqResponse.ok) {
        throw new Error(`HTTP error ${reqResponse.status}: ${reqResponse.statusText}`);
      }
      const req = await reqResponse.json();
      console.log(`✓ Successfully retrieved compliance requirement: "${req.title}"`);
    }
    
    // 2.3 Get compliance statistics for ASSESSMENT entity type
    console.log(`Fetching compliance statistics for ASSESSMENT entity type...`);
    const statsResponse = await fetch(`${baseUrl}/api/compliance/stats?entityType=ASSESSMENT`);
    if (!statsResponse.ok) {
      throw new Error(`HTTP error ${statsResponse.status}: ${statsResponse.statusText}`);
    }
    const stats = await statsResponse.json();
    console.log(`✓ Successfully retrieved compliance statistics:\n   - Entity Count: ${stats.entityCount}\n   - Compliance Rate: ${stats.complianceRate}\n   - Total Requirements: ${stats.total}`);

    // Summary
    console.log(`\n=============================================`);
    console.log(`TEST SUMMARY: All API endpoints working correctly!`);
    console.log(`=============================================\n`);
  } catch (error) {
    console.error('Error testing APIs:', error);
    console.error(error.stack);
  }
}

// Run the test
testAllApis();