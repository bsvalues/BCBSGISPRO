// Comprehensive End-to-End Testing Script
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function runE2ETests() {
  console.log('==========================================================');
  console.log('STARTING COMPREHENSIVE END-TO-END TESTING');
  console.log('==========================================================');
  
  // Register and login a test user for authenticated tests
  console.log('\nSetting up test user for authenticated API tests...');
  try {
    const registerResult = await execAsync(
      `curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"username":"testuser_e2e","email":"e2e@example.com","password":"TestPassword123!"}'`
    );
    
    const loginResult = await execAsync(
      `curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"testuser_e2e","password":"TestPassword123!"}' -c cookie.txt`
    );
    
    console.log('✓ Test user authentication configured');
  } catch (error) {
    console.log('⚠️ Test user setup failed, tests may have authentication issues:', error.message);
  }
  
  const tests = [
    {
      name: 'Document Lineage API',
      file: 'test-document-lineage.js'
    },
    {
      name: 'Map Features API',
      file: 'test-map-features.js'
    },
    {
      name: 'WebSocket Connectivity',
      file: 'test-websocket-connectivity.js'
    },
    // Puppeteer tests often need additional dependencies and headless browser setup
    // Uncomment if puppeteer is installed and configured
    /*
    {
      name: 'UI Components',
      file: 'test-ui-components.js'
    }
    */
  ];
  
  const results = [];
  
  // Run each test sequentially
  for (const test of tests) {
    console.log(`\n\n---------------------------------------------`);
    console.log(`RUNNING TEST: ${test.name}`);
    console.log(`---------------------------------------------`);
    
    try {
      // Set environment variable for cookie file for authenticated requests
      const testEnv = { ...process.env, COOKIE_FILE: 'cookie.txt' };
      
      // Run test and capture output
      const { stdout, stderr } = await execAsync(`node --experimental-modules ${test.file}`, { env: testEnv });
      
      if (stdout) {
        console.log(stdout);
      }
      
      if (stderr) {
        console.error('STDERR:', stderr);
      }
      
      // Determine if test passed
      const passed = !stderr && stdout.includes('✅');
      results.push({
        name: test.name,
        passed,
        file: test.file
      });
      
    } catch (error) {
      console.error(`Error running ${test.name}:`, error.message);
      results.push({
        name: test.name,
        passed: false,
        file: test.file,
        error: error.message
      });
    }
  }
  
  // Print summary of results
  console.log('\n\n==========================================================');
  console.log('END-TO-END TESTING RESULTS SUMMARY');
  console.log('==========================================================');
  
  for (const result of results) {
    console.log(`${result.passed ? '✅ PASSED' : '❌ FAILED'}: ${result.name} (${result.file})`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  const passedCount = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = Math.round((passedCount / totalTests) * 100);
  
  console.log('\n---------------------------------------------------------');
  console.log(`OVERALL RESULT: ${passedCount}/${totalTests} tests passed (${passRate}%)`);
  console.log('---------------------------------------------------------');
}

// Run all tests
runE2ETests();