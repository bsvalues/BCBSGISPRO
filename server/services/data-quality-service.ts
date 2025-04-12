import { calculateDataQualityScore, generateComplianceReport, validateWorkflowCompliance } from '../../shared/validation';
import { IStorage, storage } from '../storage';
import { logger } from '../logger';

/**
 * Service for monitoring and enforcing data quality standards
 */
export class DataQualityService {
  private storage: IStorage;
  
  constructor(storage: IStorage) {
    this.storage = storage;
  }
  
  /**
   * Get all data quality rules with optional filters
   */
  async getRules(dimension?: string, entityType?: string, importance?: string) {
    try {
      // Simulate retrieving data quality rules
      return [{
        id: 1,
        name: "Complete Parcel Information",
        description: "Parcel data must include address, dimensions, and zoning info",
        dimension: "COMPLETENESS",
        entityType: "PARCEL",
        validationLogic: "parcel.address && parcel.dimensions && parcel.zoning",
        importance: "HIGH",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 1
      }, {
        id: 2,
        name: "Non-Null Owner Information",
        description: "Owner information must be complete for all parcels",
        dimension: "COMPLETENESS",
        entityType: "PARCEL",
        validationLogic: "parcel.owner && parcel.ownerType",
        importance: "HIGH",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 1
      }, {
        id: 3,
        name: "Workflow Step Documentation",
        description: "All workflow steps must be documented with proper comments",
        dimension: "COMPLIANCE",
        entityType: "WORKFLOW",
        validationLogic: "workflow.events.every(e => e.description && e.description.length > 10)",
        importance: "MEDIUM",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 1
      }].filter(rule => {
        if (dimension && rule.dimension !== dimension) return false;
        if (entityType && rule.entityType !== entityType) return false;
        if (importance && rule.importance !== importance) return false;
        return true;
      });
    } catch (error) {
      logger.error(`Error retrieving data quality rules: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get a specific data quality rule by ID
   */
  async getRuleById(id: string) {
    try {
      const rules = await this.getRules();
      return rules.find(r => r.id === parseInt(id));
    } catch (error) {
      logger.error(`Error retrieving data quality rule by ID: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a new data quality rule
   */
  async createRule(data: any) {
    try {
      // In a real implementation, this would insert the rule into the database
      return {
        id: Date.now(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error creating data quality rule: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update an existing data quality rule
   */
  async updateRule(id: string, data: any) {
    try {
      // In a real implementation, this would update the rule in the database
      const rule = await this.getRuleById(id);
      if (!rule) {
        throw new Error(`Rule with ID ${id} not found`);
      }
      
      return {
        ...rule,
        ...data,
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error updating data quality rule: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Evaluate a single data quality rule for an entity
   */
  async evaluateRule(ruleId: number, entityType: string, entityId: number, userId?: number) {
    try {
      // Get the rule
      const rule = await this.getRuleById(ruleId.toString());
      if (!rule) {
        throw new Error(`Rule with ID ${ruleId} not found`);
      }
      
      // In a real implementation, fetch the entity data
      // For now, simulate the evaluation
      const passed = Math.random() > 0.3; // 70% chance of passing
      
      // Record the evaluation
      const evaluation = {
        id: Date.now(),
        ruleId,
        entityType,
        entityId,
        evaluatedAt: new Date(),
        passed,
        score: passed ? 100 : Math.floor(Math.random() * 50),
        details: passed ? 'Entity meets the rule criteria' : 'Entity fails to meet the rule criteria',
        evaluatedBy: userId || null
      };
      
      return evaluation;
    } catch (error) {
      logger.error(`Error evaluating rule: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Evaluate all data quality rules for an entity
   */
  async evaluateEntity(entityType: string, entityId: number, userId?: number) {
    try {
      // Get all rules for this entity type
      const rules = await this.getRules(undefined, entityType);
      
      // Evaluate each rule
      const evaluations = await Promise.all(
        rules.map(rule => this.evaluateRule(rule.id, entityType, entityId, userId))
      );
      
      // Calculate overall score
      const totalScore = evaluations.reduce((sum, eval_) => sum + eval_.score, 0);
      const averageScore = evaluations.length > 0 ? totalScore / evaluations.length : 0;
      
      // Generate result
      return {
        entityType,
        entityId,
        evaluatedAt: new Date(),
        rules: rules.length,
        passedRules: evaluations.filter(e => e.passed).length,
        failedRules: evaluations.filter(e => !e.passed).length,
        averageScore,
        evaluations
      };
    } catch (error) {
      logger.error(`Error evaluating entity: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get recent evaluations for an entity
   */
  async getEntityEvaluations(entityType: string, entityId: number, limit: number = 10) {
    try {
      // In a real implementation, this would query the evaluations table
      // For now, return a simulated result
      return [
        {
          id: 1,
          entityType,
          entityId,
          evaluatedAt: new Date(),
          passedRules: 8,
          totalRules: 10,
          averageScore: 85,
          evaluatedBy: 1
        },
        {
          id: 2,
          entityType,
          entityId,
          evaluatedAt: new Date(Date.now() - 86400000), // 1 day ago
          passedRules: 7,
          totalRules: 10,
          averageScore: 75,
          evaluatedBy: 1
        }
      ].slice(0, limit);
    } catch (error) {
      logger.error(`Error getting entity evaluations: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get data quality score for an entity
   */
  async getDataQualityScore(entityType: string, entityId: number) {
    try {
      // In a real implementation, this would query the latest score from the database
      // or calculate it based on the latest evaluation
      // For now, return a simulated result
      return {
        entityType,
        entityId,
        overallScore: 85,
        dimensionScores: {
          COMPLETENESS: 90,
          ACCURACY: 85,
          TIMELINESS: 80,
          CONSISTENCY: 85,
          COMPLIANCE: 95
        },
        passedRules: 17,
        totalRules: 20,
        lastEvaluatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error getting data quality score: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get data quality metrics for an entity type
   */
  async getDataQualityMetrics(entityType: string) {
    try {
      // In a real implementation, this would aggregate metrics from the database
      // For now, return a simulated result
      return {
        entityType,
        totalEntities: 120,
        highQualityEntities: 80,
        mediumQualityEntities: 30,
        lowQualityEntities: 10,
        averageScore: 85,
        dimensionAverages: {
          COMPLETENESS: 88,
          ACCURACY: 82,
          TIMELINESS: 79,
          CONSISTENCY: 84,
          COMPLIANCE: 92
        },
        trendData: [
          { date: new Date(Date.now() - 86400000 * 30), score: 80 }, // 30 days ago
          { date: new Date(Date.now() - 86400000 * 20), score: 82 }, // 20 days ago
          { date: new Date(Date.now() - 86400000 * 10), score: 84 }, // 10 days ago
          { date: new Date(), score: 85 } // Today
        ]
      };
    } catch (error) {
      logger.error(`Error getting data quality metrics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Evaluates a workflow for compliance with Washington State regulations
   * @param workflowId The ID of the workflow to evaluate
   * @returns Compliance report with findings and recommendations
   */
  async evaluateWorkflowCompliance(workflowId: string) {
    const numericId = parseInt(workflowId, 10);
    try {
      // Get the workflow and related data
      const workflow = await this.storage.getWorkflow(numericId);
      if (!workflow) {
        throw new Error(`Workflow with ID ${workflowId} not found`);
      }
      
      // Gather all related data for comprehensive evaluation
      const state = await this.storage.getWorkflowState(numericId);
      const events = await this.storage.getWorkflowEvents(numericId);
      const checklistItems = await this.storage.getChecklistItems(numericId);
      
      // Combine all data for evaluation
      const workflowData = {
        ...workflow,
        state,
        events,
        checklistItems
      };
      
      // Generate compliance report
      const report = generateComplianceReport(workflowData);
      
      // Log compliance issues for auditing
      if (report.overallCompliance !== 'COMPLIANT') {
        logger.info(`Compliance issues detected for workflow ${workflowId} with status ${report.overallCompliance}`);
      }
      
      return report;
    } catch (error) {
      logger.error(`Error evaluating workflow compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  /**
   * Calculates data quality scores for a workflow and its associated documents
   * @param workflowId The ID of the workflow to score
   * @returns Data quality scores and recommendations
   */
  async calculateWorkflowDataQuality(workflowId: string) {
    const numericId = parseInt(workflowId, 10);
    try {
      // Get the workflow
      const workflow = await this.storage.getWorkflow(numericId);
      if (!workflow) {
        throw new Error(`Workflow with ID ${workflowId} not found`);
      }
      
      // Calculate workflow quality score
      const workflowQualityScore = calculateDataQualityScore(workflow, 'WORKFLOW');
      
      // Initialize result object
      const result = {
        workflowQualityScore,
        documentScores: [] as { documentId: string; score: number }[],
        overallQuality: workflowQualityScore,
        recommendations: [] as string[]
      };
      
      // Add recommendations based on workflow score
      if (workflowQualityScore < 70) {
        result.recommendations.push('Improve workflow documentation and completeness');
      }
      
      // Calculate document quality scores if documents exist
      // Note: Document retrieval method might need adjustment based on your API
      /* Uncomment when document relationship methods are available
      const documents = await this.storage.getDocumentsForWorkflow(workflowId);
      
      if (documents && documents.length > 0) {
        let totalDocumentScore = 0;
        
        for (const document of documents) {
          const docScore = calculateDataQualityScore(document, 'DOCUMENT');
          result.documentScores.push({
            documentId: document.id,
            score: docScore
          });
          
          totalDocumentScore += docScore;
          
          // Add document-specific recommendations
          if (docScore < 70) {
            result.recommendations.push(`Improve document quality for "${document.name}"`);
          }
        }
        
        // Calculate average document score
        const avgDocumentScore = totalDocumentScore / documents.length;
        
        // Calculate overall quality as weighted average (60% workflow, 40% documents)
        result.overallQuality = (workflowQualityScore * 0.6) + (avgDocumentScore * 0.4);
      }
      */
      
      return result;
    } catch (error) {
      logger.error(`Error calculating data quality for workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  /**
   * Enforces data validation rules for workflow creation/updates
   * @param workflowData The workflow data to validate
   * @param type The type of workflow
   * @returns Validation result
   */
  validateWorkflowData(workflowData: any, type: string) {
    try {
      return validateWorkflowCompliance(workflowData, type);
    } catch (error) {
      logger.error(`Error validating workflow data of type ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  /**
   * Monitors data quality for all active workflows
   * @returns System-wide data quality metrics
   */
  async monitorSystemDataQuality() {
    try {
      // Get all active workflows
      const workflows = await this.storage.getWorkflows();
      
      // Initialize counters
      let totalWorkflows = workflows.length;
      let compliantWorkflows = 0;
      let nonCompliantWorkflows = 0;
      let needsReviewWorkflows = 0;
      
      // Track workflows with issues for reporting
      const workflowsWithIssues: { id: number; title: string; issues: string[] }[] = [];
      
      // Evaluate each workflow
      for (const workflow of workflows) {
        const report = await this.evaluateWorkflowCompliance(workflow.id.toString());
        
        // Count compliance statuses
        switch (report.overallCompliance) {
          case 'COMPLIANT':
            compliantWorkflows++;
            break;
          case 'NON_COMPLIANT':
            nonCompliantWorkflows++;
            // Track issues
            workflowsWithIssues.push({
              id: workflow.id,
              title: workflow.title,
              issues: report.findings.map(f => f.description)
            });
            break;
          case 'NEEDS_REVIEW':
            needsReviewWorkflows++;
            // Track issues
            workflowsWithIssues.push({
              id: workflow.id,
              title: workflow.title,
              issues: report.findings.map(f => f.description)
            });
            break;
        }
      }
      
      // Calculate compliance percentages
      const complianceRate = totalWorkflows > 0 ? (compliantWorkflows / totalWorkflows) * 100 : 0;
      
      return {
        totalWorkflows,
        complianceRate,
        complianceBreakdown: {
          compliant: compliantWorkflows,
          nonCompliant: nonCompliantWorkflows,
          needsReview: needsReviewWorkflows
        },
        workflowsWithIssues: workflowsWithIssues.slice(0, 10) // Limit to top 10 for report brevity
      };
    } catch (error) {
      logger.error(`Error monitoring system data quality: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

// Create and export a singleton instance of the DataQualityService
export const dataQualityService = new DataQualityService(storage);