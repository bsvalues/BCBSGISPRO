/**
 * Role-based Dashboards Management
 * 
 * This module provides dashboard configuration and data retrieval
 * for different user roles within the BentonGeoPro system.
 */

import { Request, Response } from 'express';
import { getDatabaseStatus } from '../../db-resilience';
import { getMetrics } from '../monitoring';
import { getFeatureFlags } from '../feature-flags';
import { getErrorStats } from '../error-tracking';
import { getUxMetricsOverview } from '../ux-metrics';
import { getDeploymentInfo } from '../deployment';
import { getCiCdStats } from '../ci-cd';
import { isAdmin, isAuthenticated } from '../../auth';

// Dashboard types for different user roles
export enum DashboardType {
  DEVELOPER = 'developer',
  UX_DESIGNER = 'ux_designer',
  QA = 'qa',
  PRODUCT_MANAGER = 'product_manager',
  ADMIN = 'admin',
  SYSTEM_ADMIN = 'system_admin',
}

/**
 * Get dashboard data based on user role
 * 
 * @param type Dashboard type
 * @param req Express request
 */
export async function getDashboardData(type: DashboardType, req: Request) {
  // Common elements across dashboards
  const baseData = {
    currentUser: req.user,
    version: (await getDeploymentInfo()).version,
  };

  // Role-specific dashboard data
  switch (type) {
    case DashboardType.DEVELOPER:
      return {
        ...baseData,
        featureFlags: await getFeatureFlags(),
        errors: await getErrorStats({ limit: 10, onlyUnresolved: true }),
        performanceMetrics: (await getMetrics()).performanceMetrics,
        cicdStatus: await getCiCdStats(),
      };

    case DashboardType.UX_DESIGNER:
      return {
        ...baseData,
        userJourneys: await getUxMetricsOverview('journeys'),
        interactionHeatmap: await getUxMetricsOverview('interactions'),
        userFeedback: await getUxMetricsOverview('feedback'),
        performanceByComponent: await getUxMetricsOverview('components'),
      };

    case DashboardType.QA:
      return {
        ...baseData,
        errors: await getErrorStats({ limit: 20, groupByComponent: true }),
        testCoverage: (await getCiCdStats()).testResults,
        featureFlags: await getFeatureFlags(),
        systemHealth: {
          database: getDatabaseStatus(),
          apiEndpoints: (await getMetrics()).endpointStatus,
        },
      };

    case DashboardType.PRODUCT_MANAGER:
      return {
        ...baseData,
        featureUsage: await getUxMetricsOverview('features'),
        userSatisfaction: await getUxMetricsOverview('satisfaction'),
        deployments: (await getCiCdStats()).recentDeployments,
        activeUsers: await getUxMetricsOverview('users'),
      };

    case DashboardType.SYSTEM_ADMIN:
      return {
        ...baseData,
        systemHealth: {
          database: getDatabaseStatus(),
          apiEndpoints: (await getMetrics()).endpointStatus,
          resources: (await getMetrics()).resourceMetrics,
        },
        errors: await getErrorStats({ limit: 10, onlySystemErrors: true }),
        deployments: (await getCiCdStats()).recentDeployments,
      };
      
    case DashboardType.ADMIN:
      return {
        ...baseData,
        systemHealth: {
          database: getDatabaseStatus(),
          apiEndpoints: (await getMetrics()).endpointStatus,
          resources: (await getMetrics()).resourceMetrics,
        },
        errors: await getErrorStats({ full: true }),
        users: await getUxMetricsOverview('users'),
        deployments: (await getCiCdStats()).recentDeployments,
        featureFlags: await getFeatureFlags(),
      };

    default:
      return baseData;
  }
}

/**
 * Register dashboard routes
 * 
 * @param app Express application
 */
export function registerDashboardRoutes(app: any) {
  // Get dashboard data for a specific role
  app.get('/api/dashboards/:type', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const type = req.params.type as DashboardType;
      
      // Restrict access to admin dashboards
      if ((type === DashboardType.ADMIN || type === DashboardType.SYSTEM_ADMIN) && !isAdmin(req)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const data = await getDashboardData(type, req);
      return res.json(data);
    } catch (error) {
      console.error('Error retrieving dashboard data:', error);
      return res.status(500).json({ error: 'Failed to retrieve dashboard data' });
    }
  });
  
  // Get available dashboards for current user
  app.get('/api/dashboards', isAuthenticated, (req: Request, res: Response) => {
    const availableDashboards = Object.values(DashboardType)
      // Filter admin dashboards unless user is admin
      .filter(type => 
        !(type === DashboardType.ADMIN || type === DashboardType.SYSTEM_ADMIN) || 
        isAdmin(req)
      );
    
    res.json({ dashboards: availableDashboards });
  });
}