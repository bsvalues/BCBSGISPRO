import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  rcwRequirements, 
  complianceChecks, 
  complianceAuditLogs,
  complianceStatusEnum,
  complianceSeverityEnum,
  complianceCategoryEnum,
  type RcwRequirement,
  type InsertRcwRequirement,
  type ComplianceCheck,
  type InsertComplianceCheck,
  type ComplianceAuditLog,
  type InsertComplianceAuditLog
} from '../../shared/schema';

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