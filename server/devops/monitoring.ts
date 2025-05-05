/**
 * BentonGeoPro DevOps Monitoring Module
 * 
 * This module provides monitoring and health check capabilities for the application
 * with metrics collection for performance analysis and system health reporting.
 */

import { Express, Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { performance } from 'perf_hooks';
import { getDatabaseStatus } from '../db-resilience';
import os from 'os';

// Performance metrics store
const metrics = {
  requests: {
    total: 0,
    byEndpoint: new Map<string, number>(),
    byMethod: new Map<string, number>(),
    byStatusCode: new Map<string, number>(),
  },
  responseTimes: {
    avg: 0,
    max: 0,
    min: Number.MAX_SAFE_INTEGER,
    total: 0,
    count: 0,
    byEndpoint: new Map<string, { total: number, count: number, avg: number, max: number }>(),
  },
  errors: {
    total: 0,
    byType: new Map<string, number>(),
    byEndpoint: new Map<string, number>(),
  },
  system: {
    lastCheck: Date.now(),
    uptime: 0,
    memoryUsage: {
      free: 0,
      total: 0,
      percentUsed: 0,
    },
    cpuLoad: 0,
  },
  application: {
    startTime: Date.now(),
    websocketConnections: 0,
    activeUsers: 0,
    activeSessions: 0,
  },
  database: {
    connected: true,
    queryCount: 0,
    slowQueries: 0,
    errors: 0,
    lastError: '',
  }
};

// Track slow database queries
export function trackDatabaseQuery(query: string, durationMs: number) {
  metrics.database.queryCount++;
  
  // Consider queries taking more than 500ms as slow
  if (durationMs > 500) {
    metrics.database.slowQueries++;
    logger.warn(`Slow query detected (${durationMs}ms): ${query.substring(0, 100)}...`);
  }
}

// Track database errors
export function trackDatabaseError(error: Error) {
  metrics.database.errors++;
  metrics.database.lastError = error.message;
  logger.error(`Database error: ${error.message}`);
}

// Update system metrics
function updateSystemMetrics() {
  const currentTime = Date.now();
  metrics.system.lastCheck = currentTime;
  metrics.system.uptime = process.uptime();
  
  // Memory usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  metrics.system.memoryUsage = {
    free: freeMem,
    total: totalMem,
    percentUsed: ((totalMem - freeMem) / totalMem) * 100,
  };
  
  // CPU load
  // We're taking a simple approach here - for production, consider a more accurate CPU load calculation
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  }
  
  metrics.system.cpuLoad = 100 - (idle / total) * 100;
}

// Update database status
async function updateDatabaseStatus() {
  try {
    const isConnected = await getDatabaseStatus();
    metrics.database.connected = isConnected;
  } catch (error) {
    metrics.database.connected = false;
    if (error instanceof Error) {
      trackDatabaseError(error);
    }
  }
}

