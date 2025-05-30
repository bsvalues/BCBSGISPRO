/**
 * Synthetic Testing Framework
 * 
 * This module provides tools for automated testing of critical
 * user journeys and application functionality.
 */

import { Request, Response } from 'express';
import { logger } from '../../logger';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import * as puppeteer from 'puppeteer';
import { getDeploymentInfo } from '../deployment';

// Configured synthetic tests
const syntheticTests: SyntheticTest[] = [];

// Status tracking
const testResults: Record<string, TestRun> = {};

/**
 * Represents a synthetic test configuration
 */
export interface SyntheticTest {
  id: string;
  name: string;
  description: string;
  type: TestType;
  script: string | (() => Promise<TestResult>);
  frequency: number; // milliseconds
  timeout: number; // milliseconds
  lastRun?: Date;
  enabled: boolean;
  environments: string[]; // which environments to run in (dev, staging, prod)
  tags: string[];
}

/**
 * Types of synthetic tests
 */
export enum TestType {
  API = 'api',
  UI = 'ui',
  JOURNEY = 'journey',
  INTEGRATION = 'integration',
}

/**
 * Result of a test run
 */
export interface TestResult {
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
  screenshot?: string; // Base64 encoded for UI tests
}

/**
 * Complete test run data
 */
export interface TestRun extends TestResult {
  testId: string;
  timestamp: Date;
  environment: string;
  version: string;
}

/**
 * Register a new synthetic test
 */
export function registerTest(test: SyntheticTest) {
  // Check if test with this ID already exists
  const existingIndex = syntheticTests.findIndex(t => t.id === test.id);
  if (existingIndex >= 0) {
    syntheticTests[existingIndex] = test;
  } else {
    syntheticTests.push(test);
  }
  
  logger.info(`Registered synthetic test: ${test.name} (${test.id})`);
  return test;
}

/**
 * Initialize standard tests for the application
 */
export function initializeStandardTests() {
  // API Health Check
  registerTest({
    id: 'api-health',
    name: 'API Health Check',
    description: 'Verifies that the API health endpoint is responding properly',
    type: TestType.API,
    script: async () => {
      const start = Date.now();
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        return {
          success: response.ok && data.status === 'ok',
          duration: Date.now() - start,
          details: data
        };
      } catch (error) {
        return {
          success: false,
          duration: Date.now() - start,
          error: error.toString()
        };
      }
    },
    frequency: 5 * 60 * 1000, // 5 minutes
    timeout: 10 * 1000, // 10 seconds
    enabled: true,
    environments: ['dev', 'staging', 'prod'],
    tags: ['critical', 'api']
  });
  
  // Login Journey
  registerTest({
    id: 'login-journey',
    name: 'User Login Journey',
    description: 'Tests that users can successfully log in to the application',
    type: TestType.JOURNEY,
    script: async () => {
      const start = Date.now();
      let browser;
      
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto('/login');
        
        // Fill login form
        await page.type('input[name="username"]', 'test_user');
        await page.type('input[name="password"]', 'test_password');
        
        // Submit form
        await Promise.all([
          page.click('button[type="submit"]'),
          page.waitForNavigation()
        ]);
        
        // Check if login was successful
        const loggedIn = await page.evaluate(() => {
          return document.body.textContent.includes('Welcome') || 
                 document.body.textContent.includes('Dashboard');
        });
        
        const screenshot = await page.screenshot({ encoding: 'base64' });
        
        return {
          success: loggedIn,
          duration: Date.now() - start,
          details: {
            url: page.url(),
            title: await page.title()
          },
          screenshot: `data:image/png;base64,${screenshot}`
        };
      } catch (error) {
        return {
          success: false,
          duration: Date.now() - start,
          error: error.toString()
        };
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    },
    frequency: 15 * 60 * 1000, // 15 minutes
    timeout: 30 * 1000, // 30 seconds
    enabled: true,
    environments: ['staging', 'prod'],
    tags: ['critical', 'user-journey']
  });
  
  // Map Viewer Journey
  registerTest({
    id: 'map-journey',
    name: 'Map Viewer Journey',
    description: 'Tests that the map viewer loads and responds to interactions',
    type: TestType.JOURNEY,
    script: async () => {
      const start = Date.now();
      let browser;
      
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto('/map');
        
        // Wait for map to load
        await page.waitForSelector('.mapboxgl-canvas', { timeout: 20000 });
        
        // Test zoom controls
        await page.click('.mapboxgl-ctrl-zoom-in');
        await page.waitForTimeout(1000); // Wait for zoom animation
        
        // Check if layers control exists
        const layersControlExists = await page.evaluate(() => {
          return document.querySelector('.layer-control') !== null;
        });
        
        const screenshot = await page.screenshot({ encoding: 'base64' });
        
        return {
          success: layersControlExists,
          duration: Date.now() - start,
          details: {
            url: page.url(),
            title: await page.title(),
            layersControlExists
          },
          screenshot: `data:image/png;base64,${screenshot}`
        };
      } catch (error) {
        return {
          success: false,
          duration: Date.now() - start,
          error: error.toString()
        };
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    },
    frequency: 30 * 60 * 1000, // 30 minutes
    timeout: 60 * 1000, // 60 seconds
    enabled: true,
    environments: ['staging', 'prod'],
    tags: ['map', 'critical-feature']
  });
  
  // Document Classification Journey
  registerTest({
    id: 'document-classification',
    name: 'Document Classification Journey',
    description: 'Tests the document classification functionality',
    type: TestType.JOURNEY,
    script: async () => {
      const start = Date.now();
      let browser;
      
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto('/documents');
        
        // Navigate to upload page
        await Promise.all([
          page.click('a[href*="upload"]'),
          page.waitForNavigation()
        ]);
        
        // Check if upload form exists
        const uploadFormExists = await page.evaluate(() => {
          return document.querySelector('input[type="file"]') !== null;
        });
        
        const screenshot = await page.screenshot({ encoding: 'base64' });
        
        return {
          success: uploadFormExists,
          duration: Date.now() - start,
          details: {
            url: page.url(),
            title: await page.title(),
            uploadFormExists
          },
          screenshot: `data:image/png;base64,${screenshot}`
        };
      } catch (error) {
        return {
          success: false,
          duration: Date.now() - start,
          error: error.toString()
        };
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    },
    frequency: 60 * 60 * 1000, // 60 minutes
    timeout: 45 * 1000, // 45 seconds
    enabled: true,
    environments: ['staging', 'prod'],
    tags: ['document', 'workflow']
  });
}

