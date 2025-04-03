/**
 * Database resilience utilities
 * 
 * This module provides functions to enhance database connection reliability
 * and provide graceful degradation during database outages.
 */

import { db } from './db';
import { log } from './vite';
import { workflows } from '../shared/schema';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CONNECTION_TIMEOUT_MS = 5000;

// Connection status tracking
let connectionStatus = {
  isConnected: false,
  lastCheck: new Date(),
  failedAttempts: 0,
  lastError: null as Error | null
};

/**
 * Attempts to execute a database operation with retries
 * 
 * @param operation Function that performs the database operation
 * @param retries Number of retries to attempt (default: MAX_RETRIES)
 * @param delay Delay between retries in milliseconds (default: RETRY_DELAY_MS)
 * @returns Result of the database operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS
): Promise<T> {
  try {
    // Set a timeout for the operation
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), CONNECTION_TIMEOUT_MS);
    });
    
    // Race the operation against the timeout
    const result = await Promise.race([operation(), timeoutPromise]) as T;
    
    // Operation succeeded, update status
    connectionStatus.isConnected = true;
    connectionStatus.lastCheck = new Date();
    connectionStatus.failedAttempts = 0;
    connectionStatus.lastError = null;
    
    return result;
  } catch (error) {
    // Update connection status
    connectionStatus.lastCheck = new Date();
    connectionStatus.failedAttempts++;
    connectionStatus.lastError = error instanceof Error ? error : new Error(String(error));
    
    // If we have retries left, wait and try again
    if (retries > 0) {
      log(`Database operation failed, retrying in ${delay}ms (${retries} retries left)`, 'db-resilience');
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay);
    }
    
    // No more retries, set connection status to disconnected
    connectionStatus.isConnected = false;
    
    // Re-throw the error
    throw error;
  }
}

/**
 * Checks the database connection status
 * 
 * @returns True if the database is connected, false otherwise
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await withRetry(async () => {
      // Perform a simple query to check connection
      await db.select().from(workflows).limit(1);
    }, 1); // Just one retry for a status check
    
    return true;
  } catch (error) {
    log(`Database connection check failed: ${error instanceof Error ? error.message : String(error)}`, 'db-resilience');
    return false;
  }
}

/**
 * Gets the current database connection status
 */
export function getDatabaseStatus() {
  return {
    ...connectionStatus,
    // Convert lastError to a string if it exists
    lastError: connectionStatus.lastError ? connectionStatus.lastError.message : null
  };
}

/**
 * Attempts to reconnect to the database
 * 
 * @returns True if reconnection was successful, false otherwise
 */
export async function attemptReconnect(): Promise<boolean> {
  try {
    log('Attempting to reconnect to database...', 'db-resilience');
    const connected = await checkDatabaseConnection();
    log(connected ? 'Database reconnection successful' : 'Database reconnection failed', 'db-resilience');
    return connected;
  } catch (error) {
    log(`Database reconnection attempt failed: ${error instanceof Error ? error.message : String(error)}`, 'db-resilience');
    return false;
  }
}