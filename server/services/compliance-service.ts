import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { pgTable, serial, varchar, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Since the compliance tables are no longer in the schema, define them here temporarily
// These will eventually need to be moved back to the schema

// Enums
export const complianceStatusEnum = {
  enumValues: ['COMPLIANT', 'NON_COMPLIANT', 'NEEDS_REVIEW', 'EXEMPT', 'NOT_APPLICABLE'] as const
};

export const complianceSeverityEnum = {
  enumValues: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
};

export const complianceCategoryEnum = {
  enumValues: ['ASSESSMENT', 'VALUATION', 'RECORD_KEEPING', 'APPEALS', 'REPORTING'] as const
};

// Tables
export const rcwRequirements = pgTable('rcw_requirements', {
  id: serial('id').primaryKey(),
  rcwCode: varchar('rcw_code', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

export const complianceChecks = pgTable('compliance_checks', {
  id: serial('id').primaryKey(),
  requirementId: integer('requirement_id').notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  lastCheckedAt: timestamp('last_checked_at').notNull(),
  nextCheckDue: timestamp('next_check_due'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
  createdBy: integer('created_by')
});

export const complianceAuditLogs = pgTable('compliance_audit_logs', {
  id: serial('id').primaryKey(),
  checkId: integer('check_id').notNull(),
  oldStatus: varchar('old_status', { length: 20 }),
  newStatus: varchar('new_status', { length: 20 }).notNull(),
  notes: text('notes'),
  performedBy: integer('performed_by'),
  createdAt: timestamp('created_at').defaultNow()
});

// Zod schemas for validation
export const insertRcwRequirementSchema = createInsertSchema(rcwRequirements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertComplianceAuditLogSchema = createInsertSchema(complianceAuditLogs).omit({ id: true, createdAt: true });

// Types using Zod inference
export type InsertRcwRequirement = z.infer<typeof insertRcwRequirementSchema>;
export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;
export type InsertComplianceAuditLog = z.infer<typeof insertComplianceAuditLogSchema>;

// Select types using Drizzle inference
export type RcwRequirement = typeof rcwRequirements.$inferSelect;
export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type ComplianceAuditLog = typeof complianceAuditLogs.$inferSelect;

/**
 * Service for managing Washington RCW compliance requirements and checks
 * 
 * This service handles:
 * 1. RCW requirement definitions
 * 2. Compliance checks against parcels, assessments, and other entities
 * 3. Compliance audit logging
 * 4. Compliance reports and statistics
 */
class ComplianceService {
  /**
   * Get all RCW requirements
   * @param category Optional category filter
   * @param severity Optional severity filter
   * @returns Array of RCW requirements
   */
  async getRequirements(
    category?: typeof complianceCategoryEnum.enumValues[number],
    severity?: typeof complianceSeverityEnum.enumValues[number]
  ): Promise<RcwRequirement[]> {
    let query = db.select().from(rcwRequirements);
    
    if (category) {
      query = query.where(eq(rcwRequirements.category, category));
    }
    
    if (severity) {
      query = query.where(eq(rcwRequirements.severity, severity));
    }
    
    return query.orderBy(rcwRequirements.rcwCode);
  }
  
  /**
   * Get a specific RCW requirement by ID
   * @param id Requirement ID
   * @returns RCW requirement or undefined if not found
   */
  async getRequirementById(id: number): Promise<RcwRequirement | undefined> {
    const [requirement] = await db
      .select()
      .from(rcwRequirements)
      .where(eq(rcwRequirements.id, id));
    
    return requirement;
  }
  
  /**
   * Create a new RCW requirement
   * @param requirement Requirement data
   * @returns Created requirement
   */
  async createRequirement(requirement: InsertRcwRequirement): Promise<RcwRequirement> {
    const [newRequirement] = await db
      .insert(rcwRequirements)
      .values(requirement)
      .returning();
    
    return newRequirement;
  }
  
  /**
   * Update an existing RCW requirement
   * @param id Requirement ID
   * @param updates Partial requirement updates
   * @returns Updated requirement
   */
  async updateRequirement(id: number, updates: Partial<InsertRcwRequirement>): Promise<RcwRequirement> {
    const [updatedRequirement] = await db
      .update(rcwRequirements)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(rcwRequirements.id, id))
      .returning();
    
    if (!updatedRequirement) {
      throw new Error(`Requirement with ID ${id} not found`);
    }
    
    return updatedRequirement;
  }
  
  /**
   * Create a compliance check for an entity
   * @param check Compliance check data
   * @returns Created compliance check
   */
  async createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck> {
    const [newCheck] = await db
      .insert(complianceChecks)
      .values(check)
      .returning();
    
    return newCheck;
  }
  
  /**
   * Get all compliance checks for an entity
   * @param entityType Entity type (PARCEL, ASSESSMENT, etc.)
   * @param entityId Entity ID
   * @returns Array of compliance checks
   */
  async getComplianceChecks(entityType: string, entityId: number): Promise<ComplianceCheck[]> {
    return db
      .select()
      .from(complianceChecks)
      .where(
        and(
          eq(complianceChecks.entityType, entityType),
          eq(complianceChecks.entityId, entityId)
        )
      )
      .orderBy(desc(complianceChecks.lastCheckedAt));
  }
  
  /**
   * Get a specific compliance check by ID
   * @param id Check ID
   * @returns Compliance check or undefined if not found
   */
  async getComplianceCheckById(id: number): Promise<ComplianceCheck | undefined> {
    const [check] = await db
      .select()
      .from(complianceChecks)
      .where(eq(complianceChecks.id, id));
    
    return check;
  }
  
  /**
   * Update a compliance check
   * @param id Check ID
   * @param updates Partial check updates
   * @param userId User ID making the update
   * @param notes Optional notes for the audit log
   * @returns Updated compliance check
   */
  async updateComplianceCheck(
    id: number, 
    updates: Partial<InsertComplianceCheck>,
    userId?: number,
    notes?: string
  ): Promise<ComplianceCheck> {
    // Get the current check to capture the status change for audit log
    const currentCheck = await this.getComplianceCheckById(id);
    if (!currentCheck) {
      throw new Error(`Compliance check with ID ${id} not found`);
    }
    
    // Update the check
    const [updatedCheck] = await db
      .update(complianceChecks)
      .set({
        ...updates,
        lastCheckedAt: updates.lastCheckedAt || new Date(),
        updatedAt: new Date()
      })
      .where(eq(complianceChecks.id, id))
      .returning();
    
    // If status changed, create an audit log entry
    if (updates.status && updates.status !== currentCheck.status) {
      await this.createAuditLog({
        checkId: id,
        oldStatus: currentCheck.status,
        newStatus: updates.status,
        notes,
        performedBy: userId
      });
    }
    
    return updatedCheck;
  }
  
  /**
   * Create an audit log entry for a compliance check
   * @param log Audit log data
   * @returns Created audit log
   */
  async createAuditLog(log: InsertComplianceAuditLog): Promise<ComplianceAuditLog> {
    const [newLog] = await db
      .insert(complianceAuditLogs)
      .values(log)
      .returning();
    
    return newLog;
  }
  
  /**
   * Get audit logs for a compliance check
   * @param checkId Compliance check ID
   * @returns Array of audit logs
   */
  async getAuditLogs(checkId: number): Promise<ComplianceAuditLog[]> {
    return db
      .select()
      .from(complianceAuditLogs)
      .where(eq(complianceAuditLogs.checkId, checkId))
      .orderBy(desc(complianceAuditLogs.createdAt));
  }
  
  /**
   * Evaluate compliance for an entity against a specific requirement
   * @param requirementId Requirement ID
   * @param entityType Entity type (PARCEL, ASSESSMENT, etc)
   * @param entityId Entity ID
   * @param userId User ID performing the evaluation
   * @returns The compliance check result
   */
  async evaluateCompliance(
    requirementId: number,
    entityType: string,
    entityId: number,
    userId?: number
  ): Promise<ComplianceCheck> {
    // Get the requirement
    const requirement = await this.getRequirementById(requirementId);
    if (!requirement) {
      throw new Error(`Requirement with ID ${requirementId} not found`);
    }
    
    // Check if there's an existing check
    const existingChecks = await db
      .select()
      .from(complianceChecks)
      .where(
        and(
          eq(complianceChecks.requirementId, requirementId),
          eq(complianceChecks.entityType, entityType),
          eq(complianceChecks.entityId, entityId)
        )
      );
    
    const existingCheck = existingChecks.length > 0 ? existingChecks[0] : undefined;
    
    // In a real implementation, we would execute the validation logic from the requirement
    // For now, we'll use a placeholder status based on the requirement's severity
    let status: typeof complianceStatusEnum.enumValues[number] = 'NEEDS_REVIEW';
    
    // Placeholder logic - in real system this would evaluate actual validation logic
    // against the entity data
    if (requirement.severity === 'LOW') {
      status = 'COMPLIANT';
    } else if (requirement.severity === 'MEDIUM') {
      // 50% chance of COMPLIANT or NEEDS_REVIEW for demo purposes
      status = Math.random() > 0.5 ? 'COMPLIANT' : 'NEEDS_REVIEW';
    } else {
      // For HIGH and CRITICAL, 33% chance each of COMPLIANT, NEEDS_REVIEW, or NON_COMPLIANT
      const rand = Math.random();
      if (rand < 0.33) {
        status = 'COMPLIANT';
      } else if (rand < 0.66) {
        status = 'NEEDS_REVIEW';
      } else {
        status = 'NON_COMPLIANT';
      }
    }
    
    // Create or update the compliance check
    if (existingCheck) {
      return this.updateComplianceCheck(
        existingCheck.id,
        {
          status,
          lastCheckedAt: new Date(),
          nextCheckDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          details: { lastEvaluated: new Date().toISOString() }
        },
        userId,
        'Automatic re-evaluation'
      );
    } else {
      return this.createComplianceCheck({
        requirementId,
        entityType,
        entityId,
        status,
        lastCheckedAt: new Date(),
        nextCheckDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        details: { initialEvaluation: true },
        createdBy: userId
      });
    }
  }
  
  /**
   * Get entities by type
   * @param entityType Type of entity (PARCEL, ASSESSMENT, etc.)
   * @returns Array of entity IDs
   */
  async getEntitiesByType(entityType: string): Promise<Array<{ id: number }>> {
    // In a real implementation, this would query the appropriate table based on entityType
    // For now, return a mock list of entity IDs for demonstration purposes
    
    // This is a simplified placeholder implementation
    // In production, it would query the correct table based on entityType
    switch (entityType) {
      case 'PARCEL':
        // Mock parcel IDs - in a real implementation, this would query the parcels table
        return [
          { id: 1 },
          { id: 2 },
          { id: 3 }
        ];
      case 'ASSESSMENT':
        // Mock assessment IDs
        return [
          { id: 101 },
          { id: 102 }
        ];
      case 'APPEAL':
        // Mock appeal IDs
        return [
          { id: 201 }
        ];
      default:
        // Return empty array if entity type is unknown
        return [];
    }
  }

  /**
   * Get compliance statistics for an entity
   * @param entityType Entity type (PARCEL, ASSESSMENT, etc)
   * @param entityId Entity ID
   * @returns Compliance statistics
   */
  async getComplianceStats(entityType: string, entityId: number): Promise<{
    total: number;
    compliant: number;
    nonCompliant: number;
    needsReview: number;
    exempt: number;
    notApplicable: number;
    complianceRate: number;
    criticalIssues: number;
    highIssues: number;
  }> {
    // Get all checks for this entity
    const checks = await this.getComplianceChecks(entityType, entityId);
    
    // Count by status
    const stats = {
      total: checks.length,
      compliant: 0,
      nonCompliant: 0,
      needsReview: 0,
      exempt: 0,
      notApplicable: 0,
      complianceRate: 0,
      criticalIssues: 0,
      highIssues: 0
    };
    
    // Process each check
    for (const check of checks) {
      switch (check.status) {
        case 'COMPLIANT':
          stats.compliant++;
          break;
        case 'NON_COMPLIANT':
          stats.nonCompliant++;
          // Get requirement to check severity
          const req = await this.getRequirementById(check.requirementId);
          if (req) {
            if (req.severity === 'CRITICAL') {
              stats.criticalIssues++;
            } else if (req.severity === 'HIGH') {
              stats.highIssues++;
            }
          }
          break;
        case 'NEEDS_REVIEW':
          stats.needsReview++;
          break;
        case 'EXEMPT':
          stats.exempt++;
          break;
        case 'NOT_APPLICABLE':
          stats.notApplicable++;
          break;
      }
    }
    
    // Calculate compliance rate (exclude exempt and not applicable from denominator)
    const relevantChecks = stats.total - stats.exempt - stats.notApplicable;
    stats.complianceRate = relevantChecks > 0 
      ? stats.compliant / relevantChecks 
      : 1.0; // 100% if no relevant checks
    
    return stats;
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();