/**
 * Run a specific test and record results
 */
export async function runTest(testId: string): Promise<TestRun> {
  const test = syntheticTests.find(t => t.id === testId);
  if (!test) {
    throw new Error(`Test with id ${testId} not found`);
  }
  
  logger.info(`Running synthetic test: ${test.name} (${test.id})`);
  const deploymentInfo = await getDeploymentInfo();
  
  try {
    // Run test with timeout
    const timeoutPromise = new Promise<TestResult>((_, reject) => {
      setTimeout(() => reject(new Error(`Test timed out after ${test.timeout}ms`)), test.timeout);
    });
    
    const scriptPromise = typeof test.script === 'function'
      ? test.script()
      : evaluateTestScript(test.script);
    
    const result = await Promise.race([scriptPromise, timeoutPromise]);
    
    // Record test run
    const testRun: TestRun = {
      ...result,
      testId: test.id,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      version: deploymentInfo.version
    };
    
    // Update in-memory results
    testResults[test.id] = testRun;
    
    // Store in database
    await db.execute(sql`
      INSERT INTO synthetic_test_runs (
        test_id, timestamp, success, duration, error, details, screenshot, 
        environment, version
      ) VALUES (
        ${test.id}, ${testRun.timestamp}, ${testRun.success}, ${testRun.duration},
        ${testRun.error || null}, ${testRun.details ? JSON.stringify(testRun.details) : null},
        ${testRun.screenshot || null}, ${testRun.environment}, ${testRun.version}
      )
    `);
    
    // Update test last run time
    test.lastRun = testRun.timestamp;
    
    return testRun;
  } catch (error) {
    const failedRun: TestRun = {
      success: false,
      duration: 0,
      error: error.toString(),
      testId: test.id,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      version: deploymentInfo.version
    };
    
    // Update in-memory results
    testResults[test.id] = failedRun;
    
    // Store in database
    await db.execute(sql`
      INSERT INTO synthetic_test_runs (
        test_id, timestamp, success, duration, error, 
        environment, version
      ) VALUES (
        ${test.id}, ${failedRun.timestamp}, false, 0, ${error.toString()},
        ${failedRun.environment}, ${failedRun.version}
      )
    `);
    
    return failedRun;
  }
}

/**
 * Execute a test script provided as a string
 */
async function evaluateTestScript(script: string): Promise<TestResult> {
  try {
    // Create a function from the script string and execute it
    const testFunction = new Function('fetch', 'puppeteer', 'logger', `
      return (async () => {
        const start = Date.now();
        try {
          ${script}
        } catch (error) {
          return {
            success: false,
            duration: Date.now() - start,
            error: error.toString()
          };
        }
      })();
    `);
    
    return await testFunction(fetch, puppeteer, logger);
  } catch (error) {
    return {
      success: false,
      duration: 0,
      error: `Script evaluation error: ${error.toString()}`
    };
  }
}

/**
 * Get test results with filtering options
 */
