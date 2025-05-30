/**
 * BentonGeoPro UX Metrics Collection
 * 
 * This module provides advanced user experience metrics collection and analysis
 * to improve application usability and address UX issues in accordance with
 * the phased DevOps implementation plan.
 */

import { Express, Request, Response } from 'express';
import { logger } from '../logger';
import { db } from '../db';
import { z } from 'zod';

// UX event and metric types
export enum UxEventType {
  PAGE_VIEW = 'page_view',
  INTERACTION = 'interaction',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  NAVIGATION = 'navigation',
  WORKFLOW = 'workflow',
  FEATURE_USE = 'feature_use',
  USER_FEEDBACK = 'user_feedback'
}

export enum InteractionType {
  CLICK = 'click',
  HOVER = 'hover',
  SCROLL = 'scroll',
  INPUT = 'input',
  DRAG = 'drag',
  SEARCH = 'search',
  SELECTION = 'selection',
  ZOOM = 'zoom',
  PAN = 'pan',
  DRAW = 'draw'
}

export enum PerformanceMetricType {
  PAGE_LOAD = 'page_load',
  COMPONENT_RENDER = 'component_render',
  API_RESPONSE = 'api_response',
  RESOURCE_LOAD = 'resource_load',
  INTERACTION_DELAY = 'interaction_delay',
  MAP_RENDER = 'map_render',
  MAP_TILES_LOAD = 'map_tiles_load',
  DOCUMENT_LOAD = 'document_load'
}

// In-memory storage for UX metrics
// In a production system, this would be stored in a database
const uxMetrics = {
  events: [] as UxEvent[],
  aggregatedData: {
    pageViews: new Map<string, number>(),
    interactions: new Map<string, number>(),
    errorCounts: new Map<string, number>(),
    performanceMetrics: new Map<string, { total: number, count: number, avg: number, max: number, min: number }>(),
    workflowCompletionRates: new Map<string, { attempts: number, completions: number, rate: number }>(),
    featureUsage: new Map<string, number>(),
    userFeedback: [] as UserFeedback[]
  },
  // Store session paths to analyze user journeys
  sessionPaths: new Map<string, { path: {page: string, timestamp: number}[], userId?: string }>()
};

// Maximum number of events to keep in memory
const MAX_EVENTS = 10000;

// Interface for UX events
interface UxEvent {
  id: string;
  type: UxEventType;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  page?: string;
  component?: string;
  subtype?: string;
  details?: Record<string, any>;
  duration?: number;
  tags?: string[];
}

// Interface for user feedback
interface UserFeedback {
  id: string;
  sessionId?: string;
  userId?: string;
  page: string;
  rating: number; // 1-5 scale
  category?: string;
  comment?: string;
  timestamp: number;
  tags?: string[];
}

/**
 * Generate a unique ID for events
 */
function generateEventId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Track a user experience event
 */
export function trackUxEvent(event: Omit<UxEvent, 'id' | 'timestamp'>): string {
  try {
    const id = generateEventId();
    const timestamp = Date.now();
    
    const newEvent: UxEvent = {
      id,
      timestamp,
      ...event
    };
    
    // Add to events array
    uxMetrics.events.unshift(newEvent);
    
    // Trim the events array if it's getting too large
    if (uxMetrics.events.length > MAX_EVENTS) {
      uxMetrics.events.pop();
    }
    
    // Update aggregated metrics based on event type
    updateAggregatedMetrics(newEvent);
    
    // Update session path if session ID is provided
    if (newEvent.sessionId && newEvent.type === UxEventType.PAGE_VIEW && newEvent.page) {
      updateSessionPath(newEvent.sessionId, newEvent.page, newEvent.userId);
    }
    
    return id;
  } catch (error) {
    logger.error('Error tracking UX event', error);
    return 'error-tracking-failed';
  }
}

/**
 * Update session path for user journey analysis
 */
