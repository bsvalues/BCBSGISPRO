import { db } from '../db';
import { auditLogs, type InsertAuditLog } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Audit Logger Service
 * 
 * This service is responsible for recording security-related events to the audit log
 * for compliance and troubleshooting purposes.
 */
class AuditLoggerService {
  /**
   * Log an audit event
   * 
   * @param logData - The audit log data to record
   * @returns The created audit log entry
   */
  async logEvent(logData: InsertAuditLog): Promise<any> {
    try {
      const [logEntry] = await db.insert(auditLogs).values(logData).returning();
      return logEntry;
    } catch (error) {
      console.error('Failed to write to audit log:', error);
      // Still return without throwing to prevent audit log failures from breaking core functionality
      return null;
    }
  }

  /**
   * Log a successful login attempt
   * 
   * @param userId - The ID of the user who logged in
   * @param provider - The authentication provider (email, google, github)
   * @param ipAddress - The IP address of the request
   * @param userAgent - The user agent string from the request
   */
  async logLoginSuccess(
    userId: string,
    provider: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return this.logEvent({
      userId,
      action: 'login_success',
      details: { provider },
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
    });
  }

  /**
   * Log a failed login attempt
   * 
   * @param userId - The attempted user ID (if known)
   * @param reason - The reason for the failure
   * @param ipAddress - The IP address of the request
   * @param userAgent - The user agent string from the request
   */
  async logLoginFailure(
    userId: string | null,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return this.logEvent({
      userId: userId || undefined,
      action: 'login_failure',
      details: { reason },
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
    });
  }

  /**
   * Log a role change event
   * 
   * @param adminId - The ID of the admin who made the change
   * @param targetUserId - The ID of the user whose role was changed
   * @param oldRoles - The previous roles
   * @param newRoles - The new roles
   * @param ipAddress - The IP address of the request
   */
  async logRoleChange(
    adminId: string,
    targetUserId: string,
    oldRoles: string[],
    newRoles: string[],
    ipAddress?: string
  ): Promise<any> {
    return this.logEvent({
      userId: adminId,
      action: 'role_change',
      details: {
        targetUserId,
        oldRoles,
        newRoles,
      },
      ipAddress: ipAddress || '',
    });
  }

  /**
   * Log a password reset request
   * 
   * @param userId - The ID of the user requesting the reset
   * @param ipAddress - The IP address of the request
   * @param userAgent - The user agent string from the request
   */
  async logPasswordResetRequest(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return this.logEvent({
      userId,
      action: 'password_reset_request',
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
    });
  }

  /**
   * Log a password change event
   * 
   * @param userId - The ID of the user who changed their password
   * @param ipAddress - The IP address of the request
   * @param userAgent - The user agent string from the request
   */
  async logPasswordChange(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return this.logEvent({
      userId,
      action: 'password_change',
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
    });
  }

  /**
   * Log user creation
   * 
   * @param adminId - The ID of the admin who created the user
   * @param newUserId - The ID of the created user
   * @param roles - The roles assigned to the user
   * @param ipAddress - The IP address of the request
   */
  async logUserCreation(
    adminId: string,
    newUserId: string,
    roles: string[],
    ipAddress?: string
  ): Promise<any> {
    return this.logEvent({
      userId: adminId,
      action: 'user_creation',
      details: {
        newUserId,
        roles,
      },
      ipAddress: ipAddress || '',
    });
  }

  /**
   * Get recent audit logs for a specific user
   * 
   * @param userId - The ID of the user
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log entries
   */
  async getUserLogs(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
      
      return logs;
    } catch (error) {
      console.error('Failed to retrieve user audit logs:', error);
      return [];
    }
  }

  /**
   * Get all recent audit logs
   * 
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log entries
   */
  async getRecentLogs(limit: number = 100): Promise<any[]> {
    try {
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
      
      return logs;
    } catch (error) {
      console.error('Failed to retrieve recent audit logs:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const auditLogger = new AuditLoggerService();