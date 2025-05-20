/**
 * Health Check System for TerraFusion
 * 
 * This module provides utilities for monitoring system health across
 * different components of the platform.
 */

import { logger } from '../utils/logger';

interface HealthCheckOptions {
  /** Time interval between checks in ms */
  interval?: number;
  /** Timeout for individual checks in ms */
  timeout?: number;
  /** Whether to auto-start the health checks */
  autoStart?: boolean;
  /** Whether to log all checks or only failures */
  logAllChecks?: boolean;
}

interface HealthStatus {
  /** Component identifier */
  component: string;
  /** Status: healthy, degraded, or unhealthy */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Response time in ms */
  responseTime: number;
  /** Check timestamp */
  timestamp: string;
  /** Optional details */
  details?: Record<string, any>;
  /** Optional error message */
  error?: string;
}

type HealthCheckFunction = () => Promise<HealthStatus>;

/**
 * Health check system for monitoring service health
 */
export class HealthCheckSystem {
  private checks: Map<string, HealthCheckFunction> = new Map();
  private results: Map<string, HealthStatus> = new Map();
  private interval: NodeJS.Timeout | null = null;
  private options: Required<HealthCheckOptions>;
  private logger = logger.withTags(['DevOps', 'HealthCheck']);

  /**
   * Default options for health checks
   */
  private static readonly DEFAULT_OPTIONS: Required<HealthCheckOptions> = {
    interval: 60000, // 1 minute
    timeout: 10000, // 10 seconds
    autoStart: false,
    logAllChecks: false
  };

  /**
   * Create a new health check system
   * 
   * @param options - Configuration options
   */
  constructor(options: HealthCheckOptions = {}) {
    this.options = { ...HealthCheckSystem.DEFAULT_OPTIONS, ...options };
    
    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * Register a health check
   * 
   * @param component - Component identifier
   * @param checkFn - Health check function
   */
  registerCheck(component: string, checkFn: HealthCheckFunction): void {
    this.checks.set(component, checkFn);
    this.logger.info(`Registered health check for ${component}`);
  }

  /**
   * Unregister a health check
   * 
   * @param component - Component identifier
   */
  unregisterCheck(component: string): void {
    if (this.checks.has(component)) {
      this.checks.delete(component);
      this.results.delete(component);
      this.logger.info(`Unregistered health check for ${component}`);
    }
  }

  /**
   * Start health check monitoring
   */
  start(): void {
    if (this.interval) {
      this.logger.warn('Health check system is already running');
      return;
    }
    
    this.logger.info('Starting health check system');
    
    // Run initial check
    this.runAllChecks();
    
    // Schedule periodic checks
    this.interval = setInterval(() => {
      this.runAllChecks();
    }, this.options.interval);
  }

  /**
   * Stop health check monitoring
   */
  stop(): void {
    if (!this.interval) {
      this.logger.warn('Health check system is not running');
      return;
    }
    
    clearInterval(this.interval);
    this.interval = null;
    this.logger.info('Stopped health check system');
  }

  /**
   * Run all registered health checks
   */
  async runAllChecks(): Promise<void> {
    const components = Array.from(this.checks.keys());
    
    for (const component of components) {
      await this.runCheck(component);
    }
  }

  /**
   * Run a specific health check
   * 
   * @param component - Component identifier
   */
  async runCheck(component: string): Promise<HealthStatus | null> {
    const checkFn = this.checks.get(component);
    
    if (!checkFn) {
      this.logger.warn(`Health check for ${component} not found`);
      return null;
    }
    
    try {
      // Create a promise with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timed out')), this.options.timeout);
      });
      
      // Run the actual check with a timeout
      const result = await Promise.race([
        checkFn(),
        timeoutPromise
      ]) as HealthStatus;
      
      // Store and log result
      this.results.set(component, result);
      
      if (this.options.logAllChecks || result.status !== 'healthy') {
        this.logger.info(
          `Health check for ${component}: ${result.status} (${result.responseTime}ms)`,
          { metadata: result }
        );
      }
      
      return result;
    } catch (error) {
      // Handle check failures
      const failedStatus: HealthStatus = {
        component,
        status: 'unhealthy',
        responseTime: this.options.timeout,
        timestamp: new Date().toISOString(),
        error: error.message
      };
      
      this.results.set(component, failedStatus);
      
      this.logger.error(
        `Health check for ${component} failed: ${error.message}`,
        error,
        { metadata: failedStatus }
      );
      
      return failedStatus;
    }
  }

  /**
   * Get the most recent health status for a component
   * 
   * @param component - Component identifier
   * @returns Most recent health status or null if not available
   */
  getStatus(component: string): HealthStatus | null {
    return this.results.get(component) || null;
  }

  /**
   * Get all health check results
   * 
   * @returns Map of component to health status
   */
  getAllStatus(): Map<string, HealthStatus> {
    return new Map(this.results);
  }

  /**
   * Get overall system health
   * 
   * @returns Object with counts for each status and overall status
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
  } {
    const statuses = Array.from(this.results.values());
    
    const counts = {
      total: statuses.length,
      healthy: statuses.filter(s => s.status === 'healthy').length,
      degraded: statuses.filter(s => s.status === 'degraded').length,
      unhealthy: statuses.filter(s => s.status === 'unhealthy').length
    };
    
    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (counts.unhealthy > 0) {
      status = 'unhealthy';
    } else if (counts.degraded > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      components: counts
    };
  }
}

/**
 * Create common health check functions for different services
 */
