/**
 * Map Intelligence Agent
 * 
 * This agent is responsible for intelligent map layer recommendations and
 * configurations based on user context, task focus, and data quality requirements.
 * 
 * It analyzes:
 * - User interaction patterns
 * - Current task requirements
 * - Data quality issues in specific geographical areas
 * - Historical layer usage patterns
 * - Washington State regulatory requirements for specific map visualization
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Agent, 
  AgentCapability, 
  AgentRequest, 
  AgentResponse,
  PriorityLevel,
  MasterPrompt,
  AgentEventType
} from '../../../shared/agent-framework';
import { Agent as AgentSchema, AgentEvent, agentEvents } from '../../../shared/agent-schema';
import { db } from '../../db';
import { mapLayers, MapLayer } from '../../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '../../logger';
import { z } from 'zod';

export class MapIntelligenceAgent implements Agent {
  id: string = 'mi-agent-001';
  type = 'MAP_INTELLIGENCE' as const;
  name: string = 'Map Intelligence Agent';
  description: string = 'Intelligent map layer recommendations and customization';
  version: string = '1.0.0';
  capabilities: AgentCapability[];
  isActive: boolean = true;
  
  constructor() {
    // Define agent capabilities
    this.capabilities = [
      {
        id: 'layer-recommendation',
        name: 'Layer Recommendation',
        description: 'Recommends map layers based on context, task, and user role',
        type: 'LAYER_RECOMMENDATION',
        parameters: z.object({
          task: z.string(),
          location: z.object({
            lat: z.number(),
            lng: z.number()
          }).optional(),
          userRole: z.string().optional(),
          dataQualityFocus: z.array(z.string()).optional()
        }),
        requiresAuth: false
      },
      {
        id: 'task-layer-customization',
        name: 'Task-Specific Layer Customization',
        description: 'Customizes map layers for specific tasks',
        type: 'CONTEXT_AWARENESS',
        parameters: z.object({
          taskId: z.string().optional(),
          taskType: z.string(),
          location: z.object({
            lat: z.number(),
            lng: z.number()
          }).optional(),
          dataQualityFocus: z.array(z.string()).optional()
        }),
        requiresAuth: false
      },
      {
        id: 'map-usage-analysis',
        name: 'Map Usage Analysis',
        description: 'Analyzes user map usage patterns',
        type: 'ANALYSIS',
        parameters: z.object({
          userId: z.number(),
          timeframe: z.string().optional()
        }),
        requiresAuth: false
      },
      {
        id: 'data-quality-visualization',
        name: 'Data Quality Visualization',
        description: 'Generates map layers that highlight data quality issues',
        type: 'DATA_QUALITY_VISUALIZATION',
        parameters: z.object({
          areaId: z.string(),
          qualityMetrics: z.array(z.string()),
          threshold: z.number().optional()
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
        case 'GET_LAYER_RECOMMENDATIONS':
          return this.capabilities[0].parameters.safeParse(request.payload).success;
        
        case 'CUSTOMIZE_LAYERS_FOR_TASK':
          return this.capabilities[1].parameters.safeParse(request.payload).success;
        
        case 'ANALYZE_MAP_USAGE':
          return this.capabilities[2].parameters.safeParse(request.payload).success;
        
        case 'HIGHLIGHT_DATA_QUALITY_ISSUES':
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
   * Handle request from the Master Control Program
   */
  async handleRequest(request: AgentRequest): Promise<AgentResponse> {
    const { action, payload, metadata } = request;
    
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
      
      switch (action) {
        case 'GET_LAYER_RECOMMENDATIONS':
          return await this.getLayerRecommendations(payload, metadata);
        case 'CUSTOMIZE_LAYERS_FOR_TASK':
          return await this.customizeLayersForTask(payload, metadata);
        case 'ANALYZE_MAP_USAGE':
          return await this.analyzeMapUsage(payload, metadata);
        case 'HIGHLIGHT_DATA_QUALITY_ISSUES':
          return await this.highlightDataQualityIssues(payload, metadata);
        default:
          return {
            success: false,
            messageId: uuidv4(),
            correlationId: request.metadata?.correlationId,
            error: {
              code: 'UNKNOWN_ACTION',
              message: `Action not supported: ${action}`
            }
          };
      }
    } catch (error) {
      logger.error(`[MapIntelligenceAgent] Error handling request:`, error);
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: request.metadata?.correlationId,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred processing the map intelligence request',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Shut down the agent
   */
  async shutdown(): Promise<void> {
    logger.info(`Shutting down ${this.name} (${this.id})`);
    this.isActive = false;
  }

  /**
   * Get recommended map layers based on user context and task
   */
  private async getLayerRecommendations(payload: any, metadata: any): Promise<AgentResponse> {
    // Extract parameters from payload
    const { task, location, userRole, dataQualityFocus } = payload;
    
    try {
      // Create context-based recommendations
      const recommendations = await this.generateContextBasedRecommendations(
        task, 
        location, 
        userRole, 
        dataQualityFocus
      );
      
      // Log the request and response
      await this.logEvent('LAYER_RECOMMENDATIONS_GENERATED', {
        task,
        location,
        userRole,
        dataQualityFocus,
        recommendationCount: recommendations.length
      });
      
      return {
        success: true,
        messageId: uuidv4(),
        correlationId: metadata?.correlationId,
        data: {
          recommendations
        }
      };
    } catch (error) {
      console.error(`[MapIntelligenceAgent] Error generating layer recommendations:`, error);
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: metadata?.correlationId,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: 'Failed to generate map layer recommendations',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Customize layers for a specific task
   */
  private async customizeLayersForTask(payload: any, metadata: any): Promise<AgentResponse> {
    const { taskId, taskType, location, dataQualityFocus } = payload;
    
    try {
      // Generate custom layer configuration based on task type
      const layerConfigurations = await this.generateTaskSpecificLayerConfiguration(
        taskType,
        location,
        dataQualityFocus
      );
      
      // Log the customization
      await this.logEvent('LAYERS_CUSTOMIZED_FOR_TASK', {
        taskId,
        taskType,
        layerCount: layerConfigurations.length
      });
      
      return {
        success: true,
        messageId: uuidv4(),
        correlationId: metadata?.correlationId,
        data: {
          layerConfigurations,
          taskId
        }
      };
    } catch (error) {
      console.error(`[MapIntelligenceAgent] Error customizing layers for task:`, error);
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: metadata?.correlationId,
        error: {
          code: 'CUSTOMIZATION_ERROR',
          message: 'Failed to customize map layers for task',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Analyze map usage patterns
   */
  private async analyzeMapUsage(payload: any, metadata: any): Promise<AgentResponse> {
    const { userId, timeframe } = payload;
    
    try {
      // Analyze user map usage patterns
      const usageAnalysis = await this.analyzeUserMapUsagePatterns(userId, timeframe);
      
      // Log the analysis
      await this.logEvent('MAP_USAGE_ANALYZED', {
        userId,
        timeframe,
        analysisCompleted: !!usageAnalysis
      });
      
      return {
        success: true,
        messageId: uuidv4(),
        correlationId: metadata?.correlationId,
        data: {
          usageAnalysis,
          recommendedActions: usageAnalysis.recommendedActions
        }
      };
    } catch (error) {
      console.error(`[MapIntelligenceAgent] Error analyzing map usage:`, error);
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: metadata?.correlationId,
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'Failed to analyze map usage patterns',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Highlight data quality issues on map
   */
  private async highlightDataQualityIssues(payload: any, metadata: any): Promise<AgentResponse> {
    const { areaId, qualityMetrics, threshold } = payload;
    
    try {
      // Generate layer configurations that highlight data quality issues
      const qualityLayers = await this.generateDataQualityVisualization(
        areaId,
        qualityMetrics,
        threshold
      );
      
      // Log the quality visualization
      await this.logEvent('DATA_QUALITY_VISUALIZATION_CREATED', {
        areaId,
        qualityMetrics,
        layerCount: qualityLayers.length
      });
      
      return {
        success: true,
        messageId: uuidv4(),
        correlationId: metadata?.correlationId,
        data: {
          qualityLayers,
          summary: {
            totalIssues: qualityLayers.reduce((sum, layer) => sum + (layer.metadata?.issueCount || 0), 0),
            criticalIssues: qualityLayers.reduce((sum, layer) => sum + (layer.metadata?.criticalIssueCount || 0), 0),
            affectedParcels: qualityLayers.reduce((sum, layer) => sum + (layer.metadata?.affectedParcelCount || 0), 0)
          }
        }
      };
    } catch (error) {
      console.error(`[MapIntelligenceAgent] Error highlighting data quality issues:`, error);
      return {
        success: false,
        messageId: uuidv4(),
        correlationId: metadata?.correlationId,
        error: {
          code: 'VISUALIZATION_ERROR',
          message: 'Failed to create data quality visualization',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Generate context-based layer recommendations
   */
  private async generateContextBasedRecommendations(
    task: string,
    location: { lat: number, lng: number } | null,
    userRole: string,
    dataQualityFocus: string[] | null
  ): Promise<any[]> {
    // Fetch all available map layers from database
    const allLayers = await db.select().from(mapLayers);
    
    // Create task-specific layer sets
    const taskLayerMap: Record<string, string[]> = {
      'property_valuation': ['parcels', 'zoning', 'aerial_imagery', 'sales_comparables'],
      'tax_assessment': ['parcels', 'tax_districts', 'schools', 'special_districts'],
      'boundary_dispute': ['parcels', 'surveys', 'plats', 'historical_imagery'],
      'data_quality_review': ['parcels', 'data_quality_heatmap', 'incomplete_records'],
      'compliance_check': ['parcels', 'rcw_compliance_status', 'inspection_status'],
      'general_inquiry': ['parcels', 'roads', 'boundaries']
    };
    
    // Determine which layers to include based on task
    const baseLayerNames = taskLayerMap[task] || ['parcels', 'boundaries'];
    
    // Enhance with role-specific layers
    if (userRole === 'assessor') {
      baseLayerNames.push('valuation_data', 'inspection_status');
    } else if (userRole === 'data_specialist') {
      baseLayerNames.push('data_quality_metrics', 'data_completeness');
    } else if (userRole === 'compliance_officer') {
      baseLayerNames.push('rcw_compliance_status', 'inspection_schedule');
    }
    
    // Add data quality focused layers if requested
    if (dataQualityFocus && dataQualityFocus.length > 0) {
      if (dataQualityFocus.includes('completeness')) {
        baseLayerNames.push('incomplete_records');
      }
      if (dataQualityFocus.includes('accuracy')) {
        baseLayerNames.push('conflicting_boundaries');
      }
      if (dataQualityFocus.includes('timeliness')) {
        baseLayerNames.push('outdated_records');
      }
    }
    
    // Remove duplicates
    const uniqueLayerNames = [...new Set(baseLayerNames)];
    
    // Filter and enhance available layers with recommendations
    const recommendations = allLayers
      .filter(layer => 
        uniqueLayerNames.some(name => 
          layer.name.toLowerCase().includes(name) || 
          (layer.metadata && (layer.metadata as any).tags && 
           (layer.metadata as any).tags.some((tag: string) => tag.toLowerCase().includes(name)))
        )
      )
      .map(layer => ({
        ...layer,
        recommendationReason: this.generateRecommendationReason(layer, task, userRole),
        suggestedOpacity: this.calculateSuggestedOpacity(layer, task),
        suggestedOrder: this.calculateSuggestedOrder(layer, task, uniqueLayerNames),
        relevanceScore: this.calculateRelevanceScore(layer, task, userRole, dataQualityFocus)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return recommendations;
  }

  /**
   * Generate task-specific layer configurations
   */
  private async generateTaskSpecificLayerConfiguration(
    taskType: string,
    location: { lat: number, lng: number } | null,
    dataQualityFocus: string[] | null
  ): Promise<any[]> {
    // Base configurations for different task types
    const taskConfigurations: Record<string, any> = {
      'property_valuation': {
        baseLayers: ['streets', 'parcels'],
        specializedLayers: ['zoning', 'sales_comparables'],
        visibilityDefaults: { 'parcels': true, 'zoning': true, 'sales_comparables': true },
        opacityDefaults: { 'parcels': 100, 'zoning': 70, 'sales_comparables': 85 }
      },
      'data_quality_audit': {
        baseLayers: ['streets', 'parcels'],
        specializedLayers: ['data_quality_heatmap', 'incomplete_records', 'outdated_imagery'],
        visibilityDefaults: { 'parcels': true, 'data_quality_heatmap': true, 'incomplete_records': true },
        opacityDefaults: { 'parcels': 80, 'data_quality_heatmap': 90, 'incomplete_records': 90 }
      },
      'compliance_check': {
        baseLayers: ['streets', 'parcels'],
        specializedLayers: ['rcw_compliance_status', 'inspection_status', 'required_fields'],
        visibilityDefaults: { 'parcels': true, 'rcw_compliance_status': true, 'inspection_status': true },
        opacityDefaults: { 'parcels': 70, 'rcw_compliance_status': 100, 'inspection_status': 90 }
      },
      'boundary_review': {
        baseLayers: ['streets', 'parcels'],
        specializedLayers: ['surveys', 'plats', 'historical_imagery'],
        visibilityDefaults: { 'parcels': true, 'surveys': true, 'plats': true, 'historical_imagery': true },
        opacityDefaults: { 'parcels': 80, 'surveys': 100, 'plats': 90, 'historical_imagery': 50 }
      }
    };
    
    // Get configuration for the specified task type, or use a default
    const taskConfig = taskConfigurations[taskType] || {
      baseLayers: ['streets', 'parcels'],
      specializedLayers: [],
      visibilityDefaults: { 'parcels': true },
      opacityDefaults: { 'parcels': 100 }
    };
    
    // Fetch all required layers from database
    const requiredLayers = [...taskConfig.baseLayers, ...taskConfig.specializedLayers];
    const allLayers = await db.select().from(mapLayers).where(
      sql`LOWER(name) IN (${requiredLayers.map(l => l.toLowerCase())})`
    );
    
    // Generate configurations for each layer
    const layerConfigurations = allLayers.map(layer => {
      const layerName = layer.name.toLowerCase();
      const isBaseLayer = taskConfig.baseLayers.some(bl => layerName.includes(bl.toLowerCase()));
      const isSpecializedLayer = taskConfig.specializedLayers.some(sl => layerName.includes(sl.toLowerCase()));
      
      // Get visibility and opacity defaults
      let visible = false;
      let opacity = 100;
      
      for (const [configName, isVisible] of Object.entries(taskConfig.visibilityDefaults)) {
        if (layerName.includes(configName.toLowerCase())) {
          visible = isVisible as boolean;
          break;
        }
      }
      
      for (const [configName, opacityValue] of Object.entries(taskConfig.opacityDefaults)) {
        if (layerName.includes(configName.toLowerCase())) {
          opacity = opacityValue as number;
          break;
        }
      }
      
      return {
        ...layer,
        visible,
        opacity,
        recommended: isSpecializedLayer,
        isBaseLayer,
        taskRelevance: isSpecializedLayer ? 'high' : (isBaseLayer ? 'medium' : 'low'),
        recommendationReason: this.generateRecommendationReason(layer, taskType, 'assessor'),
        order: isBaseLayer ? 0 : (isSpecializedLayer ? 10 : 20)
      };
    });
    
    // Sort by order (lowest first) and then by isBaseLayer (true first)
    return layerConfigurations.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (a.isBaseLayer && !b.isBaseLayer) return -1;
      if (!a.isBaseLayer && b.isBaseLayer) return 1;
      return 0;
    });
  }

  /**
   * Analyze user map usage patterns
   */
  private async analyzeUserMapUsagePatterns(userId: number, timeframe: string): Promise<any> {
    // In a real implementation, this would analyze map usage logs from the database
    // For demonstration, we'll return a mock analysis
    return {
      userId,
      timeframe,
      mostUsedLayers: [
        { name: 'parcels', usageCount: 42, averageDuration: 120 },
        { name: 'zoning', usageCount: 23, averageDuration: 85 },
        { name: 'aerial_imagery', usageCount: 18, averageDuration: 65 }
      ],
      commonLayerCombinations: [
        { layers: ['parcels', 'zoning'], frequency: 19 },
        { layers: ['parcels', 'aerial_imagery'], frequency: 15 },
        { layers: ['parcels', 'zoning', 'aerial_imagery'], frequency: 12 }
      ],
      areaFocus: [
        { lat: 46.2087, lng: -119.1372, frequency: 28 }
      ],
      recommendedActions: [
        {
          type: 'PRESET_CREATION',
          name: 'Common Valuation View',
          layers: ['parcels', 'zoning', 'aerial_imagery'],
          reason: 'These layers are frequently used together'
        },
        {
          type: 'DEFAULT_UPDATE',
          layers: ['parcels'],
          settings: { opacity: 90, order: 0 },
          reason: 'Most frequently used layer'
        }
      ]
    };
  }

  /**
   * Generate data quality visualization
   */
  private async generateDataQualityVisualization(
    areaId: string,
    qualityMetrics: string[],
    threshold: number
  ): Promise<any[]> {
    // In a real implementation, this would generate layer configurations
    // based on actual data quality metrics from the database
    // For demonstration, we'll return mock layers
    
    // Generate different layers based on quality metrics
    const qualityLayers = [];
    
    if (qualityMetrics.includes('completeness')) {
      qualityLayers.push({
        id: 1001,
        name: 'Data Completeness Issues',
        type: 'vector',
        source: 'data_quality',
        visible: true,
        opacity: 75,
        style: {
          color: '#FF5733',
          weight: 2,
          fillOpacity: 0.4,
          fillColor: '#FF8C66'
        },
        metadata: {
          issueCount: 28,
          criticalIssueCount: 5,
          affectedParcelCount: 15,
          description: 'Areas with incomplete property records'
        }
      });
    }
    
    if (qualityMetrics.includes('accuracy')) {
      qualityLayers.push({
        id: 1002,
        name: 'Boundary Accuracy Issues',
        type: 'vector',
        source: 'data_quality',
        visible: true,
        opacity: 75,
        style: {
          color: '#3366FF',
          weight: 2,
          fillOpacity: 0.4,
          fillColor: '#6699FF'
        },
        metadata: {
          issueCount: 12,
          criticalIssueCount: 3,
          affectedParcelCount: 8,
          description: 'Parcels with potential boundary inaccuracies'
        }
      });
    }
    
    if (qualityMetrics.includes('timeliness')) {
      qualityLayers.push({
        id: 1003,
        name: 'Outdated Records',
        type: 'vector',
        source: 'data_quality',
        visible: true,
        opacity: 75,
        style: {
          color: '#FFCC00',
          weight: 2,
          fillOpacity: 0.4,
          fillColor: '#FFE066'
        },
        metadata: {
          issueCount: 35,
          criticalIssueCount: 0,
          affectedParcelCount: 22,
          description: 'Properties with outdated assessment records'
        }
      });
    }
    
    return qualityLayers;
  }

  /**
   * Generate a human-readable reason for recommending a layer
   */
  private generateRecommendationReason(layer: MapLayer, task: string, userRole: string): string {
    const layerName = layer.name.toLowerCase();
    
    // Task-specific reasons
    if (task === 'property_valuation' && layerName.includes('parcel')) {
      return 'Essential for identifying property boundaries during valuation';
    }
    if (task === 'property_valuation' && layerName.includes('zoning')) {
      return 'Important for understanding land use restrictions affecting property value';
    }
    if (task === 'tax_assessment' && layerName.includes('tax')) {
      return 'Required for accurate tax district identification';
    }
    if (task === 'compliance_check' && layerName.includes('compliance')) {
      return 'Shows current RCW compliance status for properties';
    }
    if (task === 'data_quality_review' && layerName.includes('quality')) {
      return 'Visualizes data quality metrics across the county';
    }
    
    // Role-specific reasons
    if (userRole === 'assessor' && layerName.includes('valuation')) {
      return 'Contains essential valuation data for assessment work';
    }
    if (userRole === 'data_specialist' && layerName.includes('quality')) {
      return 'Highlights data quality issues requiring attention';
    }
    if (userRole === 'compliance_officer' && layerName.includes('compliance')) {
      return 'Shows compliance status with Washington RCW requirements';
    }
    
    // Generic fallback
    return 'Recommended based on current task context';
  }

  /**
   * Calculate suggested opacity for a layer based on task
   */
  private calculateSuggestedOpacity(layer: MapLayer, task: string): number {
    const layerName = layer.name.toLowerCase();
    
    // Primary layers for the task get full opacity
    if (
      (task === 'property_valuation' && (layerName.includes('parcel') || layerName.includes('zoning'))) ||
      (task === 'tax_assessment' && (layerName.includes('parcel') || layerName.includes('tax'))) ||
      (task === 'compliance_check' && (layerName.includes('compliance') || layerName.includes('inspection'))) ||
      (task === 'data_quality_review' && layerName.includes('quality'))
    ) {
      return 100;
    }
    
    // Secondary layers get medium opacity
    if (
      (task === 'property_valuation' && layerName.includes('aerial')) ||
      (task === 'tax_assessment' && layerName.includes('district')) ||
      (task === 'compliance_check' && layerName.includes('required')) ||
      (task === 'data_quality_review' && layerName.includes('incomplete'))
    ) {
      return 75;
    }
    
    // Background layers get low opacity
    if (layerName.includes('base') || layerName.includes('background')) {
      return 50;
    }
    
    // Default opacity
    return 85;
  }

  /**
   * Calculate suggested order for a layer based on task
   */
  private calculateSuggestedOrder(layer: MapLayer, task: string, layerNames: string[]): number {
    const layerName = layer.name.toLowerCase();
    
    // Base layers should be at the bottom (high order number = bottom layer)
    if (layerName.includes('base') || layerName.includes('background')) {
      return 20;
    }
    
    // Reference layers like roads and boundaries
    if (layerName.includes('road') || layerName.includes('street') || layerName.includes('boundary')) {
      return 15;
    }
    
    // Parcels layer
    if (layerName.includes('parcel')) {
      return 10;
    }
    
    // Task-specific focus layers should be near the top
    if (
      (task === 'property_valuation' && (layerName.includes('valuation') || layerName.includes('sales'))) ||
      (task === 'tax_assessment' && layerName.includes('tax')) ||
      (task === 'compliance_check' && layerName.includes('compliance')) ||
      (task === 'data_quality_review' && layerName.includes('quality'))
    ) {
      return 5;
    }
    
    // Default order
    return 8;
  }

  /**
   * Calculate relevance score for sorting recommendations
   */
  private calculateRelevanceScore(
    layer: MapLayer, 
    task: string, 
    userRole: string, 
    dataQualityFocus: string[] | null
  ): number {
    let score = 50; // Base score
    const layerName = layer.name.toLowerCase();
    const metadataTags = (layer.metadata && (layer.metadata as any).tags) ? (layer.metadata as any).tags : [];
    
    // Task relevance
    if (
      (task === 'property_valuation' && (layerName.includes('parcel') || layerName.includes('zoning') || layerName.includes('valuation'))) ||
      (task === 'tax_assessment' && (layerName.includes('tax') || layerName.includes('district'))) ||
      (task === 'compliance_check' && (layerName.includes('compliance') || layerName.includes('inspection'))) ||
      (task === 'data_quality_review' && (layerName.includes('quality') || layerName.includes('incomplete')))
    ) {
      score += 30;
    }
    
    // Role relevance
    if (
      (userRole === 'assessor' && (layerName.includes('valuation') || layerName.includes('assessment'))) ||
      (userRole === 'data_specialist' && (layerName.includes('quality') || layerName.includes('data'))) ||
      (userRole === 'compliance_officer' && (layerName.includes('compliance') || layerName.includes('rcw')))
    ) {
      score += 20;
    }
    
    // Data quality focus relevance
    if (dataQualityFocus && dataQualityFocus.length > 0) {
      for (const focus of dataQualityFocus) {
        if (layerName.includes(focus) || metadataTags.some((tag: string) => tag.includes(focus))) {
          score += 15;
          break;
        }
      }
    }
    
    // Ensure score is between 0 and 100
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Log an agent event
   */
  private async logEvent(eventType: string, data: any): Promise<void> {
    try {
      // Log to agent events table
      await db.insert(agentEvents).values({
        eventType,
        details: data,
        severity: "INFO",
        timestamp: new Date()
      });
      
      console.log(`[MapIntelligenceAgent] Logged event: ${eventType}`);
    } catch (error) {
      console.error(`[MapIntelligenceAgent] Error logging event:`, error);
    }
  }

  /**
   * Receive and process a master prompt
   * 
   * @param prompt The master prompt to process
   * @returns True if the prompt was successfully processed, false otherwise
   */
  async receiveMasterPrompt(prompt: MasterPrompt): Promise<boolean> {
    try {
      logger.info(`[MapIntelligenceAgent] Received master prompt: ${prompt.name} (ID: ${prompt.id})`);
      
      // Store the prompt in the agent's memory
      // In a real implementation, we would store this in a database or memory store
      this.processMasterPromptDirectives(prompt);
      
      // Log receipt of the master prompt
      await this.logEvent('MASTER_PROMPT_RECEIVED', {
        promptId: prompt.id,
        promptName: prompt.name,
        promptVersion: prompt.version,
        timestamp: new Date()
      });
      
      // Return acknowledgment
      return true;
    } catch (error) {
      logger.error(`[MapIntelligenceAgent] Error processing master prompt: ${error}`);
      return false;
    }
  }
  
  /**
   * Confirm acknowledgment of a master prompt
   * 
   * @param promptId The ID of the prompt to acknowledge
   * @returns True if acknowledgment was successful, false otherwise
   */
  async confirmPromptAcknowledgment(promptId: string): Promise<boolean> {
    try {
      logger.info(`[MapIntelligenceAgent] Confirming acknowledgment of master prompt: ${promptId}`);
      
      // Log acknowledgment
      await this.logEvent('MASTER_PROMPT_ACKNOWLEDGED', {
        promptId,
        agentId: this.id,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`[MapIntelligenceAgent] Error confirming prompt acknowledgment: ${error}`);
      return false;
    }
  }
  
  /**
   * Process the directives in a master prompt
   * 
   * @param prompt The master prompt to process
   */
  private processMasterPromptDirectives(prompt: MasterPrompt): void {
    // Extract directives from the prompt content
    // This is a simplified implementation - in a real system, you would parse the prompt
    // content more thoroughly and extract specific directives or parameters
    
    logger.info(`[MapIntelligenceAgent] Processing directives from master prompt: ${prompt.name}`);
    
    // Check if the prompt has parameters that might modify agent behavior
    if (prompt.parameters) {
      // Handle data quality focus parameters
      if (prompt.parameters.dataQualityFocus) {
        logger.info(`[MapIntelligenceAgent] Updating data quality focus: ${prompt.parameters.dataQualityFocus}`);
        // In a real implementation, you would update the agent's behavior accordingly
      }
      
      // Handle layer prioritization parameters
      if (prompt.parameters.layerPriorities) {
        logger.info(`[MapIntelligenceAgent] Updating layer priorities: ${JSON.stringify(prompt.parameters.layerPriorities)}`);
        // In a real implementation, you would update the agent's layer priority logic
      }
      
      // Handle regulatory compliance directives
      if (prompt.parameters.complianceDirectives) {
        logger.info(`[MapIntelligenceAgent] Updating compliance directives: ${JSON.stringify(prompt.parameters.complianceDirectives)}`);
        // In a real implementation, you would update the agent's compliance checking logic
      }
    }
    
    // Parse the content for specific directives
    // This is a very simplified implementation
    if (prompt.content.includes('PRIORITIZE_DATA_QUALITY')) {
      logger.info('[MapIntelligenceAgent] Directive detected: PRIORITIZE_DATA_QUALITY');
      // Implementation would go here
    }
    
    if (prompt.content.includes('ENFORCE_RCW_COMPLIANCE')) {
      logger.info('[MapIntelligenceAgent] Directive detected: ENFORCE_RCW_COMPLIANCE');
      // Implementation would go here
    }
    
    if (prompt.content.includes('HIGHLIGHT_BOUNDARY_DISPUTES')) {
      logger.info('[MapIntelligenceAgent] Directive detected: HIGHLIGHT_BOUNDARY_DISPUTES');
      // Implementation would go here
    }
  }
  
  /**
   * Receive and process a master prompt
   * 
   * @param prompt The master prompt to process
   * @returns True if the prompt was successfully processed, false otherwise
   */
  async receiveMasterPrompt(prompt: MasterPrompt): Promise<boolean> {
    try {
      logger.info(`[MapIntelligenceAgent] Received master prompt: ${prompt.name} (ID: ${prompt.id})`);
      
      // Process the master prompt directives
      this.processMasterPromptDirectives(prompt);
      
      // Log the receipt of the prompt and emit an event
      logger.info(`[MapIntelligenceAgent] Successfully processed master prompt: ${prompt.name}`);
      
      // Record an agent event
      try {
        await db.insert(agentEvents).values({
          agentId: this.id,
          eventType: AgentEventType.MASTER_PROMPT_RECEIVED,
          eventData: {
            promptId: prompt.id,
            promptName: prompt.name
          },
          timestamp: new Date()
        });
      } catch (error) {
        logger.error(`[MapIntelligenceAgent] Error recording prompt event: ${error}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`[MapIntelligenceAgent] Error processing master prompt: ${error}`);
      return false;
    }
  }
  
  /**
   * Confirm acknowledgment of a master prompt
   * 
   * @param promptId The ID of the prompt to acknowledge
   * @returns True if acknowledgment was successful, false otherwise
   */
  async confirmPromptAcknowledgment(promptId: string): Promise<boolean> {
    try {
      logger.info(`[MapIntelligenceAgent] Confirming acknowledgment of master prompt: ${promptId}`);
      
      // Record an agent event for the acknowledgment
      try {
        await db.insert(agentEvents).values({
          agentId: this.id,
          eventType: AgentEventType.MASTER_PROMPT_ACKNOWLEDGED,
          eventData: {
            promptId
          },
          timestamp: new Date()
        });
      } catch (error) {
        logger.error(`[MapIntelligenceAgent] Error recording acknowledgment event: ${error}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`[MapIntelligenceAgent] Error confirming prompt acknowledgment: ${error}`);
      return false;
    }
  }
  
  /**
   * Process the directives in a master prompt
   * 
   * @param prompt The master prompt to process
   */
  private processMasterPromptDirectives(prompt: MasterPrompt): void {
    logger.info(`[MapIntelligenceAgent] Processing directives from master prompt: ${prompt.name}`);
    
    // Check if the prompt has parameters that modify agent behavior
    if (prompt.parameters) {
      // Handle layer visibility parameters
      if (prompt.parameters.layerVisibility) {
        logger.info(`[MapIntelligenceAgent] Updating layer visibility: ${JSON.stringify(prompt.parameters.layerVisibility)}`);
        // Update layer visibility settings
      }
      
      // Handle layer styling parameters
      if (prompt.parameters.layerStyling) {
        logger.info(`[MapIntelligenceAgent] Updating layer styling: ${JSON.stringify(prompt.parameters.layerStyling)}`);
        // Update layer styling settings
      }
      
      // Handle data quality visualization parameters
      if (prompt.parameters.dataQualityVisualization) {
        logger.info(`[MapIntelligenceAgent] Updating data quality visualization: ${JSON.stringify(prompt.parameters.dataQualityVisualization)}`);
        // Update data quality visualization settings
      }
    }
    
    // Parse the content for specific directives
    // This is a simplified implementation - in a real system we would use more sophisticated parsing
    
    if (prompt.content.includes('PRIORITIZE_PARCEL_LAYERS')) {
      logger.info('[MapIntelligenceAgent] Directive detected: PRIORITIZE_PARCEL_LAYERS');
      // Implement parcel layer prioritization
    }
    
    if (prompt.content.includes('HIGHLIGHT_COMPLIANCE_ISSUES')) {
      logger.info('[MapIntelligenceAgent] Directive detected: HIGHLIGHT_COMPLIANCE_ISSUES');
      // Implement compliance issue highlighting
    }
    
    if (prompt.content.includes('ENHANCE_DATA_QUALITY_VISUALIZATION')) {
      logger.info('[MapIntelligenceAgent] Directive detected: ENHANCE_DATA_QUALITY_VISUALIZATION');
      // Implement enhanced data quality visualization
    }
  }
}

export const mapIntelligenceAgent = new MapIntelligenceAgent();