// Middleware to track request metrics
export function requestMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip tracking for static assets to avoid cluttering metrics
  if (req.path.startsWith('/assets/') || req.path.startsWith('/static/')) {
    return next();
  }

  const startTime = performance.now();
  
  // Track total requests
  metrics.requests.total++;
  
  // Track by method
  const method = req.method;
  metrics.requests.byMethod.set(
    method, 
    (metrics.requests.byMethod.get(method) || 0) + 1
  );
  
  // Track by endpoint - normalize the path to avoid unique metrics for parameterized routes
  const normalizedPath = req.route?.path || req.path;
  metrics.requests.byEndpoint.set(
    normalizedPath, 
    (metrics.requests.byEndpoint.get(normalizedPath) || 0) + 1
  );
  
  // Track response time after request is complete
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    
    // Update response time metrics
    metrics.responseTimes.total += duration;
    metrics.responseTimes.count++;
    metrics.responseTimes.avg = metrics.responseTimes.total / metrics.responseTimes.count;
    metrics.responseTimes.max = Math.max(metrics.responseTimes.max, duration);
    metrics.responseTimes.min = Math.min(metrics.responseTimes.min, duration);
    
    // Update by endpoint
    const endpointStats = metrics.responseTimes.byEndpoint.get(normalizedPath) || {
      total: 0,
      count: 0,
      avg: 0,
      max: 0,
    };
    
    endpointStats.total += duration;
    endpointStats.count++;
    endpointStats.avg = endpointStats.total / endpointStats.count;
    endpointStats.max = Math.max(endpointStats.max, duration);
    
    metrics.responseTimes.byEndpoint.set(normalizedPath, endpointStats);
    
    // Track status code
    const statusCode = res.statusCode.toString();
    metrics.requests.byStatusCode.set(
      statusCode, 
      (metrics.requests.byStatusCode.get(statusCode) || 0) + 1
    );
    
    // Track errors (status code >= 400)
    if (res.statusCode >= 400) {
      metrics.errors.total++;
      metrics.errors.byEndpoint.set(
        normalizedPath, 
        (metrics.errors.byEndpoint.get(normalizedPath) || 0) + 1
      );
    }
    
    // Log slow responses (more than 1 second)
    if (duration > 1000) {
      logger.warn(`Slow response detected: ${req.method} ${normalizedPath} took ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
}

// Set up WebSocket connection tracking
export function updateWebSocketMetrics(connectionsCount: number) {
  metrics.application.websocketConnections = connectionsCount;
}

// Track active users/sessions
export function updateActiveUsers(activeUsers: number, activeSessions: number) {
  metrics.application.activeUsers = activeUsers;
  metrics.application.activeSessions = activeSessions;
}

// Periodically update system metrics (every 60 seconds)
let metricsInterval: NodeJS.Timeout | null = null;

export function startMetricsCollection() {
  // Update metrics immediately when starting
  updateSystemMetrics();
  updateDatabaseStatus();
  
  // Then set up interval for periodic updates
  if (!metricsInterval) {
    metricsInterval = setInterval(async () => {
      updateSystemMetrics();
      await updateDatabaseStatus();
    }, 60000); // Update every minute
  }
}

export function stopMetricsCollection() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

// Reset metrics - useful for testing or when rotating metrics collection
export function resetMetrics() {
  metrics.requests.total = 0;
  metrics.requests.byEndpoint.clear();
  metrics.requests.byMethod.clear();
  metrics.requests.byStatusCode.clear();
  
  metrics.responseTimes.avg = 0;
  metrics.responseTimes.max = 0;
  metrics.responseTimes.min = Number.MAX_SAFE_INTEGER;
  metrics.responseTimes.total = 0;
  metrics.responseTimes.count = 0;
  metrics.responseTimes.byEndpoint.clear();
  
  metrics.errors.total = 0;
  metrics.errors.byType.clear();
  metrics.errors.byEndpoint.clear();
  
  metrics.database.queryCount = 0;
  metrics.database.slowQueries = 0;
  metrics.database.errors = 0;
  metrics.database.lastError = '';
  
  // Keep the application start time intact
  const startTime = metrics.application.startTime;
  
  metrics.application.websocketConnections = 0;
  metrics.application.activeUsers = 0;
  metrics.application.activeSessions = 0;
  metrics.application.startTime = startTime;
}

// Get a snapshot of the current metrics
export function getMetricsSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    requests: {
      total: metrics.requests.total,
      byEndpoint: Object.fromEntries(metrics.requests.byEndpoint),
      byMethod: Object.fromEntries(metrics.requests.byMethod),
      byStatusCode: Object.fromEntries(metrics.requests.byStatusCode),
    },
    responseTimes: {
      avg: metrics.responseTimes.avg,
      max: metrics.responseTimes.max,
      min: metrics.responseTimes.min === Number.MAX_SAFE_INTEGER ? 0 : metrics.responseTimes.min,
      byEndpoint: Object.fromEntries(metrics.responseTimes.byEndpoint),
    },
    errors: {
      total: metrics.errors.total,
      byType: Object.fromEntries(metrics.errors.byType),
      byEndpoint: Object.fromEntries(metrics.errors.byEndpoint),
    },
    system: { ...metrics.system },
    application: {
      ...metrics.application,
      uptime: (Date.now() - metrics.application.startTime) / 1000, // in seconds
    },
    database: { ...metrics.database },
  };
}

// Health check function
export function healthCheck() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
    memoryUsage: process.memoryUsage(),
    database: {
      connected: metrics.database.connected,
      errors: metrics.database.errors,
    },
    systemLoad: {
      cpuUsage: metrics.system.cpuLoad.toFixed(2) + '%',
      memoryUsed: metrics.system.memoryUsage.percentUsed.toFixed(2) + '%',
    },
  };
  
  // Determine overall status
  if (!metrics.database.connected) {
    health.status = 'critical';
  } else if (metrics.system.memoryUsage.percentUsed > 90 || metrics.system.cpuLoad > 90) {
    health.status = 'warning';
  }
  
  return health;
}

// Register metrics API endpoints
export function registerMetricsEndpoints(app: Express) {
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    // Force a database check for the health endpoint
    await updateDatabaseStatus();
    
    const health = healthCheck();
    
    // Set appropriate status code based on health status
    if (health.status === 'critical') {
      res.status(503);
    } else if (health.status === 'warning') {
      res.status(200);
    } else {
      res.status(200);
    }
    
    res.json(health);
  });
  
  // Detailed metrics endpoint (protected, admin only)
  app.get('/api/metrics', (req, res) => {
    // In a production environment, we should add proper authentication here
    // This is just a simple check for demonstration purposes
    if (req.query.apiKey !== 'devops-metrics-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const metricsSnapshot = getMetricsSnapshot();
    res.json(metricsSnapshot);
  });
  
  // Reset metrics endpoint (admin only, mainly for testing)
  app.post('/api/metrics/reset', (req, res) => {
    // In a production environment, we should add proper authentication here
    if (req.query.apiKey !== 'devops-metrics-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    resetMetrics();
    res.json({ success: true, message: 'Metrics have been reset' });
  });
}

// Initialize the monitoring system
export function initializeMonitoring(app: Express) {
  // Start collecting metrics
  startMetricsCollection();
  
  // Register the request metrics middleware
  app.use(requestMetricsMiddleware);
  
  // Register API endpoints
  registerMetricsEndpoints(app);
  
  logger.info('DevOps monitoring system initialized');
  
  // Return cleanup function
  return () => {
    stopMetricsCollection();
    logger.info('DevOps monitoring system stopped');
  };
}