/**
 * BentonGeoPro CI/CD Integration
 * 
 * This module provides integration with the CI/CD pipeline, tracking
 * deployments, and automating infrastructure management tasks.
 */

import { Express } from 'express';
import { logger } from '../logger';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import { getDeploymentInfo } from './deployment';

// CI/CD statuses
export enum CiCdStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  CANCELLED = 'cancelled'
}

// Test statuses
export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  PENDING = 'pending'
}

// In-memory storage for CI/CD information
const ciCdInfo = {
  // Information about the latest build/deployment
  latestBuild: {
    buildId: '',
    commitHash: '',
    branch: '',
    status: CiCdStatus.SUCCESS,
    startTime: 0,
    endTime: 0,
    duration: 0,
    triggeredBy: '',
    buildNumber: '',
  },
  
  // Test results from the latest build
  testResults: {
    coverage: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    suites: [] as TestSuite[]
  },
  
  // Deployment history
  deploymentHistory: [] as DeploymentRecord[],
  
  // Infrastructure validation status
  infrastructureStatus: {
    lastCheck: 0,
    valid: true,
    errors: [] as string[]
  }
};

// Maximum number of deployment records to keep
const MAX_DEPLOYMENT_HISTORY = 20;

// Test suite interface
interface TestSuite {
  name: string;
  tests: {
    name: string;
    status: TestStatus;
    duration: number;
    errorMessage?: string;
  }[];
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}

// Deployment record interface
interface DeploymentRecord {
  id: string;
  environment: string;
  version: string;
  commitHash: string;
  buildNumber: string;
  status: CiCdStatus;
  startTime: number;
  endTime: number;
  duration: number;
  triggeredBy: string;
  changes: {
    description: string;
    type: string;
    files: number;
  }[];
}

/**
 * Generate a unique ID for deployments
 */
function generateDeploymentId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 5).toUpperCase();
}

/**
 * Update the build information
 */
export function updateBuildInfo(buildInfo: {
  buildId: string;
  commitHash: string;
  branch: string;
  status: CiCdStatus;
  startTime: number;
  endTime?: number;
  triggeredBy: string;
  buildNumber: string;
}): void {
  ciCdInfo.latestBuild = {
    ...ciCdInfo.latestBuild,
    ...buildInfo,
    endTime: buildInfo.endTime || 0,
    duration: buildInfo.endTime 
      ? buildInfo.endTime - buildInfo.startTime 
      : 0
  };
  
  logger.info(`Updated build info: ${buildInfo.buildId} (${buildInfo.status})`);
}

/**
 * Update test results
 */
export function updateTestResults(results: {
  coverage: number;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  suites: TestSuite[];
}): void {
  ciCdInfo.testResults = results;
  logger.info(`Updated test results: ${results.passed}/${results.total} tests passed`);
}

/**
 * Record a new deployment
 */
export function recordDeployment(deployment: Omit<DeploymentRecord, 'id'>): string {
  const id = generateDeploymentId();
  
  const newDeployment: DeploymentRecord = {
    id,
    ...deployment
  };
  
  // Add to the beginning of the array
  ciCdInfo.deploymentHistory.unshift(newDeployment);
  
  // Trim the history if it's getting too large
  if (ciCdInfo.deploymentHistory.length > MAX_DEPLOYMENT_HISTORY) {
    ciCdInfo.deploymentHistory.pop();
  }
  
  logger.info(`Recorded deployment: ${id} to ${deployment.environment}`);
  
  return id;
}

/**
 * Check the infrastructure validation status
 */
export function checkInfrastructureValidation(): boolean {
  ciCdInfo.infrastructureStatus.lastCheck = Date.now();
  
  try {
    // In a real implementation, this would perform actual checks
    // For now, we'll just simulate a successful validation
    ciCdInfo.infrastructureStatus.valid = true;
    ciCdInfo.infrastructureStatus.errors = [];
    
    return true;
  } catch (error) {
    if (error instanceof Error) {
      ciCdInfo.infrastructureStatus.valid = false;
      ciCdInfo.infrastructureStatus.errors = [error.message];
      logger.error('Infrastructure validation failed', error);
    }
    return false;
  }
}

/**
 * Get deployment history with filtering
 */
export function getDeploymentHistory(options: {
  environment?: string;
  status?: CiCdStatus;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
} = {}): {
  deployments: DeploymentRecord[];
  total: number;
} {
  let filteredDeployments = [...ciCdInfo.deploymentHistory];
  
  // Apply filters
  if (options.environment) {
    filteredDeployments = filteredDeployments.filter(d => d.environment === options.environment);
  }
  
  if (options.status) {
    filteredDeployments = filteredDeployments.filter(d => d.status === options.status);
  }
  
  if (options.startTime) {
    filteredDeployments = filteredDeployments.filter(d => d.startTime >= options.startTime!);
  }
  
  if (options.endTime) {
    filteredDeployments = filteredDeployments.filter(d => d.endTime <= options.endTime!);
  }
  
  const total = filteredDeployments.length;
  
  // Apply pagination
  if (options.offset !== undefined && options.limit !== undefined) {
    filteredDeployments = filteredDeployments.slice(
      options.offset,
      options.offset + options.limit
    );
  } else if (options.limit !== undefined) {
    filteredDeployments = filteredDeployments.slice(0, options.limit);
  }
  
  return {
    deployments: filteredDeployments,
    total
  };
}

