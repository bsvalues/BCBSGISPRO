/**
 * Data Validation Agent
 * 
 * This agent is responsible for validating data quality and enforcing data standards.
 * It works with the data quality framework to run validation rules and generate
 * quality scores for various entities.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Agent,
  AgentCapability,
  AgentRequest,
  AgentResponse,
  PriorityLevel,
  CapabilityEnum
} from '../../../shared/agent-framework';
import { dataQualityService } from '../data-quality-service';
import { logger } from '../../logger';
import { z } from 'zod';

/**
 * Data Validation Agent implementation
 */
export class DataValidationAgent implements Agent {
  id: string = 'dv-agent-001';
  type = 'DATA_VALIDATION' as const;
  name: string = 'Data Validation Agent';
  description: string = 'Validates data quality and enforces data standards';
  version: string = '1.0.0';
  capabilities: AgentCapability[];
  isActive: boolean = true;
  
  constructor() {
    // Define agent capabilities
    this.capabilities = [
      {
        id: 'validation-evaluate-entity',
        name: 'Evaluate Entity',
        description: 'Evaluates all data quality rules for an entity',
        type: 'VALIDATION',
        parameters: z.object({
          entityType: z.string(),
          entityId: z.number()
        }),
        requiresAuth: false
      },
      {
        id: 'validation-evaluate-rule',
        name: 'Evaluate Rule',
        description: 'Evaluates a specific data quality rule for an entity',
        type: 'VALIDATION',
        parameters: z.object({
          ruleId: z.number(),
          entityType: z.string(),
          entityId: z.number()
        }),
        requiresAuth: false
      },
      {
        id: 'validation-get-quality-score',
        name: 'Get Quality Score',
        description: 'Retrieves the data quality score for an entity',
        type: 'ANALYSIS',
        parameters: z.object({
          entityType: z.string(),
          entityId: z.number()
        }),
        requiresAuth: false
      },
      {
        id: 'validation-get-quality-metrics',
        name: 'Get Quality Metrics',
        description: 'Retrieves data quality metrics for an entity type',
        type: 'ANALYSIS',
        parameters: z.object({
          entityType: z.string()
        }),
        requiresAuth: false
      }
    ];
  }
  
  /**
   * Initialize the agent
   */
  async initialize(): Promise<boolean> {
    logger.info(`Initializing ${this.name} (${this.id})`);
    return true;
  }
  
