/**
 * Role-based Dashboards Management
 * 
 * This module provides dashboard configuration and data retrieval
 * for different user roles within the BentonGeoPro system.
 */

import { Request, Response } from 'express';
import { getDatabaseStatus } from '../../db-resilience';
import { getMetricsSnapshot } from '../monitoring';
import { getFeatureFlag, refreshFeatureFlagCache } from '../feature-flags';
import { db } from '../../db';
import { featureFlags } from '../../../shared/schema';
import { getErrors } from '../error-tracking';
import { getUxMetricsSummary, getUserJourneyAnalytics } from '../ux-metrics';
import { getDeploymentInfo } from '../deployment';
import { getCiCdDashboardData } from '../ci-cd';
// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

function isAdmin(req) {
  return req.isAuthenticated() && req.user && req.user.role === 'admin';
}

/**
 * Helper function to get all feature flags from the database
 */
async function getAllFeatureFlags() {
  try {
    const flags = await db.select().from(featureFlags);
    return flags;
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return [];
  }
}

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
        errors: await getErrors({ limit: 10, resolved: false }),
        performanceMetrics: (await getMetricsSnapshot()).responseTimes,
        cicdStatus: await getCiCdDashboardData(),
      };

    case DashboardType.UX_DESIGNER:
      const uxSummary = await getUxMetricsSummary();
      const journeyAnalytics = await getUserJourneyAnalytics();
      return {
        ...baseData,
        userJourneys: journeyAnalytics,
        interactionHeatmap: uxSummary.topFeatures,
        userFeedback: uxSummary.overview,
        performanceMetrics: uxSummary.performanceMetrics,
      };

    case DashboardType.QA:
      return {
        ...baseData,
        errors: await getErrors({ limit: 20, tags: ['component'] }),
        testCoverage: (await getCiCdDashboardData()).testMetrics,
        featureFlags: await getFeatureFlags(),
        systemHealth: {
          database: getDatabaseStatus(),
          apiEndpoints: (await getMetricsSnapshot()).requests.byEndpoint,
        },
      };

    case DashboardType.PRODUCT_MANAGER:
      const pmUxSummary = await getUxMetricsSummary();
      return {
        ...baseData,
        featureUsage: pmUxSummary.topFeatures,
        userSatisfaction: {
          average: pmUxSummary.overview.averageSatisfaction || 0,
          total: pmUxSummary.overview.totalEvents
        },
        deployments: (await getCiCdDashboardData()).recentDeployments,
        activeUsers: {
          count: pmUxSummary.overview.uniqueSessions,
          pageViews: pmUxSummary.overview.totalPageViews
        },
      };

    case DashboardType.SYSTEM_ADMIN:
      return {
        ...baseData,
        systemHealth: {
          database: getDatabaseStatus(),
          apiEndpoints: (await getMetricsSnapshot()).requests.byEndpoint,
          resources: (await getMetricsSnapshot()).system,
        },
        errors: await getErrors({ limit: 10, tags: ['system-error'] }),
        deployments: (await getCiCdDashboardData()).recentDeployments,
      };
      
    case DashboardType.ADMIN:
      const adminUxSummary = await getUxMetricsSummary();
      return {
        ...baseData,
        systemHealth: {
          database: getDatabaseStatus(),
          apiEndpoints: (await getMetricsSnapshot()).requests.byEndpoint,
          resources: (await getMetricsSnapshot()).system,
        },
        errors: await getErrors(),
        users: {
          count: adminUxSummary.overview.uniqueSessions,
          activity: adminUxSummary.topPages
        },
        deployments: (await getCiCdDashboardData()).recentDeployments,
        featureFlags: await getAllFeatureFlags(),
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