function updateSessionPath(sessionId: string, page: string, userId?: string) {
  const sessionPath = uxMetrics.sessionPaths.get(sessionId) || { path: [], userId };
  
  // Add the new page to the path
  sessionPath.path.push({
    page,
    timestamp: Date.now()
  });
  
  // Update userId if provided
  if (userId && !sessionPath.userId) {
    sessionPath.userId = userId;
  }
  
  uxMetrics.sessionPaths.set(sessionId, sessionPath);
}

/**
 * Update aggregated metrics based on the event type
 */
function updateAggregatedMetrics(event: UxEvent) {
  switch (event.type) {
    case UxEventType.PAGE_VIEW:
      if (event.page) {
        const currentCount = uxMetrics.aggregatedData.pageViews.get(event.page) || 0;
        uxMetrics.aggregatedData.pageViews.set(event.page, currentCount + 1);
      }
      break;
      
    case UxEventType.INTERACTION:
      if (event.subtype) {
        const key = event.component 
          ? `${event.page || 'unknown'}.${event.component}.${event.subtype}`
          : `${event.page || 'unknown'}.${event.subtype}`;
          
        const currentCount = uxMetrics.aggregatedData.interactions.get(key) || 0;
        uxMetrics.aggregatedData.interactions.set(key, currentCount + 1);
      }
      break;
      
    case UxEventType.ERROR:
      if (event.subtype) {
        const currentCount = uxMetrics.aggregatedData.errorCounts.get(event.subtype) || 0;
        uxMetrics.aggregatedData.errorCounts.set(event.subtype, currentCount + 1);
      }
      break;
      
    case UxEventType.PERFORMANCE:
      if (event.subtype && event.duration !== undefined) {
        const metrics = uxMetrics.aggregatedData.performanceMetrics.get(event.subtype) || { 
          total: 0, 
          count: 0, 
          avg: 0, 
          max: 0, 
          min: Number.MAX_SAFE_INTEGER 
        };
        
        metrics.total += event.duration;
        metrics.count += 1;
        metrics.avg = metrics.total / metrics.count;
        metrics.max = Math.max(metrics.max, event.duration);
        metrics.min = Math.min(metrics.min, event.duration);
        
        uxMetrics.aggregatedData.performanceMetrics.set(event.subtype, metrics);
      }
      break;
      
    case UxEventType.WORKFLOW:
      if (event.subtype) {
        const stats = uxMetrics.aggregatedData.workflowCompletionRates.get(event.subtype) || {
          attempts: 0,
          completions: 0,
          rate: 0
        };
        
        if (event.details?.status === 'started' || event.details?.status === 'attempted') {
          stats.attempts += 1;
        }
        
        if (event.details?.status === 'completed' || event.details?.status === 'success') {
          stats.completions += 1;
        }
        
        stats.rate = stats.attempts > 0 ? stats.completions / stats.attempts : 0;
        
        uxMetrics.aggregatedData.workflowCompletionRates.set(event.subtype, stats);
      }
      break;
      
    case UxEventType.FEATURE_USE:
      if (event.subtype) {
        const currentCount = uxMetrics.aggregatedData.featureUsage.get(event.subtype) || 0;
        uxMetrics.aggregatedData.featureUsage.set(event.subtype, currentCount + 1);
      }
      break;
      
    case UxEventType.USER_FEEDBACK:
      if (event.details?.rating !== undefined && event.details?.feedback) {
        const feedback: UserFeedback = {
          id: event.id,
          sessionId: event.sessionId,
          userId: event.userId,
          page: event.page || 'unknown',
          rating: event.details.rating,
          category: event.details.category,
          comment: event.details.feedback,
          timestamp: event.timestamp,
          tags: event.tags
        };
        
        uxMetrics.aggregatedData.userFeedback.push(feedback);
      }
      break;
  }
}

/**
 * Get UX events with optional filtering
 */
