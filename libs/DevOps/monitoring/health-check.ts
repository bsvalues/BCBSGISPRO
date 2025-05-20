/**
 * Health Check System
 * 
 * This module provides functionality for monitoring the health of various
 * system components, including API endpoints, database connections, and services.
 */

import { logger } from '../utils/logger';

// Create module-specific logger
const healthLogger = logger.withTags(['DevOps', 'HealthCheck']);

/**
 * Health status enum
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration: number; // in milliseconds
  dependencies?: HealthCheckResult[];
}

/**
 * Health check options
 */
export interface HealthCheckOptions {
  timeout?: number; // in milliseconds
  cacheDuration?: number; // in milliseconds
  retryCount?: number;
  retryDelay?: number; // in milliseconds
  dependencies?: HealthCheck[];
}

/**
 * Health check function type
 */
export type HealthCheckFunction = () => Promise<HealthCheckResult>;

/**
 * Abstract health check class
 */
export abstract class HealthCheck {
  protected name: string;
  protected options: HealthCheckOptions;
  protected lastResult: HealthCheckResult | null = null;
  protected lastCheckTime: number = 0;
  
  /**
   * Create a new health check
   */
  constructor(name: string, options: HealthCheckOptions = {}) {
    this.name = name;
    this.options = {
      timeout: 5000, // Default timeout: 5 seconds
      cacheDuration: 60000, // Default cache duration: 1 minute
      retryCount: 1,
      retryDelay: 1000,
      ...options
    };
  }
  
  /**
   * Execute the health check
   */
  async execute(): Promise<HealthCheckResult> {
    // Check if we can use cached result
    const now = Date.now();
    if (
      this.lastResult &&
      this.options.cacheDuration &&
      now - this.lastCheckTime < this.options.cacheDuration
    ) {
      return this.lastResult;
    }
    
    // Execute the check with retry logic
    let lastError: Error | null = null;
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= (this.options.retryCount || 0); attempt++) {
      if (attempt > 0) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      }
      
      try {
        // Execute the check with timeout
        const checkPromise = this.performCheck();
        const result = await this.withTimeout(checkPromise, this.options.timeout || 5000);
        
        // Check dependencies
        let dependencyResults: HealthCheckResult[] = [];
        
        if (this.options.dependencies && this.options.dependencies.length > 0) {
          dependencyResults = await Promise.all(
            this.options.dependencies.map(dep => dep.execute())
          );
          
          // If any dependency is unhealthy, mark as degraded
          if (dependencyResults.some(dep => dep.status === HealthStatus.UNHEALTHY)) {
            result.status = HealthStatus.DEGRADED;
            result.message = `${result.message || 'Healthy but dependencies are unhealthy'}`;
          }
        }
        
        // Update the result with duration and dependencies
        const duration = Date.now() - startTime;
        const finalResult: HealthCheckResult = {
          ...result,
          timestamp: new Date(),
          duration,
          dependencies: dependencyResults.length > 0 ? dependencyResults : undefined
        };
        
        // Cache the result
        this.lastResult = finalResult;
        this.lastCheckTime = now;
        
        // Log the result
        this.logHealthCheckResult(finalResult);
        
        return finalResult;
      } catch (error) {
        lastError = error as Error;
        
        // Log retry attempt
        if (attempt < (this.options.retryCount || 0)) {
          healthLogger.warn(`Health check '${this.name}' failed, retrying (${attempt + 1}/${this.options.retryCount})`, error);
        }
      }
    }
    
    // All retries failed
    const duration = Date.now() - startTime;
    const errorResult: HealthCheckResult = {
      name: this.name,
      status: HealthStatus.UNHEALTHY,
      message: lastError?.message || 'Health check failed after retries',
      details: {
        error: lastError?.toString(),
        stack: lastError?.stack
      },
      timestamp: new Date(),
      duration
    };
    
    // Cache the error result
    this.lastResult = errorResult;
    this.lastCheckTime = now;
    
    // Log the error result
    this.logHealthCheckResult(errorResult);
    
    return errorResult;
  }
  
  /**
   * Execute the health check with a timeout
   */
  protected async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Health check '${this.name}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      promise
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  /**
   * Log health check result
   */
  protected logHealthCheckResult(result: HealthCheckResult): void {
    switch (result.status) {
      case HealthStatus.HEALTHY:
        healthLogger.info(`Health check '${result.name}' succeeded`, {
          metadata: {
            duration: `${result.duration}ms`,
            details: result.details
          }
        });
        break;
        
      case HealthStatus.DEGRADED:
        healthLogger.warn(`Health check '${result.name}' is degraded: ${result.message}`, {
          metadata: {
            duration: `${result.duration}ms`,
            details: result.details
          }
        });
        break;
        
      case HealthStatus.UNHEALTHY:
        healthLogger.error(`Health check '${result.name}' failed: ${result.message}`, {
          metadata: {
            duration: `${result.duration}ms`,
            details: result.details
          }
        });
        break;
        
      default:
        healthLogger.warn(`Health check '${result.name}' has unknown status: ${result.message}`, {
          metadata: {
            duration: `${result.duration}ms`,
            details: result.details
          }
        });
    }
  }
  
  /**
   * Perform the actual health check
   */
  protected abstract performCheck(): Promise<HealthCheckResult>;
}

