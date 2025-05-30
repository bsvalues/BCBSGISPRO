/**
 * BentonGeoPro Deployment Management
 * 
 * This module provides deployment utilities, version tracking,
 * and infrastructure management capabilities for the application.
 */

import { Express } from 'express';
import { logger } from '../logger';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Deployment info
interface DeploymentInfo {
  version: string;
  environment: string;
  buildNumber: string;
  commitHash: string;
  buildDate: string;
  deployDate: string;
  hostname: string;
  platform: string;
  nodeVersion: string;
}

// Default values used when actual values are not available
const DEFAULT_VERSION = '1.0.0';
const DEFAULT_ENVIRONMENT = 'development';
const DEFAULT_BUILD_NUMBER = 'local';

let deploymentInfo: DeploymentInfo = {
  version: DEFAULT_VERSION,
  environment: DEFAULT_ENVIRONMENT,
  buildNumber: DEFAULT_BUILD_NUMBER,
  commitHash: 'unknown',
  buildDate: new Date().toISOString(),
  deployDate: new Date().toISOString(),
  hostname: os.hostname(),
  platform: process.platform,
  nodeVersion: process.version,
};

/**
 * Read deployment information from the file system
 */
async function readDeploymentInfo(): Promise<void> {
  try {
    // Try to read from deployment.json if it exists (created by CI/CD)
    const deploymentFilePath = path.join(process.cwd(), 'deployment.json');
    
    if (fs.existsSync(deploymentFilePath)) {
      const fileContent = await fs.promises.readFile(deploymentFilePath, 'utf-8');
      const deploymentData = JSON.parse(fileContent);
      
      deploymentInfo = {
        ...deploymentInfo,
        ...deploymentData,
      };
      
      logger.info('Loaded deployment information from deployment.json');
      return;
    }
    
    // If no deployment file, try to get git information
    try {
      const { stdout: commitHash } = await execAsync('git rev-parse HEAD');
      deploymentInfo.commitHash = commitHash.trim();
      
      const { stdout: dateStr } = await execAsync('git show -s --format=%ci HEAD');
      deploymentInfo.buildDate = new Date(dateStr.trim()).toISOString();
      
      logger.info('Loaded deployment information from git');
    } catch (gitError) {
      logger.warn('Could not retrieve git information', gitError);
    }
    
    // Try to read version from package.json
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.version) {
          deploymentInfo.version = packageJson.version;
        }
      }
    } catch (packageError) {
      logger.warn('Could not read version from package.json', packageError);
    }
    
    // Try to get environment from NODE_ENV
    if (process.env.NODE_ENV) {
      deploymentInfo.environment = process.env.NODE_ENV;
    }
    
    // Try to get build number from CI environment variables
    if (process.env.BUILD_NUMBER) {
      deploymentInfo.buildNumber = process.env.BUILD_NUMBER;
    } else if (process.env.CI_PIPELINE_ID) {
      deploymentInfo.buildNumber = process.env.CI_PIPELINE_ID;
    }
    
    logger.info('Initialized deployment information from environment');
  } catch (error) {
    logger.error('Failed to read deployment information', error);
    // Keep using default values
  }
}

/**
 * Get current deployment information
 */
export function getDeploymentInfo(): DeploymentInfo {
  return { ...deploymentInfo };
}

/**
 * Check if a newer version of the app is available
 * This would typically call an external version check API
 */
export async function checkForUpdates(): Promise<{ available: boolean; version?: string; }> {
  try {
    // In a real implementation, this would make an external API call
    // to check if a newer version is available
    
    // Simulate no update available for now
    return { available: false };
  } catch (error) {
    logger.error('Failed to check for updates', error);
    return { available: false };
  }
}

/**
 * Get infrastructure information (e.g., server, database version, etc.)
 */
export async function getInfrastructureInfo(): Promise<Record<string, any>> {
  const info: Record<string, any> = {
    os: {
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadAvg: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
      },
    },
    node: {
      version: process.version,
      versions: process.versions,
    },
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  };
  
  // Add PostgreSQL version if available
  try {
    // This would be implemented in a real system
    info.database = {
      type: 'PostgreSQL',
      version: 'Unknown', // Would be populated from a query
      connection: 'Active',
    };
  } catch (error) {
    info.database = {
      type: 'PostgreSQL',
      connection: 'Inactive',
      error: 'Could not determine database version',
    };
  }
  
  return info;
}

/**
 * Register deployment management routes
 */
export function registerDeploymentRoutes(app: Express): void {
  // Version endpoint
  app.get('/api/version', (req, res) => {
    res.json({
      version: deploymentInfo.version,
      environment: deploymentInfo.environment,
      buildNumber: deploymentInfo.buildNumber,
      buildDate: deploymentInfo.buildDate,
    });
  });
  
  // Detailed deployment information (admin only)
  app.get('/api/deployment/info', (req, res) => {
    // In a production environment, we would properly authenticate admin access
    // For now, we'll use a simple API key check
    if (req.query.apiKey !== 'devops-admin-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json(deploymentInfo);
  });
  
  // Infrastructure information (admin only)
  app.get('/api/deployment/infrastructure', async (req, res) => {
    // Authenticate
    if (req.query.apiKey !== 'devops-admin-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      const infraInfo = await getInfrastructureInfo();
      res.json(infraInfo);
    } catch (error) {
      logger.error('Error getting infrastructure info', error);
      res.status(500).json({ error: 'Failed to get infrastructure information' });
    }
  });
  
  // Check for updates
  app.get('/api/deployment/check-updates', async (req, res) => {
    try {
      const updateInfo = await checkForUpdates();
      res.json(updateInfo);
    } catch (error) {
      logger.error('Error checking for updates', error);
      res.status(500).json({ error: 'Failed to check for updates' });
    }
  });
  
  // Environment check
  app.get('/api/deployment/environment', (req, res) => {
    res.json({
      environment: deploymentInfo.environment,
      isProduction: deploymentInfo.environment === 'production',
      isDevelopment: deploymentInfo.environment === 'development',
      isTest: deploymentInfo.environment === 'test',
    });
  });
}

/**
 * Initialize the deployment management system
 */
export async function initializeDeploymentManagement(app: Express): Promise<void> {
  // Read deployment information
  await readDeploymentInfo();
  
  // Register routes
  registerDeploymentRoutes(app);
  
  logger.info('Deployment management initialized');
}