export function getUxEvents(options: {
  type?: UxEventType;
  subtype?: string;
  page?: string;
  component?: string;
  sessionId?: string;
  userId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
} = {}): {
  events: UxEvent[];
  total: number;
} {
  let filteredEvents = [...uxMetrics.events];
  
  // Apply filters
  if (options.type) {
    filteredEvents = filteredEvents.filter(e => e.type === options.type);
  }
  
  if (options.subtype) {
    filteredEvents = filteredEvents.filter(e => e.subtype === options.subtype);
  }
  
  if (options.page) {
    filteredEvents = filteredEvents.filter(e => e.page === options.page);
  }
  
  if (options.component) {
    filteredEvents = filteredEvents.filter(e => e.component === options.component);
  }
  
  if (options.sessionId) {
    filteredEvents = filteredEvents.filter(e => e.sessionId === options.sessionId);
  }
  
  if (options.userId) {
    filteredEvents = filteredEvents.filter(e => e.userId === options.userId);
  }
  
  if (options.startTime) {
    filteredEvents = filteredEvents.filter(e => e.timestamp >= options.startTime!);
  }
  
  if (options.endTime) {
    filteredEvents = filteredEvents.filter(e => e.timestamp <= options.endTime!);
  }
  
  const total = filteredEvents.length;
  
  // Apply pagination
  if (options.offset !== undefined && options.limit !== undefined) {
    filteredEvents = filteredEvents.slice(
      options.offset,
      options.offset + options.limit
    );
  } else if (options.limit !== undefined) {
    filteredEvents = filteredEvents.slice(0, options.limit);
  }
  
  return {
    events: filteredEvents,
    total
  };
}

/**
 * Get a summary of UX metrics
 */
export function getUxMetricsSummary() {
  // Calculate overall metrics
  const totalPageViews = Array.from(uxMetrics.aggregatedData.pageViews.values())
    .reduce((sum, count) => sum + count, 0);
    
  const totalInteractions = Array.from(uxMetrics.aggregatedData.interactions.values())
    .reduce((sum, count) => sum + count, 0);
    
  const totalErrors = Array.from(uxMetrics.aggregatedData.errorCounts.values())
    .reduce((sum, count) => sum + count, 0);
    
  // Calculate average performance metrics
  const performanceAverages = {} as Record<string, number>;
  uxMetrics.aggregatedData.performanceMetrics.forEach((value, key) => {
    performanceAverages[key] = value.avg;
  });
  
  // Get top pages by views
  const topPages = Array.from(uxMetrics.aggregatedData.pageViews.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([page, views]) => ({ page, views }));
    
  // Get top features by usage
  const topFeatures = Array.from(uxMetrics.aggregatedData.featureUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([feature, count]) => ({ feature, count }));
    
  // Calculate workflow success rates
  const workflowRates = {} as Record<string, number>;
  uxMetrics.aggregatedData.workflowCompletionRates.forEach((value, key) => {
    workflowRates[key] = value.rate;
  });
  
  // Calculate overall user satisfaction from feedback
  const userFeedback = uxMetrics.aggregatedData.userFeedback;
  const averageSatisfaction = userFeedback.length > 0
    ? userFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) / userFeedback.length
    : null;
    
  // Return the summary
  return {
    timestamp: new Date().toISOString(),
    overview: {
      totalEvents: uxMetrics.events.length,
      totalPageViews,
      totalInteractions,
      totalErrors,
      uniqueSessions: uxMetrics.sessionPaths.size,
      averageSatisfaction
    },
    topPages,
    topFeatures,
    performanceMetrics: performanceAverages,
    workflowCompletionRates: workflowRates
  };
}

/**
 * Get user journey analytics
 */
