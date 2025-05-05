/**
 * BentonGeoPro DevOps System
 * 
 * This module provides a central entry point for all DevOps functionality,
 * including monitoring, feature flags, deployment management, error tracking,
 * UX metrics, and CI/CD integration.
 */

import { Express } from 'express';
import { logger } from '../logger';

// Import DevOps modules
import { 
  initializeMonitoring, 
  requestMetricsMiddleware,
  updateWebSocketMetrics 
} from './monitoring';
import { 
  initializeFeatureFlags,
  registerFeatureFlagRoutes,
  getFeatureFlag
} from './feature-flags';
import { 
  initializeDeploymentManagement
} from './deployment';
import { 
  initializeErrorTracking,
  errorTrackingMiddleware,
  richErrorHandler,
  trackError
} from './error-tracking';
import {
  initializeUxMetrics,
  trackUxEvent,
  UxEventType,
  InteractionType,
  PerformanceMetricType
} from './ux-metrics';
import {
  initializeCiCd
} from './ci-cd';

// Export key utilities for use elsewhere in the application
export { 
  getFeatureFlag,
  trackError,
  updateWebSocketMetrics,
  trackUxEvent,
  UxEventType,
  InteractionType,
  PerformanceMetricType
};

/**
 * Initialize the complete DevOps system
 * 
 * @param app Express application instance
 */
export async function initializeDevOps(app: Express): Promise<() => void> {
  logger.info('Initializing BentonGeoPro DevOps system...');
  
  try {
    // 1. Initialize monitoring first to start capturing metrics right away
    const stopMonitoring = initializeMonitoring(app);
    
    // 2. Initialize feature flags
    await initializeFeatureFlags();
    registerFeatureFlagRoutes(app);
    
    // 3. Initialize deployment management
    await initializeDeploymentManagement(app);
    
    // 4. Initialize error tracking
    initializeErrorTracking(app);
    
    // 5. Initialize UX metrics collection
    initializeUxMetrics(app);
    
    // 6. Initialize CI/CD integration
    initializeCiCd(app);
    
    // Register error tracking middleware
    app.use(errorTrackingMiddleware);
    
    // Register the rich error handler as the final error handler
    app.use(richErrorHandler);
    
    logger.info('DevOps system initialized successfully');
    
    // Return cleanup function
    return () => {
      stopMonitoring();
      logger.info('DevOps system stopped');
    };
  } catch (error) {
    logger.error('Failed to initialize DevOps system', error);
    
    // Return no-op cleanup function
    return () => {};
  }
}