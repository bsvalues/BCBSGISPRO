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
import { featureFlags, FeatureFlag, FlagTargetType, FlagVariationType } from '../../shared/schema';

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
    // Try to load flags from the database
    await refreshFeatureFlagCache();
    featureFlagsInitialized = true;
    logger.info('Feature flag system initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize feature flags from database, using defaults', error);
    // Load default flags into the cache
    Object.entries(defaultFeatureFlags).forEach(([key, enabled]) => {
      featureFlagCache.set(key, {
        id: 0, // Placeholder ID
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
  }
}

/**
 * Refresh the feature flag cache from the database
 */
export async function refreshFeatureFlagCache(): Promise<void> {
  try {
    const flags = await db.select().from(featureFlags);
    
    // Clear existing cache
    featureFlagCache.clear();
    
    // Populate cache with fresh data
    for (const flag of flags) {
      featureFlagCache.set(flag.name, flag);
    }
    
    lastCacheUpdate = Date.now();
    logger.info(`Refreshed feature flag cache with ${flags.length} flags`);
  } catch (error) {
    logger.error('Failed to refresh feature flag cache', error);
    throw error;
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
  // Check if cache needs refresh
  if (Date.now() - lastCacheUpdate > CACHE_TTL) {
    // Refresh async without blocking
    refreshFeatureFlagCache().catch(error => 
      logger.error('Background refresh of feature flags failed', error)
    );
  }
  
  // Get flag from cache
  const flag = featureFlagCache.get(flagName);
  
  // If flag doesn't exist, check defaults or return false
  if (!flag) {
    return defaultFeatureFlags[flagName] || false;
  }
  
  // Simple case: globally enabled/disabled flag
  if (flag.targetType === FlagTargetType.GLOBAL) {
    return flag.enabled;
  }
  
  // Targeted flag evaluation
  if (flag.targetType === FlagTargetType.TARGETED && flag.targetRules && context) {
    try {
      const targetRules = flag.targetRules as any[];
      
      // Evaluate each rule until one matches
      for (const rule of targetRules) {
        if (evaluateTargetRule(rule, context)) {
          return rule.returnValue === true;
        }
      }
    } catch (error) {
      logger.error(`Error evaluating target rules for flag ${flagName}`, error);
    }
  }
  
  // Percentage rollout
  if (flag.targetType === FlagTargetType.PERCENTAGE && context?.userId) {
    try {
      const percentage = flag.targetRules?.percentage || 0;
      if (isUserInPercentage(context.userId, flagName, percentage)) {
        return flag.enabled;
      }
      return false;
    } catch (error) {
      logger.error(`Error evaluating percentage rollout for flag ${flagName}`, error);
    }
  }
  
  // A/B testing with variants
  if (flag.variationType === FlagVariationType.VARIANT && flag.variants && context?.userId) {
    try {
      const variants = flag.variants as any[];
      const variantIndex = getVariantForUser(context.userId, flagName, variants.length);
      const variant = variants[variantIndex];
      return variant?.enabled || false;
    } catch (error) {
      logger.error(`Error evaluating variants for flag ${flagName}`, error);
    }
  }
  
  // Default to the global enabled state if targeting evaluation fails
  return flag.enabled;
}

/**
 * Evaluate a targeting rule against the given context
 */
function evaluateTargetRule(rule: any, context: Record<string, any>): boolean {
  const { attribute, operator, value } = rule;
  
  // Get the context value using the attribute path
  const contextValue = getNestedValue(context, attribute);
  
  switch (operator) {
    case 'equals':
      return contextValue === value;
    case 'notEquals':
      return contextValue !== value;
    case 'contains':
      return String(contextValue).includes(String(value));
    case 'notContains':
      return !String(contextValue).includes(String(value));
    case 'startsWith':
      return String(contextValue).startsWith(String(value));
    case 'endsWith':
      return String(contextValue).endsWith(String(value));
    case 'greaterThan':
      return contextValue > value;
    case 'lessThan':
      return contextValue < value;
    case 'in':
      return Array.isArray(value) && value.includes(contextValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(contextValue);
    default:
      logger.warn(`Unknown operator ${operator} in feature flag rule`);
      return false;
  }
}

/**
 * Get a nested value from an object using a dot-notation path
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((prev, curr) => prev && prev[curr], obj);
}

/**
 * Determine if a user falls within a percentage rollout
 */
function isUserInPercentage(userId: string | number, flagName: string, percentage: number): boolean {
  // Create a deterministic hash from userId + flagName
  const hash = cyrb53Hash(`${userId}-${flagName}`);
  // Get a number between 0-99
  const bucketNumber = hash % 100;
  // User is included if their bucket number is less than the percentage
  return bucketNumber < percentage;
}

/**
 * Get the variant for a user (deterministic)
 */
function getVariantForUser(userId: string | number, flagName: string, variantCount: number): number {
  if (variantCount <= 0) return 0;
  
  // Create a deterministic hash from userId + flagName
  const hash = cyrb53Hash(`${userId}-${flagName}`);
  // Get a variant index
  return hash % variantCount;
}

/**
 * Simple but effective hash function (cyrb53)
 */
function cyrb53Hash(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Define API schemas
const createFeatureFlagSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  enabled: z.boolean().default(false),
  targetType: z.enum([
    FlagTargetType.GLOBAL,
    FlagTargetType.TARGETED,
    FlagTargetType.PERCENTAGE
  ]).default(FlagTargetType.GLOBAL),
  targetRules: z.any().optional(),
  variationType: z.enum([
    FlagVariationType.BOOLEAN,
    FlagVariationType.VARIANT
  ]).default(FlagVariationType.BOOLEAN),
  variants: z.any().optional(),
});

const updateFeatureFlagSchema = createFeatureFlagSchema.partial();

/**
 * Register feature flag API endpoints
 */
export function registerFeatureFlagRoutes(app: Express): void {
  // API endpoint to get all feature flags (admin only)
  app.get('/api/feature-flags', async (req, res) => {
    try {
      // In a production environment, we would properly authenticate admin access
      // For now, we'll use a simple API key check
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const flags = await db.select().from(featureFlags);
      res.json(flags);
    } catch (error) {
      logger.error('Error fetching feature flags', error);
      res.status(500).json({ error: 'Failed to fetch feature flags' });
    }
  });
  
  // API endpoint to create a new feature flag (admin only)
  app.post('/api/feature-flags', async (req, res) => {
    try {
      // Authenticate
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Validate request body
      const validatedData = createFeatureFlagSchema.parse(req.body);
      
      // Check if flag with same name already exists
      const existingFlag = await db.select()
        .from(featureFlags)
        .where(eq(featureFlags.name, validatedData.name));
        
      if (existingFlag.length > 0) {
        return res.status(409).json({ error: 'Feature flag with this name already exists' });
      }
      
      // Create new flag
      const [newFlag] = await db.insert(featureFlags)
        .values({
          name: validatedData.name,
          description: validatedData.description || `Flag for ${validatedData.name}`,
          enabled: validatedData.enabled,
          targetType: validatedData.targetType,
          targetRules: validatedData.targetRules,
          variationType: validatedData.variationType,
          variants: validatedData.variants,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      // Refresh cache
      await refreshFeatureFlagCache();
      
      res.status(201).json(newFlag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      
      logger.error('Error creating feature flag', error);
      res.status(500).json({ error: 'Failed to create feature flag' });
    }
  });
  
  // API endpoint to update a feature flag (admin only)
  app.patch('/api/feature-flags/:id', async (req, res) => {
    try {
      // Authenticate
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const flagId = Number(req.params.id);
      if (isNaN(flagId)) {
        return res.status(400).json({ error: 'Invalid flag ID' });
      }
      
      // Validate request body
      const validatedData = updateFeatureFlagSchema.parse(req.body);
      
      // Check if flag exists
      const existingFlag = await db.select()
        .from(featureFlags)
        .where(eq(featureFlags.id, flagId));
        
      if (existingFlag.length === 0) {
        return res.status(404).json({ error: 'Feature flag not found' });
      }
      
      // Update flag
      const [updatedFlag] = await db.update(featureFlags)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.id, flagId))
        .returning();
      
      // Refresh cache
      await refreshFeatureFlagCache();
      
      res.json(updatedFlag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      
      logger.error('Error updating feature flag', error);
      res.status(500).json({ error: 'Failed to update feature flag' });
    }
  });
  
  // API endpoint to delete a feature flag (admin only)
  app.delete('/api/feature-flags/:id', async (req, res) => {
    try {
      // Authenticate
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const flagId = Number(req.params.id);
      if (isNaN(flagId)) {
        return res.status(400).json({ error: 'Invalid flag ID' });
      }
      
      // Delete the flag
      await db.delete(featureFlags)
        .where(eq(featureFlags.id, flagId));
      
      // Refresh cache
      await refreshFeatureFlagCache();
      
      res.status(204).end();
    } catch (error) {
      logger.error('Error deleting feature flag', error);
      res.status(500).json({ error: 'Failed to delete feature flag' });
    }
  });
  
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
  
  // Force cache refresh (admin only)
  app.post('/api/feature-flags/refresh-cache', async (req, res) => {
    try {
      // Authenticate
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      await refreshFeatureFlagCache();
      res.json({ success: true, message: 'Feature flag cache refreshed' });
    } catch (error) {
      logger.error('Error refreshing feature flag cache', error);
      res.status(500).json({ error: 'Failed to refresh feature flag cache' });
    }
  });
}