export function getUserJourneyAnalytics() {
  // Extract all session paths
  const allPaths = Array.from(uxMetrics.sessionPaths.values());
  
  // Calculate common paths (sequences of pages)
  const pathSequences = new Map<string, number>();
  
  allPaths.forEach(sessionData => {
    // Only analyze paths with at least 2 pages
    if (sessionData.path.length < 2) return;
    
    // Create path sequences (pairs of consecutive pages)
    for (let i = 0; i < sessionData.path.length - 1; i++) {
      const sequence = `${sessionData.path[i].page} → ${sessionData.path[i+1].page}`;
      const count = pathSequences.get(sequence) || 0;
      pathSequences.set(sequence, count + 1);
    }
    
    // Create longer sequences (triplets) if available
    for (let i = 0; i < sessionData.path.length - 2; i++) {
      const sequence = `${sessionData.path[i].page} → ${sessionData.path[i+1].page} → ${sessionData.path[i+2].page}`;
      const count = pathSequences.get(sequence) || 0;
      pathSequences.set(sequence, count + 1);
    }
  });
  
  // Sort sequences by frequency
  const commonPathSequences = Array.from(pathSequences.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sequence, count]) => ({ sequence, count }));
    
  // Calculate average session length (number of pages)
  const averageSessionLength = allPaths.length > 0
    ? allPaths.reduce((sum, session) => sum + session.path.length, 0) / allPaths.length
    : 0;
    
  // Calculate average time spent on each page
  const pageTimeSpent = new Map<string, { totalTime: number, visits: number, avgTime: number }>();
  
  allPaths.forEach(sessionData => {
    const path = sessionData.path;
    
    for (let i = 0; i < path.length - 1; i++) {
      const page = path[i].page;
      const timeSpent = path[i+1].timestamp - path[i].timestamp;
      
      // Only count reasonable times (less than 30 minutes)
      if (timeSpent > 0 && timeSpent < 30 * 60 * 1000) {
        const stats = pageTimeSpent.get(page) || { totalTime: 0, visits: 0, avgTime: 0 };
        stats.totalTime += timeSpent;
        stats.visits += 1;
        stats.avgTime = stats.totalTime / stats.visits;
        pageTimeSpent.set(page, stats);
      }
    }
  });
  
  const pageTimings = Array.from(pageTimeSpent.entries())
    .map(([page, stats]) => ({
      page,
      averageTimeMs: stats.avgTime,
      averageTimeSec: Math.round(stats.avgTime / 1000),
      visits: stats.visits
    }))
    .sort((a, b) => b.visits - a.visits);
    
  // Calculate bounce rate (sessions with only one page view)
  const bounceCount = allPaths.filter(session => session.path.length === 1).length;
  const bounceRate = allPaths.length > 0 ? bounceCount / allPaths.length : 0;
  
  return {
    sessionCount: allPaths.length,
    averageSessionLength,
    bounceRate,
    commonPathSequences,
    pageTimings
  };
}

/**
 * Reset UX metrics - useful for testing
 */
export function resetUxMetrics() {
  uxMetrics.events = [];
  uxMetrics.aggregatedData.pageViews.clear();
  uxMetrics.aggregatedData.interactions.clear();
  uxMetrics.aggregatedData.errorCounts.clear();
  uxMetrics.aggregatedData.performanceMetrics.clear();
  uxMetrics.aggregatedData.workflowCompletionRates.clear();
  uxMetrics.aggregatedData.featureUsage.clear();
  uxMetrics.aggregatedData.userFeedback = [];
  uxMetrics.sessionPaths.clear();
}

// UX event validation schema
const uxEventSchema = z.object({
  type: z.enum([
    UxEventType.PAGE_VIEW,
    UxEventType.INTERACTION,
    UxEventType.ERROR,
    UxEventType.PERFORMANCE,
    UxEventType.NAVIGATION,
    UxEventType.WORKFLOW,
    UxEventType.FEATURE_USE,
    UxEventType.USER_FEEDBACK
  ]),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  page: z.string().optional(),
  component: z.string().optional(),
  subtype: z.string().optional(),
  details: z.record(z.any()).optional(),
  duration: z.number().optional(),
  tags: z.array(z.string()).optional()
});

// Bulk events validation schema
const bulkEventsSchema = z.object({
  events: z.array(uxEventSchema)
});