/**
 * Get CI/CD dashboard data
 */
export function getCiCdDashboardData() {
  // Calculate deployment success rate
  const deployments = ciCdInfo.deploymentHistory;
  const successfulDeployments = deployments.filter(d => d.status === CiCdStatus.SUCCESS).length;
  const deploymentSuccessRate = deployments.length > 0
    ? (successfulDeployments / deployments.length) * 100
    : 100;
    
  // Calculate average deployment duration
  const successfulDeploymentDurations = deployments
    .filter(d => d.status === CiCdStatus.SUCCESS)
    .map(d => d.duration);
    
  const averageDeploymentDuration = successfulDeploymentDurations.length > 0
    ? successfulDeploymentDurations.reduce((sum, duration) => sum + duration, 0) / successfulDeploymentDurations.length
    : 0;
    
  // Calculate test pass rate
  const testResults = ciCdInfo.testResults;
  const testPassRate = testResults.total > 0
    ? (testResults.passed / testResults.total) * 100
    : 100;
    
  // Get recent deployments
  const recentDeployments = deployments.slice(0, 5);
  
  return {
    timestamp: new Date().toISOString(),
    latestBuild: ciCdInfo.latestBuild,
    deploymentMetrics: {
      total: deployments.length,
      successful: successfulDeployments,
      successRate: deploymentSuccessRate,
      averageDuration: averageDeploymentDuration,
      averageDurationSeconds: Math.round(averageDeploymentDuration / 1000)
    },
    testMetrics: {
      coverage: testResults.coverage,
      passRate: testPassRate,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      total: testResults.total
    },
    infrastructureStatus: ciCdInfo.infrastructureStatus,
    recentDeployments
  };
}

/**
 * Register CI/CD API endpoints
 */
export function registerCiCdEndpoints(app: Express): void {
  // Get CI/CD dashboard data (admin only)
  app.get('/api/ci-cd/dashboard', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const dashboardData = getCiCdDashboardData();
      res.json(dashboardData);
    } catch (error) {
      logger.error('Error generating CI/CD dashboard data', error);
      res.status(500).json({ error: 'Failed to generate dashboard data' });
    }
  });
  
  // Get deployment history with filtering (admin only)
  app.get('/api/ci-cd/deployments', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Parse filtering options
      const options = {
        environment: req.query.environment as string | undefined,
        status: req.query.status as CiCdStatus | undefined,
        startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const result = getDeploymentHistory(options);
      res.json(result);
    } catch (error) {
      logger.error('Error fetching deployment history', error);
      res.status(500).json({ error: 'Failed to fetch deployment history' });
    }
  });
  
  // Get test results (admin only)
  app.get('/api/ci-cd/tests', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      res.json(ciCdInfo.testResults);
    } catch (error) {
      logger.error('Error fetching test results', error);
      res.status(500).json({ error: 'Failed to fetch test results' });
    }
  });
  
  // Get latest build info (admin only)
  app.get('/api/ci-cd/build', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      res.json(ciCdInfo.latestBuild);
    } catch (error) {
      logger.error('Error fetching build info', error);
      res.status(500).json({ error: 'Failed to fetch build info' });
    }
  });
  
  // Check infrastructure validation (admin only)
  app.post('/api/ci-cd/validate-infrastructure', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const isValid = checkInfrastructureValidation();
      res.json({
        valid: isValid,
        errors: ciCdInfo.infrastructureStatus.errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error validating infrastructure', error);
      res.status(500).json({ error: 'Failed to validate infrastructure' });
    }
  });
}

/**
 * Initialize the CI/CD integration
 */
export function initializeCiCd(app: Express): void {
  // Initialize with current deployment info
  const deploymentInfo = getDeploymentInfo();
  
  // Update build info with current deployment
  updateBuildInfo({
    buildId: deploymentInfo.buildNumber,
    commitHash: deploymentInfo.commitHash,
    branch: 'main', // Default to main branch
    status: CiCdStatus.SUCCESS,
    startTime: new Date(deploymentInfo.buildDate).getTime(),
    endTime: new Date(deploymentInfo.deployDate).getTime(),
    triggeredBy: 'system',
    buildNumber: deploymentInfo.buildNumber
  });
  
  // Record current deployment
  recordDeployment({
    environment: deploymentInfo.environment,
    version: deploymentInfo.version,
    commitHash: deploymentInfo.commitHash,
    buildNumber: deploymentInfo.buildNumber,
    status: CiCdStatus.SUCCESS,
    startTime: new Date(deploymentInfo.buildDate).getTime(),
    endTime: new Date(deploymentInfo.deployDate).getTime(),
    duration: new Date(deploymentInfo.deployDate).getTime() - new Date(deploymentInfo.buildDate).getTime(),
    triggeredBy: 'system',
    changes: [{
      description: 'Initial deployment',
      type: 'feature',
      files: 0
    }]
  });
  
  // Initialize with default test results
  updateTestResults({
    coverage: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    suites: []
  });
  
  // Register API endpoints
  registerCiCdEndpoints(app);
  
  logger.info('CI/CD integration initialized');
}