export const HealthChecks = {
  /**
   * Create a database health check
   * 
   * @param connectionFn - Function that tests the database connection
   * @param options - Additional options
   * @returns Health check function
   */
  database(
    connectionFn: () => Promise<any>,
    options: {
      name: string;
      critical?: boolean;
    }
  ): HealthCheckFunction {
    return async () => {
      const startTime = Date.now();
      
      try {
        await connectionFn();
        
        return {
          component: `database:${options.name}`,
          status: 'healthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          component: `database:${options.name}`,
          status: options.critical !== false ? 'unhealthy' : 'degraded',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }
    };
  },
  
  /**
   * Create an API health check
   * 
   * @param endpoint - API endpoint to check
   * @param options - Additional options
   * @returns Health check function
   */
  api(
    endpoint: string,
    options: {
      name: string;
      method?: string;
      timeout?: number;
      expectedStatus?: number;
      headers?: Record<string, string>;
      critical?: boolean;
    }
  ): HealthCheckFunction {
    return async () => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(endpoint, {
          method: options.method || 'GET',
          headers: options.headers || {},
          signal: options.timeout 
            ? AbortSignal.timeout(options.timeout) 
            : undefined
        });
        
        const expectedStatus = options.expectedStatus || 200;
        
        if (response.status !== expectedStatus) {
          return {
            component: `api:${options.name}`,
            status: options.critical !== false ? 'unhealthy' : 'degraded',
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            details: {
              status: response.status,
              statusText: response.statusText,
              expected: expectedStatus
            }
          };
        }
        
        return {
          component: `api:${options.name}`,
          status: 'healthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          details: {
            status: response.status
          }
        };
      } catch (error) {
        return {
          component: `api:${options.name}`,
          status: options.critical !== false ? 'unhealthy' : 'degraded',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }
    };
  },
  
  /**
   * Create a resource health check (CPU, memory, disk)
   * 
   * @param checkFn - Function that checks resource utilization
   * @param options - Additional options
   * @returns Health check function
   */
  resource(
    checkFn: () => Promise<{
      utilization: number;
      details?: Record<string, any>;
    }>,
    options: {
      name: string;
      warnThreshold?: number;
      criticalThreshold?: number;
    }
  ): HealthCheckFunction {
    return async () => {
      const startTime = Date.now();
      const warnThreshold = options.warnThreshold ?? 0.7; // 70%
      const criticalThreshold = options.criticalThreshold ?? 0.9; // 90%
      
      try {
        const { utilization, details } = await checkFn();
        
        let status: 'healthy' | 'degraded' | 'unhealthy';
        
        if (utilization >= criticalThreshold) {
          status = 'unhealthy';
        } else if (utilization >= warnThreshold) {
          status = 'degraded';
        } else {
          status = 'healthy';
        }
        
        return {
          component: `resource:${options.name}`,
          status,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          details: {
            utilization,
            warnThreshold,
            criticalThreshold,
            ...details
          }
        };
      } catch (error) {
        return {
          component: `resource:${options.name}`,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }
    };
  }
};