  /**
   * Get the agent capabilities
   */
  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }
  
  /**
   * Handle a request to the agent
   */
  async handleRequest(request: AgentRequest): Promise<AgentResponse> {
    logger.info(`${this.name} handling request: ${request.type} - ${request.action}`);
    
    try {
      // Validate the request
      if (!this.validateRequest(request)) {
        return {
          success: false,
          messageId: uuidv4(),
          correlationId: request.metadata?.correlationId,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request format or parameters'
          }
        };
      }
      
      // Process the request based on the action
      switch (request.action) {
        case 'validate-entity':
          return await this.handleValidateEntity(request);
        
        case 'evaluate-rule':
          return await this.handleEvaluateRule(request);
        
        case 'get-quality-score':
          return await this.handleGetQualityScore(request);
        
        case 'get-quality-metrics':
          return await this.handleGetQualityMetrics(request);
        
        default:
          return {
            success: false,
            messageId: uuidv4(),
            correlationId: request.metadata?.correlationId,
            error: {
              code: 'UNSUPPORTED_ACTION',
              message: `Unsupported action: ${request.action}`
            }
          };
      }
    } catch (error) {
      logger.error(`Error handling request in ${this.name}: ${error}`);
      
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        error: {
          code: 'AGENT_ERROR',
          message: `Error processing request: ${error}`,
          details: error
        }
      };
    }
  }
  
  /**
   * Validate a request to ensure it contains the necessary parameters
   */
  validateRequest(request: AgentRequest): boolean {
    try {
      // Basic validation for all requests
      if (!request.type || !request.action || !request.payload) {
        return false;
      }
      
      // Specific validation based on the action
      switch (request.action) {
        case 'validate-entity':
          return this.capabilities[0].parameters.safeParse(request.payload).success;
        
        case 'evaluate-rule':
          return this.capabilities[1].parameters.safeParse(request.payload).success;
        
        case 'get-quality-score':
          return this.capabilities[2].parameters.safeParse(request.payload).success;
        
        case 'get-quality-metrics':
          return this.capabilities[3].parameters.safeParse(request.payload).success;
        
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Error validating request: ${error}`);
      return false;
    }
  }
  
  /**
   * Handle a request to validate an entity
   */
  private async handleValidateEntity(request: AgentRequest): Promise<AgentResponse> {
    const { entityType, entityId } = request.payload;
    const userId = request.payload.userId;
    
    try {
      const result = await dataQualityService.evaluateEntity(entityType, entityId, userId);
      
      return {
        success: true,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        data: {
          result,
          timestamp: new Date(),
          message: `Successfully evaluated ${entityType} with ID ${entityId}`
        }
      };
    } catch (error) {
      logger.error(`Error evaluating entity: ${error}`);
      
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Error evaluating entity: ${error}`,
          details: error
        }
      };
    }
  }
  
  /**
   * Handle a request to evaluate a specific rule
   */
  private async handleEvaluateRule(request: AgentRequest): Promise<AgentResponse> {
    const { ruleId, entityType, entityId } = request.payload;
    const userId = request.payload.userId;
    
    try {
      const evaluation = await dataQualityService.evaluateRule(ruleId, entityType, entityId, userId);
      
      return {
        success: true,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        data: {
          evaluation,
          timestamp: new Date(),
          message: `Successfully evaluated rule ${ruleId} for ${entityType} with ID ${entityId}`
        }
      };
    } catch (error) {
      logger.error(`Error evaluating rule: ${error}`);
      
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        error: {
          code: 'RULE_EVALUATION_ERROR',
          message: `Error evaluating rule: ${error}`,
          details: error
        }
      };
    }
  }
  
  /**
   * Handle a request to get the quality score for an entity
   */
  private async handleGetQualityScore(request: AgentRequest): Promise<AgentResponse> {
    const { entityType, entityId } = request.payload;
    
    try {
      const score = await dataQualityService.getDataQualityScore(entityType, entityId);
      
      return {
        success: true,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        data: {
          score,
          timestamp: new Date(),
          message: `Successfully retrieved quality score for ${entityType} with ID ${entityId}`
        }
      };
    } catch (error) {
      logger.error(`Error getting quality score: ${error}`);
      
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        error: {
          code: 'QUALITY_SCORE_ERROR',
          message: `Error getting quality score: ${error}`,
          details: error
        }
      };
    }
  }
  
  /**
   * Handle a request to get quality metrics for an entity type
   */
  private async handleGetQualityMetrics(request: AgentRequest): Promise<AgentResponse> {
    const { entityType } = request.payload;
    
    try {
      const metrics = await dataQualityService.getDataQualityMetrics(entityType);
      
      return {
        success: true,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        data: {
          metrics,
          timestamp: new Date(),
          message: `Successfully retrieved quality metrics for ${entityType}`
        }
      };
    } catch (error) {
      logger.error(`Error getting quality metrics: ${error}`);
      
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        error: {
          code: 'QUALITY_METRICS_ERROR',
          message: `Error getting quality metrics: ${error}`,
          details: error
        }
      };
    }
  }
  
  /**
   * Get the current status of the agent
   */
  async getStatus(): Promise<Record<string, any>> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version,
      isActive: this.isActive,
      capabilities: this.capabilities.length,
      status: 'OPERATIONAL',
      lastActivityTimestamp: new Date()
    };
  }
  
  /**
   * Shut down the agent
   */
  async shutdown(): Promise<void> {
    logger.info(`Shutting down ${this.name} (${this.id})`);
    this.isActive = false;
  }
}

// Export singleton instance
export const dataValidationAgent = new DataValidationAgent();