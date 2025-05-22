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
   * Log workflow start event
   * 
   * @param userId - The ID of the user who started the workflow
   * @param workflowId - The ID of the workflow
   * @param parcelId - The ID of the associated parcel
   * @param workflowType - The type of workflow (assessment, appeal, split, etc.)
   * @param ipAddress - The IP address of the request
   */
  async logWorkflowStart(
    userId: string,
    workflowId: string,
    parcelId: string,
    workflowType: string,
    ipAddress?: string
  ): Promise<any> {
    return this.logEvent({
      userId,
      action: 'workflow_start',
      details: {
        workflowId,
        parcelId,
        workflowType
      },
      ipAddress: ipAddress || '',
    });
  }

  /**
   * Log workflow update event
   * 
   * @param userId - The ID of the user who updated the workflow
   * @param workflowId - The ID of the workflow
   * @param updateType - The type of update (status change, assignment, etc.)
   * @param details - Additional details about the update
   * @param ipAddress - The IP address of the request
   */
  async logWorkflowUpdate(
    userId: string,
    workflowId: string,
    updateType: string,
    details: any,
    ipAddress?: string
  ): Promise<any> {
    return this.logEvent({
      userId,
      action: 'workflow_update',
      details: {
        workflowId,
        updateType,
        ...details
      },
      ipAddress: ipAddress || '',
    });
  }

  /**
   * Log document upload event
   * 
   * @param userId - The ID of the user who uploaded the document
   * @param documentId - The ID of the document
   * @param documentType - The type of document (deed, plat, survey, etc.)
   * @param parcelId - The ID of the associated parcel (if any)
   * @param workflowId - The ID of the associated workflow (if any)
   * @param ipAddress - The IP address of the request
   */
  async logDocumentUpload(
    userId: string,
    documentId: string,
    documentType: string,
    parcelId?: string,
    workflowId?: string,
    ipAddress?: string
  ): Promise<any> {
    return this.logEvent({
      userId,
      action: 'document_upload',
      details: {
        documentId,
        documentType,
        parcelId,
        workflowId
      },
      ipAddress: ipAddress || '',
    });
  }

  /**
   * Log map interaction event
   * 
   * @param userId - The ID of the user who interacted with the map
   * @param interactionType - The type of interaction (pan, zoom, feature select, etc.)
   * @param details - Additional details about the interaction
   * @param ipAddress - The IP address of the request
   */
  async logMapInteraction(
    userId: string,
    interactionType: string,
    details: any,
    ipAddress?: string
  ): Promise<any> {
    return this.logEvent({
      userId,
      action: 'map_interaction',
      details: {
        interactionType,
        ...details
      },
      ipAddress: ipAddress || '',
    });
  }

  /**
   * Log permission denial event
   * 
   * @param userId - The ID of the user who was denied
   * @param resourceType - The type of resource (page, api, action)
   * @param resourceId - The ID of the specific resource
   * @param requiredPermission - The permission that was required
   * @param ipAddress - The IP address of the request
   */
  async logPermissionDenial(
    userId: string,
    resourceType: string,
    resourceId: string,
    requiredPermission: string,
    ipAddress?: string
  ): Promise<any> {
    return this.logEvent({
      userId,
      action: 'permission_denied',
      details: {
        resourceType,
        resourceId,
        requiredPermission
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

  /**
   * Get logs filtered by various criteria
   * 
   * @param options - Filter options
   * @returns Array of filtered audit log entries
   */
  async getFilteredLogs(options: {
    userId?: string,
    action?: string | string[],
    parcelId?: string,
    workflowId?: string,
    documentId?: string, 
    fromDate?: Date,
    toDate?: Date,
    limit?: number
  }): Promise<any[]> {
    try {
      const { 
        userId, 
        action, 
        parcelId, 
        workflowId, 
        documentId,
        fromDate,
        toDate,
        limit = 100 
      } = options;
      
      let query = db.select().from(auditLogs);
      
      // Apply filters
      if (userId) {
        query = query.where(eq(auditLogs.userId, userId));
      }
      
      if (action) {
        if (Array.isArray(action)) {
          // If multiple actions are provided, use "in" operator
          query = query.where(auditLogs.action.in(action));
        } else {
          query = query.where(eq(auditLogs.action, action));
        }
      }
      
      // For filtering by parcel, workflow, or document, we need to check the JSON details
      // This is a basic approach and might need optimization depending on DB setup
      if (parcelId || workflowId || documentId) {
        const filters = [];
        
        if (parcelId) {
          filters.push(`details->>'parcelId' = '${parcelId}'`);
        }
        
        if (workflowId) {
          filters.push(`details->>'workflowId' = '${workflowId}'`);
        }
        
        if (documentId) {
          filters.push(`details->>'documentId' = '${documentId}'`);
        }
        
        if (filters.length > 0) {
          const sqlFilter = filters.join(' OR ');
          query = query.where(sql\`\${sqlFilter}\`);
        }
      }
      
      // Date range filters
      if (fromDate) {
        query = query.where(auditLogs.createdAt, '>=', fromDate);
      }
      
      if (toDate) {
        query = query.where(auditLogs.createdAt, '<=', toDate);
      }
      
      // Apply ordering and limit
      query = query.orderBy(desc(auditLogs.createdAt)).limit(limit);
      
      const logs = await query;
      return logs;
    } catch (error) {
      console.error('Failed to retrieve filtered audit logs:', error);
      return [];
    }
  }
  
  /**
   * Export audit logs to CSV format
   * 
   * @param logs - Array of audit log entries to export
   * @returns CSV string
   */
  exportLogsToCSV(logs: any[]): string {
    if (!logs || logs.length === 0) {
      return 'id,user_id,action,details,ip_address,user_agent,created_at\n';
    }
    
    // Create CSV header
    const headers = Object.keys(logs[0]).join(',');
    
    // Create CSV rows
    const rows = logs.map(log => {
      return Object.values(log).map(value => {
        // Handle JSON details
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Handle string values
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    return [headers, ...rows].join('\n');
  }
}

// Export a singleton instance
export const auditLogger = new AuditLoggerService();