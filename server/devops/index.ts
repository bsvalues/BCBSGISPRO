/**
 * BentonGeoPro DevOps System
 * 
 * This module provides a central entry point for all DevOps functionality,
 * including monitoring, feature flags, deployment management, error tracking,
 * UX metrics, CI/CD integration, role-based dashboards, security monitoring,
 * external system integration, and synthetic testing.
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
import {
  registerDashboardRoutes,
  DashboardType
} from './dashboards';
import {
  registerSecurityRoutes,
  logSecurityEvent,
  SecurityEventType,
  rateLimit,
  auditLog
} from './security';
import {
  initializeDefaultAlerts,
  registerIntegrationRoutes,
  sendAlert,
  AlertSeverity,
  AlertIntegration
} from './integration';
import {
  initializeStandardTests,
  registerTestingRoutes,
  startScheduledTests,
  stopScheduledTests,
  TestType
} from './testing';

// Export key utilities for use elsewhere in the application
export { 
  getFeatureFlag,
  trackError,
  updateWebSocketMetrics,
  trackUxEvent,
  UxEventType,
  InteractionType,
  PerformanceMetricType,
  DashboardType,
  logSecurityEvent,
  SecurityEventType,
  sendAlert,
  AlertSeverity,
  AlertIntegration,
  TestType
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
    
    // 7. Register role-based dashboards
    registerDashboardRoutes(app);
    
    // 8. Initialize security monitoring and protection
    registerSecurityRoutes(app);
    
    // 9. Initialize external system integrations
    initializeDefaultAlerts();
    registerIntegrationRoutes(app);
    
    // 10. Initialize synthetic testing framework
    initializeStandardTests();
    registerTestingRoutes(app);
    
    // Start scheduled synthetic tests if enabled
    if (process.env.ENABLE_SYNTHETIC_TESTS === 'true') {
      startScheduledTests();
    }
    
    // Register error tracking middleware
    app.use(errorTrackingMiddleware);
    
    // Register the rich error handler as the final error handler
    app.use(richErrorHandler);
    
    logger.info('DevOps system initialized successfully');
    
    // Return cleanup function
    return () => {
      stopMonitoring();
      stopScheduledTests();
      logger.info('DevOps system stopped');
    };
  } catch (error) {
    logger.error('Failed to initialize DevOps system', error);
    
    // Return no-op cleanup function
    return () => {};
  }
}