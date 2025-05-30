/**
 * BentonGeoPro Feature Flag System
 * 
 * This module provides a comprehensive feature flag system for the application,
 * allowing gradual rollout of features, A/B testing, and quick feature disabling
 * without code deployments.
 */

import { Express, Request, Response } from 'express';
import { logger } from '../logger';
import { z } from 'zod';
import { db } from '../db';
import { eq } from 'drizzle-orm';

// Define enum values for feature flags since they no longer exist in schema
export enum FlagTargetType {
  GLOBAL = 'GLOBAL',
  TARGETED = 'TARGETED',
  PERCENTAGE = 'PERCENTAGE'
}

export enum FlagVariationType {
  BOOLEAN = 'BOOLEAN',
  VARIANT = 'VARIANT'
}

// Feature flag interface
export interface FeatureFlag {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  targetType: FlagTargetType;
  targetRules: any;
  variationType: FlagVariationType;
  variants: any;
}

// In-memory cache of feature flags
const featureFlagCache = new Map<string, FeatureFlag>();
let lastCacheUpdate = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL

// Default feature flag values (used when database is unavailable)
const defaultFeatureFlags: Record<string, boolean> = {
  // UX improvements
  'enable-enhanced-map-controls': true,
  'use-improved-document-viewer': true,
  'enable-workflow-visualization': false,
  'show-feature-tour': true,
  'enable-quick-nav-panel': false,
  
  // New features
  'enable-real-time-collaboration': true,
  'enable-advanced-property-search': false,
  'enable-arcgis-integration': true,
  'enable-document-ai-analysis': false,
  'enable-data-quality-dashboard': false,
  
  // Technical improvements
  'use-websocket-heartbeat': true,
  'enhanced-error-reporting': true,
  'enable-performance-tracking': true,
  'enable-cache-layer': false,
  'use-background-processing': false,
};

// Initialize flags on startup
let featureFlagsInitialized = false;

/**
 * Initialize the feature flag system
 */
export async function initializeFeatureFlags(): Promise<void> {
  try {
    // Load default flags
    Object.entries(defaultFeatureFlags).forEach(([key, enabled]) => {
      featureFlagCache.set(key, {
        id: 0,
        name: key,
        description: `Default flag for ${key}`,
        enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
        targetType: FlagTargetType.GLOBAL,
        targetRules: null,
        variationType: FlagVariationType.BOOLEAN,
        variants: null,
      });
    });
    
    featureFlagsInitialized = true;
    logger.info('Feature flag system initialized successfully with defaults');
  } catch (error) {
    logger.error('Failed to initialize feature flags', error);
  }
}

/**
 * Get a feature flag value
 * @param flagName Name of the feature flag
 * @param context Optional context for targeted flags
 */
export function getFeatureFlag(
  flagName: string, 
  context?: Record<string, any>
): boolean {
  // Get flag from cache
  const flag = featureFlagCache.get(flagName);
  
  // If flag doesn't exist, check defaults or return false
  if (!flag) {
    return defaultFeatureFlags[flagName] || false;
  }
  
  // Simple case: globally enabled/disabled flag
  return flag.enabled;
}

/**
 * Register feature flag API endpoints
 */
export function registerFeatureFlagRoutes(app: Express): void {
  // Client-side API to evaluate feature flags
  app.post('/api/feature-flags/evaluate', async (req, res) => {
    try {
      const { flags, context } = req.body;
      
      if (!Array.isArray(flags)) {
        return res.status(400).json({ error: 'Flags must be an array of flag names' });
      }
      
      const results: Record<string, boolean> = {};
      
      for (const flagName of flags) {
        if (typeof flagName !== 'string') continue;
        results[flagName] = getFeatureFlag(flagName, context);
      }
      
      res.json(results);
    } catch (error) {
      logger.error('Error evaluating feature flags', error);
      res.status(500).json({ error: 'Failed to evaluate feature flags' });
    }
  });
}