// User feedback validation schema
const userFeedbackSchema = z.object({
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  page: z.string(),
  rating: z.number().min(1).max(5),
  category: z.string().optional(),
  comment: z.string().optional(),
  tags: z.array(z.string()).optional()
});

/**
 * Register UX metrics API endpoints
 */
export function registerUxMetricsEndpoints(app: Express): void {
  // Submit a UX event
  app.post('/api/ux-metrics/event', (req, res) => {
    try {
      const eventData = uxEventSchema.parse(req.body);
      const eventId = trackUxEvent(eventData);
      res.status(201).json({ success: true, eventId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error processing UX event', error);
      res.status(500).json({ error: 'Failed to process UX event' });
    }
  });
  
  // Submit multiple UX events (bulk)
  app.post('/api/ux-metrics/events/bulk', (req, res) => {
    try {
      const { events } = bulkEventsSchema.parse(req.body);
      const eventIds = events.map(event => trackUxEvent(event));
      res.status(201).json({ success: true, eventCount: eventIds.length, eventIds });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error processing bulk UX events', error);
      res.status(500).json({ error: 'Failed to process bulk UX events' });
    }
  });
  
  // Submit user feedback
  app.post('/api/ux-metrics/feedback', (req, res) => {
    try {
      const feedback = userFeedbackSchema.parse(req.body);
      
      // Track as a user feedback event
      const eventId = trackUxEvent({
        type: UxEventType.USER_FEEDBACK,
        sessionId: feedback.sessionId,
        userId: feedback.userId,
        page: feedback.page,
        details: {
          rating: feedback.rating,
          feedback: feedback.comment,
          category: feedback.category
        },
        tags: feedback.tags
      });
      
      res.status(201).json({ success: true, feedbackId: eventId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error processing user feedback', error);
      res.status(500).json({ error: 'Failed to process user feedback' });
    }
  });
  
  // Get UX metrics summary (admin only)
  app.get('/api/ux-metrics/summary', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const summary = getUxMetricsSummary();
      res.json(summary);
    } catch (error) {
      logger.error('Error generating UX metrics summary', error);
      res.status(500).json({ error: 'Failed to generate UX metrics summary' });
    }
  });
  
  // Get user journey analytics (admin only)
  app.get('/api/ux-metrics/journeys', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const journeyAnalytics = getUserJourneyAnalytics();
      res.json(journeyAnalytics);
    } catch (error) {
      logger.error('Error generating user journey analytics', error);
      res.status(500).json({ error: 'Failed to generate user journey analytics' });
    }
  });
  
  // Get raw UX events with filtering (admin only)
  app.get('/api/ux-metrics/events', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Parse filtering options
      const options = {
        type: req.query.type as UxEventType | undefined,
        subtype: req.query.subtype as string | undefined,
        page: req.query.page as string | undefined,
        component: req.query.component as string | undefined,
        sessionId: req.query.sessionId as string | undefined,
        userId: req.query.userId as string | undefined,
        startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const result = getUxEvents(options);
      res.json(result);
    } catch (error) {
      logger.error('Error fetching UX events', error);
      res.status(500).json({ error: 'Failed to fetch UX events' });
    }
  });
  
  // Reset metrics (admin only - mainly for testing)
  app.post('/api/ux-metrics/reset', (req, res) => {
    try {
      // Basic authentication for admin routes
      if (req.query.apiKey !== 'devops-admin-key') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      resetUxMetrics();
      res.json({ success: true, message: 'UX metrics have been reset' });
    } catch (error) {
      logger.error('Error resetting UX metrics', error);
      res.status(500).json({ error: 'Failed to reset UX metrics' });
    }
  });
}

/**
 * Initialize the UX metrics collection system
 */
export function initializeUxMetrics(app: Express): void {
  // Register API endpoints
  registerUxMetricsEndpoints(app);
  logger.info('UX metrics system initialized');
}