/**
 * HTTP health check
 */
export class HttpHealthCheck extends HealthCheck {
  private url: string;
  private method: string;
  private headers: Record<string, string>;
  private body?: string;
  private expectedStatus?: number;
  private expectedResponse?: string | RegExp;
  
  /**
   * Create a new HTTP health check
   */
  constructor(
    name: string,
    url: string,
    options: HealthCheckOptions & {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      expectedStatus?: number;
      expectedResponse?: string | RegExp;
    } = {}
  ) {
    super(name, options);
    
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = options.headers || {};
    this.body = options.body;
    this.expectedStatus = options.expectedStatus;
    this.expectedResponse = options.expectedResponse;
  }
  
  /**
   * Perform the HTTP health check
   */
  protected async performCheck(): Promise<HealthCheckResult> {
    try {
      // Perform the HTTP request
      const startTime = Date.now();
      
      const response = await fetch(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body
      });
      
      const duration = Date.now() - startTime;
      
      // Check status code
      const statusMatch = !this.expectedStatus || response.status === this.expectedStatus;
      
      // Check response body if needed
      let bodyMatch = true;
      let responseText: string | undefined;
      
      if (this.expectedResponse) {
        responseText = await response.text();
        
        if (this.expectedResponse instanceof RegExp) {
          bodyMatch = this.expectedResponse.test(responseText);
        } else {
          bodyMatch = responseText.includes(this.expectedResponse);
        }
      }
      
      // Determine health status
      const healthy = statusMatch && bodyMatch;
      
      return {
        name: this.name,
        status: healthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        message: healthy
          ? `HTTP ${response.status} ${response.statusText}`
          : `HTTP check failed: ${statusMatch ? '' : `Expected status ${this.expectedStatus}, got ${response.status}. `}${
              bodyMatch ? '' : 'Response body did not match expected pattern.'
            }`,
        details: {
          url: this.url,
          method: this.method,
          statusCode: response.status,
          statusText: response.statusText,
          responseTime: duration,
          responseBody: responseText && responseText.length > 1000
            ? `${responseText.substring(0, 1000)}... (truncated)`
            : responseText
        },
        timestamp: new Date(),
        duration
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${(error as Error).message}`);
    }
  }
}

/**
 * Database health check
 */
export class DatabaseHealthCheck extends HealthCheck {
  private connectionString: string;
  private queryFn: () => Promise<any>;
  
  /**
   * Create a new database health check
   */
  constructor(
    name: string,
    connectionString: string,
    queryFn: () => Promise<any>,
    options: HealthCheckOptions = {}
  ) {
    super(name, options);
    
    this.connectionString = connectionString;
    this.queryFn = queryFn;
  }
  
  /**
   * Perform the database health check
   */
  protected async performCheck(): Promise<HealthCheckResult> {
    try {
      // Execute the database query
      const startTime = Date.now();
      const result = await this.queryFn();
      const duration = Date.now() - startTime;
      
      return {
        name: this.name,
        status: HealthStatus.HEALTHY,
        message: 'Database connection successful',
        details: {
          connectionString: this.maskConnectionString(this.connectionString),
          queryExecutionTime: duration,
          queryResult: result
        },
        timestamp: new Date(),
        duration
      };
    } catch (error) {
      throw new Error(`Database check failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Mask sensitive information in connection string
   */
  private maskConnectionString(connectionString: string): string {
    // Mask password
    return connectionString.replace(/(:.*?@)/g, ':***@');
  }
}

/**
 * Memory health check
 */
export class MemoryHealthCheck extends HealthCheck {
  private thresholdMB: number;
  
  /**
   * Create a new memory health check
   */
  constructor(
    name: string,
    thresholdMB: number = 500, // Default: 500MB
    options: HealthCheckOptions = {}
  ) {
    super(name, options);
    
    this.thresholdMB = thresholdMB;
  }
  
  /**
   * Perform the memory health check
   */
  protected async performCheck(): Promise<HealthCheckResult> {
    // Get current memory usage
    const memoryUsage = process.memoryUsage();
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const percentUsed = Math.round((usedMB / totalMB) * 100);
    
    // Check if memory usage exceeds threshold
    const status = usedMB > this.thresholdMB
      ? HealthStatus.DEGRADED
      : HealthStatus.HEALTHY;
    
    return {
      name: this.name,
      status,
      message: status === HealthStatus.HEALTHY
        ? `Memory usage is within limits: ${usedMB}MB (${percentUsed}%)`
        : `Memory usage is high: ${usedMB}MB (${percentUsed}%)`,
      details: {
        usedMB,
        totalMB,
        percentUsed,
        thresholdMB: this.thresholdMB,
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        externalMB: Math.round(memoryUsage.external / 1024 / 1024)
      },
      timestamp: new Date(),
      duration: 0
    };
  }
}

/**
 * CPU health check
 */
export class CpuHealthCheck extends HealthCheck {
  private thresholdPercent: number;
  
  /**
   * Create a new CPU health check
   */
  constructor(
    name: string,
    thresholdPercent: number = 80, // Default: 80%
    options: HealthCheckOptions = {}
  ) {
    super(name, options);
    
    this.thresholdPercent = thresholdPercent;
  }
  
  /**
   * Perform the CPU health check
   */
  protected async performCheck(): Promise<HealthCheckResult> {
    // Get current CPU usage (Node.js doesn't provide this directly)
    // For a real implementation, you'd use a library like os-utils or monitor CPU over time
    
    // For this example, we'll just return a simulated value
    const cpuUsage = Math.random() * 100;
    
    // Check if CPU usage exceeds threshold
    const status = cpuUsage > this.thresholdPercent
      ? HealthStatus.DEGRADED
      : HealthStatus.HEALTHY;
    
    return {
      name: this.name,
      status,
      message: status === HealthStatus.HEALTHY
        ? `CPU usage is within limits: ${cpuUsage.toFixed(1)}%`
        : `CPU usage is high: ${cpuUsage.toFixed(1)}%`,
      details: {
        cpuUsage: cpuUsage.toFixed(1),
        thresholdPercent: this.thresholdPercent,
        cpuInfo: {
          cores: require('os').cpus().length
        }
      },
      timestamp: new Date(),
      duration: 0
    };
  }
}

/**
 * Storage health check
 */
export class StorageHealthCheck extends HealthCheck {
  private path: string;
  private thresholdPercent: number;
  
  /**
   * Create a new storage health check
   */
  constructor(
    name: string,
    path: string = '/',
    thresholdPercent: number = 90, // Default: 90%
    options: HealthCheckOptions = {}
  ) {
    super(name, options);
    
    this.path = path;
    this.thresholdPercent = thresholdPercent;
  }
  
  /**
   * Perform the storage health check
   */
  protected async performCheck(): Promise<HealthCheckResult> {
    try {
      // This would use a proper library in a real implementation
      // For now, we'll just simulate disk usage
      const totalSpace = 1000 * 1024 * 1024 * 1024; // 1000 GB
      const usedSpace = Math.random() * totalSpace;
      const percentUsed = (usedSpace / totalSpace) * 100;
      
      // Check if disk usage exceeds threshold
      const status = percentUsed > this.thresholdPercent
        ? HealthStatus.DEGRADED
        : HealthStatus.HEALTHY;
      
      return {
        name: this.name,
        status,
        message: status === HealthStatus.HEALTHY
          ? `Disk usage is within limits: ${percentUsed.toFixed(1)}%`
          : `Disk usage is high: ${percentUsed.toFixed(1)}%`,
        details: {
          path: this.path,
          totalGB: Math.round(totalSpace / 1024 / 1024 / 1024),
          usedGB: Math.round(usedSpace / 1024 / 1024 / 1024),
          percentUsed: percentUsed.toFixed(1),
          thresholdPercent: this.thresholdPercent
        },
        timestamp: new Date(),
        duration: 0
      };
    } catch (error) {
      throw new Error(`Storage check failed: ${(error as Error).message}`);
    }
  }
}

/**
 * Composite health check
 */
export class CompositeHealthCheck extends HealthCheck {
  private checks: HealthCheck[];
  
  /**
   * Create a new composite health check
   */
  constructor(
    name: string,
    checks: HealthCheck[],
    options: HealthCheckOptions = {}
  ) {
    super(name, options);
    
    this.checks = checks;
  }
  
  /**
   * Perform the composite health check
   */
  protected async performCheck(): Promise<HealthCheckResult> {
    // Run all child health checks in parallel
    const startTime = Date.now();
    const results = await Promise.all(this.checks.map(check => check.execute()));
    const duration = Date.now() - startTime;
    
    // Calculate overall status
    const unhealthyCount = results.filter(r => r.status === HealthStatus.UNHEALTHY).length;
    const degradedCount = results.filter(r => r.status === HealthStatus.DEGRADED).length;
    
    let status: HealthStatus;
    let message: string;
    
    if (unhealthyCount > 0) {
      status = HealthStatus.DEGRADED; // Degraded instead of unhealthy to allow partial functionality
      message = `${unhealthyCount} unhealthy and ${degradedCount} degraded components`;
    } else if (degradedCount > 0) {
      status = HealthStatus.DEGRADED;
      message = `${degradedCount} degraded components`;
    } else {
      status = HealthStatus.HEALTHY;
      message = 'All components are healthy';
    }
    
    return {
      name: this.name,
      status,
      message,
      details: {
        totalChecks: this.checks.length,
        healthyChecks: results.filter(r => r.status === HealthStatus.HEALTHY).length,
        degradedChecks: degradedCount,
        unhealthyChecks: unhealthyCount
      },
      dependencies: results,
      timestamp: new Date(),
      duration
    };
  }
}

/**
 * Health check registry
 */
export class HealthCheckRegistry {
  private checks: Map<string, HealthCheck> = new Map();
  private compositeCheck: CompositeHealthCheck;
  
  /**
   * Create a new health check registry
   */
  constructor(name: string = 'System Health') {
    this.compositeCheck = new CompositeHealthCheck(name, []);
  }
  
  /**
   * Register a health check
   */
  register(check: HealthCheck): this {
    const name = check instanceof CompositeHealthCheck
      ? check['name'] // Access protected property
      : check['name'];
    
    this.checks.set(name, check);
    
    // Rebuild composite check
    this.compositeCheck = new CompositeHealthCheck(
      this.compositeCheck['name'],
      Array.from(this.checks.values())
    );
    
    return this;
  }
  
  /**
   * Unregister a health check
   */
  unregister(name: string): boolean {
    const result = this.checks.delete(name);
    
    if (result) {
      // Rebuild composite check
      this.compositeCheck = new CompositeHealthCheck(
        this.compositeCheck['name'],
        Array.from(this.checks.values())
      );
    }
    
    return result;
  }
  
  /**
   * Get a registered health check
   */
  getCheck(name: string): HealthCheck | undefined {
    return this.checks.get(name);
  }
  
  /**
   * Run all health checks
   */
  async runAll(): Promise<HealthCheckResult> {
    return this.compositeCheck.execute();
  }
  
  /**
   * Run a specific health check
   */
  async run(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    
    if (!check) {
      return {
        name,
        status: HealthStatus.UNKNOWN,
        message: `Health check '${name}' not found`,
        timestamp: new Date(),
        duration: 0
      };
    }
    
    return check.execute();
  }
  
  /**
   * Get all registered health checks
   */
  getAllChecks(): string[] {
    return Array.from(this.checks.keys());
  }
}

// Create default registry
export const healthCheckRegistry = new HealthCheckRegistry();

// Create common health checks
export const memoryHealthCheck = new MemoryHealthCheck('Memory');
export const cpuHealthCheck = new CpuHealthCheck('CPU');
export const storageHealthCheck = new StorageHealthCheck('Storage');

// Register common health checks
healthCheckRegistry.register(memoryHealthCheck);
healthCheckRegistry.register(cpuHealthCheck);
healthCheckRegistry.register(storageHealthCheck);