export async function getTestResults(options: {
  testId?: string,
  onlyFailed?: boolean,
  limit?: number,
  from?: Date,
  to?: Date
} = {}) {
  const {
    testId,
    onlyFailed = false,
    limit = 100,
    from,
    to = new Date()
  } = options;
  
  let query = sql`
    SELECT * FROM synthetic_test_runs
    WHERE 1=1
  `;
  
  if (testId) {
    query = sql`${query} AND test_id = ${testId}`;
  }
  
  if (onlyFailed) {
    query = sql`${query} AND success = false`;
  }
  
  if (from) {
    query = sql`${query} AND timestamp >= ${from}`;
  }
  
  query = sql`${query} AND timestamp <= ${to}`;
  query = sql`${query} ORDER BY timestamp DESC LIMIT ${limit}`;
  
  const results = await db.execute(query);
  return results.rows;
}

/**
 * Start scheduled test execution
 */
export function startScheduledTests() {
  // For each test, schedule based on frequency
  syntheticTests.forEach(test => {
    if (!test.enabled) return;
    
    // Check if environment matches
    const currentEnv = process.env.NODE_ENV || 'development';
    if (!test.environments.includes(currentEnv)) return;
    
    // Schedule test
    const intervalId = setInterval(async () => {
      try {
        await runTest(test.id);
      } catch (error) {
        logger.error(`Error running scheduled test ${test.id}:`, error);
      }
    }, test.frequency);
    
    // Store interval ID for cleanup
    (test as any).intervalId = intervalId;
  });
  
  logger.info(`Started scheduled synthetic tests (${syntheticTests.filter(t => t.enabled).length} active)`);
}

/**
 * Stop scheduled test execution
 */
export function stopScheduledTests() {
  syntheticTests.forEach(test => {
    if ((test as any).intervalId) {
      clearInterval((test as any).intervalId);
      delete (test as any).intervalId;
    }
  });
  
  logger.info('Stopped all scheduled synthetic tests');
}

/**
 * Register testing routes
 * 
 * @param app Express application
 */
export function registerTestingRoutes(app: any) {
  // Get all registered tests
  app.get('/api/testing/tests', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      return res.json({
        tests: syntheticTests.map(test => ({
          id: test.id,
          name: test.name,
          description: test.description,
          type: test.type,
          frequency: test.frequency,
          timeout: test.timeout,
          lastRun: test.lastRun,
          enabled: test.enabled,
          environments: test.environments,
          tags: test.tags
        }))
      });
    } catch (error) {
      console.error('Error retrieving synthetic tests:', error);
      return res.status(500).json({ error: 'Failed to retrieve synthetic tests' });
    }
  });
  
  // Run a specific test
  app.post('/api/testing/tests/:id/run', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const testId = req.params.id;
      const result = await runTest(testId);
      
      return res.json({ result });
    } catch (error) {
      console.error('Error running synthetic test:', error);
      return res.status(500).json({ error: 'Failed to run synthetic test' });
    }
  });
  
  // Get test results
  app.get('/api/testing/results', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const results = await getTestResults({
        testId: req.query.testId as string,
        onlyFailed: req.query.onlyFailed === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        from: req.query.from ? new Date(req.query.from as string) : undefined
      });
      
      return res.json({ results });
    } catch (error) {
      console.error('Error retrieving test results:', error);
      return res.status(500).json({ error: 'Failed to retrieve test results' });
    }
  });
  
  // Get test dashboard data
  app.get('/api/testing/dashboard', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Get success rate by test
      const successRates = await db.execute(sql`
        SELECT 
          test_id,
          COUNT(*) as total_runs,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_runs,
          AVG(duration) as avg_duration
        FROM synthetic_test_runs
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY test_id
      `);
      
      // Get recent failures
      const recentFailures = await getTestResults({
        onlyFailed: true,
        limit: 10
      });
      
      // Get success rate over time
      const successOverTime = await db.execute(sql`
        SELECT 
          date_trunc('hour', timestamp) as hour,
          COUNT(*) as total_runs,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_runs
        FROM synthetic_test_runs
        WHERE timestamp > NOW() - INTERVAL '7 days'
        GROUP BY hour
        ORDER BY hour ASC
      `);
      
      return res.json({
        successRates: successRates.rows,
        recentFailures,
        successOverTime: successOverTime.rows
      });
    } catch (error) {
      console.error('Error retrieving testing dashboard:', error);
      return res.status(500).json({ error: 'Failed to retrieve testing dashboard' });
    }
  });
  
  // Update test configuration
  app.patch('/api/testing/tests/:id', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const testId = req.params.id;
      const test = syntheticTests.find(t => t.id === testId);
      
      if (!test) {
        return res.status(404).json({ error: 'Test not found' });
      }
      
      // Update allowed properties
      const allowedProps = ['name', 'description', 'frequency', 'timeout', 'enabled', 'environments', 'tags'];
      allowedProps.forEach(prop => {
        if (req.body[prop] !== undefined) {
          test[prop] = req.body[prop];
        }
      });
      
      return res.json({ test });
    } catch (error) {
      console.error('Error updating synthetic test:', error);
      return res.status(500).json({ error: 'Failed to update synthetic test' });
    }
  });
}