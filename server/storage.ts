import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  users, 
  mapBookmarks,
  mapPreferences,
  recentlyViewedParcels,
  arcgisMapConfigs,
  arcgisLayers,
  arcgisSketches,
  arcgisAnalysisResults,
  workflows,
  workflowEvents,
  workflowStates,
  checklistItems,
  dataQualityRules,
  dataQualityEvaluations,
  dataQualityScores,
  parcels,
  documents,
  documentParcelLinks,
  documentParcelRelationships,
  type User,
  type InsertUser,
  type MapBookmark,
  type InsertMapBookmark,
  type MapPreference,
  type InsertMapPreference,
  type RecentlyViewedParcel,
  type InsertRecentlyViewedParcel,
  type ArcGISMapConfig,
  type InsertArcGISMapConfig,
  type ArcGISLayer,
  type InsertArcGISLayer,
  type ArcGISSketch,
  type InsertArcGISSketch,
  type ArcGISAnalysisResult,
  type InsertArcGISAnalysisResult,
  type Workflow,
  type InsertWorkflow,
  type WorkflowEvent,
  type InsertWorkflowEvent,
  type WorkflowState,
  type InsertWorkflowState,
  type ChecklistItem,
  type InsertChecklistItem,
  type DataQualityRule,
  type InsertDataQualityRule,
  type DataQualityEvaluation,
  type InsertDataQualityEvaluation,
  type DataQualityScore,
  type InsertDataQualityScore,
  type Parcel,
  type InsertParcel,
  type Document,
  type InsertDocument,
  type DocumentParcelRelationship,
  type InsertDocumentParcelRelationship
} from '../shared/schema';

import {
  documentEntities,
  documentLineageEvents,
  documentRelationships,
  documentProcessingStages,
  type DocumentEntity,
  type DocumentLineageEvent,
  type DocumentRelationship,
  type DocumentProcessingStage,
  type InsertDocumentEntity,
  type InsertDocumentLineageEvent,
  type InsertDocumentRelationship,
  type InsertDocumentProcessingStage
} from '../shared/schema';

import { documentLineageStorage } from './document-lineage-storage';

// Type for document lineage graph structure
export interface DocumentLineageGraph {
  nodes: DocumentEntity[];
  edges: DocumentRelationship[];
  metadata: {
    rootDocumentId: string;
    depth: number;
    totalNodes: number;
    totalEdges: number;
  };
}

// Define the interface that all storage implementations must implement
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Parcel operations
  getParcelByNumber(parcelNumber: string): Promise<Parcel | undefined>;
  getParcelById(id: number): Promise<Parcel | undefined>; 
  getParcelInfo(id: number): Promise<Parcel | undefined>;
  createParcel(parcel: InsertParcel): Promise<Parcel>;
  searchParcelsByAddress(address: string): Promise<Parcel[]>;
  searchParcelsByNumber(parcelNumber: string): Promise<Parcel[]>;
  getAllParcels(): Promise<Parcel[]>;
  
  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(filter?: any): Promise<Document[]>;
  getDocumentsForParcel(parcelId: number): Promise<Document[]>;
  
  // Document Parcel Link operations
  getDocumentParcelLink(documentId: number, parcelId: number): Promise<any | undefined>;
  createDocumentParcelLink(link: any): Promise<any>;
  removeDocumentParcelLinks(documentId: number): Promise<boolean>;
  getParcelsForDocument(documentId: number): Promise<Parcel[]>;
  
  // Document-Parcel Relationship operations
  getDocumentParcelRelationship(id: number): Promise<DocumentParcelRelationship | undefined>;
  getDocumentParcelRelationshipByDocumentAndParcel(documentId: number, parcelId: number, relationshipType?: string): Promise<DocumentParcelRelationship | undefined>;
  getDocumentParcelRelationshipsForDocument(documentId: number): Promise<DocumentParcelRelationship[]>;
  getDocumentParcelRelationshipsForParcel(parcelId: number): Promise<DocumentParcelRelationship[]>;
  createDocumentParcelRelationship(relationship: InsertDocumentParcelRelationship): Promise<DocumentParcelRelationship>;
  updateDocumentParcelRelationship(id: number, updates: Partial<InsertDocumentParcelRelationship>): Promise<DocumentParcelRelationship>;
  deleteDocumentParcelRelationship(id: number): Promise<boolean>;
  updateDocumentClassification(id: number, classification: string): Promise<Document>;
  
  // Map bookmarks operations
  getMapBookmarks(userId: number): Promise<MapBookmark[]>;
  getMapBookmark(id: number): Promise<MapBookmark | undefined>;
  createMapBookmark(bookmark: InsertMapBookmark): Promise<MapBookmark>;
  updateMapBookmark(id: number, updates: Partial<InsertMapBookmark>): Promise<MapBookmark>;
  deleteMapBookmark(id: number): Promise<boolean>;
  
  // Map layer operations
  getMapLayers(): Promise<any[]>;
  updateMapLayer(id: number, data: any): Promise<any>;
  getVisibleMapLayers(): Promise<any[]>;
  
  // Map preferences operations
  getMapPreferences(userId: number): Promise<MapPreference | undefined>;
  createMapPreferences(preferences: InsertMapPreference): Promise<MapPreference>;
  updateMapPreferences(userId: number, updates: Partial<InsertMapPreference>): Promise<MapPreference>;
  getMapPreference(id: number): Promise<MapPreference | undefined>;
  createOrUpdateMapPreference(data: any): Promise<MapPreference>;
  
  // Report operations
  getReportTemplates(): Promise<any[]>;
  getReportTemplate(id: number): Promise<any>;
  createReportTemplate(template: any): Promise<any>;
  getReport(id: number): Promise<any>;
  getReports(userId: number): Promise<any[]>;
  createReport(report: any): Promise<any>;
  updateReport(id: number, data: any): Promise<any>;
  generateReportData(reportId: number): Promise<any>;
  getReportData(reportId: number): Promise<any>;
  exportReport(reportId: number, format: string): Promise<any>;
  getReportExport(exportId: number): Promise<any>;
  generateReportPreview(templateId: number, data: any): Promise<any>;
  getReportSchedules(userId: number): Promise<any[]>;
  getReportSchedule(id: number): Promise<any>;
  createReportSchedule(schedule: any): Promise<any>;
  updateReportSchedule(id: number, data: any): Promise<any>;
  deleteReportSchedule(id: number): Promise<boolean>;
  
  // Additional operations
  generateParcelNumbers(count: number): Promise<string[]>;
  queryAssistant(query: string): Promise<any>;
  generateSM00Report(parcelIds: number[]): Promise<any>;
  
  // Recently viewed parcels operations
  getRecentlyViewedParcels(userId: number, limit?: number): Promise<RecentlyViewedParcel[]>;
  addRecentlyViewedParcel(data: InsertRecentlyViewedParcel): Promise<RecentlyViewedParcel>;
  clearRecentlyViewedParcels(userId: number): Promise<boolean>;
  
  // Document Lineage operations
  createDocument(document: InsertDocumentEntity): Promise<DocumentEntity>;
  getDocumentById(id: string): Promise<DocumentEntity | undefined>;
  updateDocument(id: string, updates: Partial<DocumentEntity>): Promise<DocumentEntity>;
  listDocuments(filter?: { 
    documentType?: string;
    parcelId?: string;
    status?: 'active' | 'archived' | 'deleted';
  }): Promise<DocumentEntity[]>;
  
  // Document event operations
  createDocumentEvent(event: InsertDocumentLineageEvent): Promise<DocumentLineageEvent>;
  getDocumentEvents(documentId: string): Promise<DocumentLineageEvent[]>;
  
  // Document relationship operations
  createDocumentRelationship(relationship: InsertDocumentRelationship): Promise<DocumentRelationship>;
  getDocumentRelationships(documentId: string): Promise<DocumentRelationship[]>;
  
  // Document processing stage operations
  createProcessingStage(stage: InsertDocumentProcessingStage): Promise<DocumentProcessingStage>;
  updateProcessingStage(id: string, updates: Partial<DocumentProcessingStage>): Promise<DocumentProcessingStage>;
  getProcessingStageById(id: string): Promise<DocumentProcessingStage | undefined>;
  getDocumentProcessingStages(documentId: string): Promise<DocumentProcessingStage[]>;
  
  // Document graph operations
  getDocumentLineageGraph(documentId: string, depth?: number): Promise<DocumentLineageGraph>;
  getDocumentProvenance(documentId: string): Promise<DocumentEntity[]>;
  getCompleteDocumentGraph(documentIds: string[]): Promise<DocumentLineageGraph>;
  
  // ArcGIS Map Config operations
  getArcGISMapConfigs(userId: number): Promise<ArcGISMapConfig[]>;
  getArcGISMapConfig(id: number): Promise<ArcGISMapConfig | undefined>;
  createArcGISMapConfig(config: InsertArcGISMapConfig): Promise<ArcGISMapConfig>;
  updateArcGISMapConfig(id: number, updates: Partial<InsertArcGISMapConfig>): Promise<ArcGISMapConfig>;
  deleteArcGISMapConfig(id: number): Promise<boolean>;
  
  // ArcGIS Layer operations
  getArcGISLayers(configId: number): Promise<ArcGISLayer[]>;
  getArcGISLayer(id: number): Promise<ArcGISLayer | undefined>;
  createArcGISLayer(layer: InsertArcGISLayer): Promise<ArcGISLayer>;
  updateArcGISLayer(id: number, updates: Partial<InsertArcGISLayer>): Promise<ArcGISLayer>;
  deleteArcGISLayer(id: number): Promise<boolean>;
  
  // ArcGIS Sketch operations
  getArcGISSketches(configId: number, userId?: number): Promise<ArcGISSketch[]>;
  getArcGISSketch(id: number): Promise<ArcGISSketch | undefined>;
  createArcGISSketch(sketch: InsertArcGISSketch): Promise<ArcGISSketch>;
  updateArcGISSketch(id: number, updates: Partial<InsertArcGISSketch>): Promise<ArcGISSketch>;
  deleteArcGISSketch(id: number): Promise<boolean>;
  
  // ArcGIS Analysis operations
  getArcGISAnalysisResults(configId: number, userId?: number): Promise<ArcGISAnalysisResult[]>;
  getArcGISAnalysisResult(id: number): Promise<ArcGISAnalysisResult | undefined>;
  createArcGISAnalysisResult(result: InsertArcGISAnalysisResult): Promise<ArcGISAnalysisResult>;
  deleteArcGISAnalysisResult(id: number): Promise<boolean>;
  
  // Workflow operations
  getWorkflows(userId?: number): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow>;
  
  // Workflow state operations
  getWorkflowState(workflowId: number): Promise<WorkflowState | undefined>;
  createWorkflowState(state: InsertWorkflowState): Promise<WorkflowState>;
  updateWorkflowState(workflowId: number, updates: Partial<InsertWorkflowState>): Promise<WorkflowState>;
  
  // Workflow event operations
  getWorkflowEvents(workflowId: number): Promise<WorkflowEvent[]>;
  createWorkflowEvent(event: InsertWorkflowEvent): Promise<WorkflowEvent>;
  
  // Checklist operations
  getChecklistItems(workflowId: number): Promise<ChecklistItem[]>;
  getChecklistItem(id: number): Promise<ChecklistItem | undefined>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: number, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem>;
  deleteChecklistItem(id: number): Promise<boolean>;
  
  // Data Quality Rule operations
  getDataQualityRules(dimension?: string, entityType?: string, importance?: string): Promise<DataQualityRule[]>;
  getDataQualityRule(id: number): Promise<DataQualityRule | undefined>;
  createDataQualityRule(rule: InsertDataQualityRule): Promise<DataQualityRule>;
  updateDataQualityRule(id: number, updates: Partial<InsertDataQualityRule>): Promise<DataQualityRule>;
  
  // Data Quality Evaluation operations
  evaluateDataQualityRule(ruleId: number, entityType: string, entityId: number, userId?: number): Promise<DataQualityEvaluation>;
  getDataQualityEvaluations(entityType: string, entityId: number, limit?: number): Promise<DataQualityEvaluation[]>;
  
  // Data Quality Score operations
  getDataQualityScore(entityType: string, entityId: number): Promise<DataQualityScore | undefined>;
  updateDataQualityScore(entityType: string, entityId: number, score: Partial<InsertDataQualityScore>): Promise<DataQualityScore>;
}

// Implementation of storage interface using the database
export class DatabaseStorage implements IStorage {
  // Data Quality methods - to be implemented when migrating to production
  async getDataQualityRules(dimension?: string, entityType?: string, importance?: string): Promise<DataQualityRule[]> {
    let query = db.select().from(dataQualityRules);
    
    if (dimension) {
      query = query.where(eq(dataQualityRules.dimension, dimension));
    }
    
    if (entityType) {
      query = query.where(eq(dataQualityRules.entityType, entityType));
    }
    
    if (importance) {
      query = query.where(eq(dataQualityRules.importance, importance));
    }
    
    return query;
  }

  async getDataQualityRule(id: number): Promise<DataQualityRule | undefined> {
    const [rule] = await db.select()
      .from(dataQualityRules)
      .where(eq(dataQualityRules.id, id));
    return rule;
  }

  async createDataQualityRule(rule: InsertDataQualityRule): Promise<DataQualityRule> {
    const [newRule] = await db.insert(dataQualityRules)
      .values(rule)
      .returning();
    return newRule;
  }

  async updateDataQualityRule(id: number, updates: Partial<InsertDataQualityRule>): Promise<DataQualityRule> {
    const [updatedRule] = await db.update(dataQualityRules)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(dataQualityRules.id, id))
      .returning();
      
    if (!updatedRule) {
      throw new Error(`Data quality rule with ID ${id} not found`);
    }
    
    return updatedRule;
  }

  async evaluateDataQualityRule(ruleId: number, entityType: string, entityId: number, userId?: number): Promise<DataQualityEvaluation> {
    // Get the rule
    const rule = await this.getDataQualityRule(ruleId);
    
    if (!rule) {
      throw new Error(`Data quality rule with ID ${ruleId} not found`);
    }
    
    // In a production implementation, this would apply the rule's validation logic
    // For now, simulate a rule evaluation with a simple pass/fail
    const passed = Math.random() > 0.3; // 70% pass rate for simulation
    const score = passed ? 1.0 : 0.0;
    
    // Create evaluation record
    const [evaluation] = await db.insert(dataQualityEvaluations)
      .values({
        ruleId,
        entityType,
        entityId,
        passed,
        score,
        details: {
          issues: passed ? [] : [`Simulated issue for ${entityType} ${entityId}`],
          affectedFields: passed ? [] : ['field1', 'field2'],
          metadata: { simulatedEvaluation: true }
        },
        evaluatedAt: new Date(),
        evaluatedBy: userId
      })
      .returning();
    
    // Update the entity's quality score
    await this.updateEntityQualityScore(entityType, entityId);
    
    return evaluation;
  }

  async getDataQualityEvaluations(entityType: string, entityId: number, limit: number = 10): Promise<DataQualityEvaluation[]> {
    return db.select()
      .from(dataQualityEvaluations)
      .where(and(
        eq(dataQualityEvaluations.entityType, entityType),
        eq(dataQualityEvaluations.entityId, entityId)
      ))
      .orderBy(desc(dataQualityEvaluations.evaluatedAt))
      .limit(limit);
  }

  async getDataQualityScore(entityType: string, entityId: number): Promise<DataQualityScore | undefined> {
    const [score] = await db.select()
      .from(dataQualityScores)
      .where(and(
        eq(dataQualityScores.entityType, entityType),
        eq(dataQualityScores.entityId, entityId)
      ));
      
    return score;
  }

  async updateDataQualityScore(entityType: string, entityId: number, scoreData: Partial<InsertDataQualityScore>): Promise<DataQualityScore> {
    // Check if a score exists
    const existingScore = await this.getDataQualityScore(entityType, entityId);
    
    if (existingScore) {
      // Update existing score
      const [updatedScore] = await db.update(dataQualityScores)
        .set({
          ...scoreData,
          lastEvaluatedAt: new Date()
        })
        .where(and(
          eq(dataQualityScores.entityType, entityType),
          eq(dataQualityScores.entityId, entityId)
        ))
        .returning();
        
      return updatedScore;
    } else {
      // Create new score
      const [newScore] = await db.insert(dataQualityScores)
        .values({
          entityType,
          entityId,
          overallScore: scoreData.overallScore || 0,
          dimensionScores: scoreData.dimensionScores || {},
          passedRules: scoreData.passedRules || 0,
          totalRules: scoreData.totalRules || 0,
          lastEvaluatedAt: new Date()
        })
        .returning();
        
      return newScore;
    }
  }

  // Helper method to update entity quality score based on evaluations
  private async updateEntityQualityScore(entityType: string, entityId: number): Promise<void> {
    // Get all evaluations for this entity
    const evaluations = await this.getDataQualityEvaluations(entityType, entityId, 1000);
    
    if (evaluations.length === 0) {
      return; // No evaluations to calculate score from
    }
    
    // Calculate overall score
    const passedRules = evaluations.filter(e => e.passed).length;
    const totalRules = evaluations.length;
    const overallScore = totalRules > 0 ? passedRules / totalRules : 0;
    
    // Calculate dimension scores
    const dimensionScores: Record<string, number> = {};
    const dimensionCounts: Record<string, { passed: number, total: number }> = {};
    
    for (const evaluation of evaluations) {
      const rule = await this.getDataQualityRule(evaluation.ruleId);
      
      if (rule) {
        const dimension = rule.dimension;
        
        if (!dimensionCounts[dimension]) {
          dimensionCounts[dimension] = { passed: 0, total: 0 };
        }
        
        dimensionCounts[dimension].total++;
        
        if (evaluation.passed) {
          dimensionCounts[dimension].passed++;
        }
      }
    }
    
    // Calculate score for each dimension
    for (const [dimension, counts] of Object.entries(dimensionCounts)) {
      dimensionScores[dimension] = counts.total > 0 ? counts.passed / counts.total : 0;
    }
    
    // Update the score
    await this.updateDataQualityScore(entityType, entityId, {
      overallScore,
      dimensionScores,
      passedRules,
      totalRules
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Map bookmarks operations
  async getMapBookmarks(userId: number): Promise<MapBookmark[]> {
    return db.select()
      .from(mapBookmarks)
      .where(eq(mapBookmarks.userId, userId))
      .orderBy(desc(mapBookmarks.updatedAt));
  }
  
  async getMapBookmark(id: number): Promise<MapBookmark | undefined> {
    const [bookmark] = await db.select()
      .from(mapBookmarks)
      .where(eq(mapBookmarks.id, id));
    return bookmark;
  }
  
  async createMapBookmark(bookmark: InsertMapBookmark): Promise<MapBookmark> {
    const [newBookmark] = await db.insert(mapBookmarks)
      .values(bookmark)
      .returning();
    return newBookmark;
  }
  
  async updateMapBookmark(id: number, updates: Partial<InsertMapBookmark>): Promise<MapBookmark> {
    const [updatedBookmark] = await db.update(mapBookmarks)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(mapBookmarks.id, id))
      .returning();
    
    if (!updatedBookmark) {
      throw new Error(`Bookmark with ID ${id} not found`);
    }
    
    return updatedBookmark;
  }
  
  async deleteMapBookmark(id: number): Promise<boolean> {
    const result = await db.delete(mapBookmarks)
      .where(eq(mapBookmarks.id, id));
    
    return result.rowCount > 0;
  }
  
  // Map preferences operations
  async getMapPreferences(userId: number): Promise<MapPreference | undefined> {
    const [preferences] = await db.select()
      .from(mapPreferences)
      .where(eq(mapPreferences.userId, userId));
    return preferences;
  }
  
  async createMapPreferences(preferences: InsertMapPreference): Promise<MapPreference> {
    const [newPreferences] = await db.insert(mapPreferences)
      .values(preferences)
      .returning();
    return newPreferences;
  }
  
  async updateMapPreferences(userId: number, updates: Partial<InsertMapPreference>): Promise<MapPreference> {
    // First check if preferences exist
    const existingPreferences = await this.getMapPreferences(userId);
    
    if (existingPreferences) {
      // Update existing preferences
      const [updatedPreferences] = await db.update(mapPreferences)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(mapPreferences.userId, userId))
        .returning();
      
      return updatedPreferences;
    } else {
      // Create new preferences if they don't exist
      return this.createMapPreferences({
        userId,
        defaultCenter: updates.defaultCenter || { lat: 44.571, lng: -123.262 }, // Benton County default
        defaultZoom: updates.defaultZoom || 10,
        baseLayer: updates.baseLayer || 'streets',
        layerVisibility: updates.layerVisibility || 'visible',
        theme: updates.theme || 'light',
        ...updates
      });
    }
  }
  
  // Recently viewed parcels operations
  async getRecentlyViewedParcels(userId: number, limit = 10): Promise<RecentlyViewedParcel[]> {
    return db.select()
      .from(recentlyViewedParcels)
      .where(eq(recentlyViewedParcels.userId, userId))
      .orderBy(desc(recentlyViewedParcels.viewedAt))
      .limit(limit);
  }
  
  async addRecentlyViewedParcel(data: InsertRecentlyViewedParcel): Promise<RecentlyViewedParcel> {
    // Check if this user-parcel combination already exists
    const [existing] = await db.select()
      .from(recentlyViewedParcels)
      .where(
        and(
          eq(recentlyViewedParcels.userId, data.userId),
          eq(recentlyViewedParcels.parcelId, data.parcelId)
        )
      );
    
    if (existing) {
      // Update the viewedAt timestamp
      const [updated] = await db.update(recentlyViewedParcels)
        .set({ viewedAt: new Date() })
        .where(eq(recentlyViewedParcels.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Insert new record
      const [newRecord] = await db.insert(recentlyViewedParcels)
        .values(data)
        .returning();
      
      return newRecord;
    }
  }
  
  async clearRecentlyViewedParcels(userId: number): Promise<boolean> {
    const result = await db.delete(recentlyViewedParcels)
      .where(eq(recentlyViewedParcels.userId, userId));
    
    return result.rowCount > 0;
  }
  
  // Document Lineage Methods - delegate to DocumentLineageStorage
  async createDocument(document: InsertDocumentEntity): Promise<DocumentEntity> {
    return documentLineageStorage.createDocument(document);
  }

  async getDocumentById(id: string): Promise<DocumentEntity | undefined> {
    return documentLineageStorage.getDocumentById(id);
  }

  async updateDocument(id: string, updates: Partial<DocumentEntity>): Promise<DocumentEntity> {
    return documentLineageStorage.updateDocument(id, updates);
  }

  async listDocuments(filter?: { 
    documentType?: string;
    parcelId?: string;
    status?: 'active' | 'archived' | 'deleted';
  }): Promise<DocumentEntity[]> {
    return documentLineageStorage.listDocuments(filter);
  }
  
  // Document event operations
  async createDocumentEvent(event: InsertDocumentLineageEvent): Promise<DocumentLineageEvent> {
    return documentLineageStorage.createDocumentEvent(event);
  }

  async getDocumentEvents(documentId: string): Promise<DocumentLineageEvent[]> {
    return documentLineageStorage.getDocumentEvents(documentId);
  }
  
  // Document relationship operations
  async createDocumentRelationship(relationship: InsertDocumentRelationship): Promise<DocumentRelationship> {
    return documentLineageStorage.createDocumentRelationship(relationship);
  }

  async getDocumentRelationships(documentId: string): Promise<DocumentRelationship[]> {
    return documentLineageStorage.getDocumentRelationships(documentId);
  }
  
  // Document processing stage operations
  async createProcessingStage(stage: InsertDocumentProcessingStage): Promise<DocumentProcessingStage> {
    return documentLineageStorage.createProcessingStage(stage);
  }

  async updateProcessingStage(id: string, updates: Partial<DocumentProcessingStage>): Promise<DocumentProcessingStage> {
    return documentLineageStorage.updateProcessingStage(id, updates);
  }

  async getProcessingStageById(id: string): Promise<DocumentProcessingStage | undefined> {
    return documentLineageStorage.getProcessingStageById(id);
  }

  async getDocumentProcessingStages(documentId: string): Promise<DocumentProcessingStage[]> {
    return documentLineageStorage.getDocumentProcessingStages(documentId);
  }
  
  // Document graph operations
  async getDocumentLineageGraph(documentId: string, depth?: number): Promise<DocumentLineageGraph> {
    return documentLineageStorage.getDocumentLineageGraph(documentId, depth);
  }

  async getDocumentProvenance(documentId: string): Promise<DocumentEntity[]> {
    return documentLineageStorage.getDocumentProvenance(documentId);
  }

  async getCompleteDocumentGraph(documentIds: string[]): Promise<DocumentLineageGraph> {
    return documentLineageStorage.getCompleteDocumentGraph(documentIds);
  }
  
  // ArcGIS Map Config operations
  async getArcGISMapConfigs(userId: number): Promise<ArcGISMapConfig[]> {
    return db.select()
      .from(arcgisMapConfigs)
      .where(eq(arcgisMapConfigs.userId, userId))
      .orderBy(desc(arcgisMapConfigs.updatedAt));
  }
  
  async getArcGISMapConfig(id: number): Promise<ArcGISMapConfig | undefined> {
    const [config] = await db.select()
      .from(arcgisMapConfigs)
      .where(eq(arcgisMapConfigs.id, id));
    return config;
  }
  
  async createArcGISMapConfig(config: InsertArcGISMapConfig): Promise<ArcGISMapConfig> {
    const [newConfig] = await db.insert(arcgisMapConfigs)
      .values(config)
      .returning();
    return newConfig;
  }
  
  async updateArcGISMapConfig(id: number, updates: Partial<InsertArcGISMapConfig>): Promise<ArcGISMapConfig> {
    const [updatedConfig] = await db.update(arcgisMapConfigs)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(arcgisMapConfigs.id, id))
      .returning();
    
    if (!updatedConfig) {
      throw new Error(`ArcGIS Map Config with ID ${id} not found`);
    }
    
    return updatedConfig;
  }
  
  async deleteArcGISMapConfig(id: number): Promise<boolean> {
    const result = await db.delete(arcgisMapConfigs)
      .where(eq(arcgisMapConfigs.id, id));
    
    return result.rowCount > 0;
  }
  
  // ArcGIS Layer operations
  async getArcGISLayers(configId: number): Promise<ArcGISLayer[]> {
    return db.select()
      .from(arcgisLayers)
      .where(eq(arcgisLayers.configId, configId))
      .orderBy(asc(arcgisLayers.layerOrder));
  }
  
  async getArcGISLayer(id: number): Promise<ArcGISLayer | undefined> {
    const [layer] = await db.select()
      .from(arcgisLayers)
      .where(eq(arcgisLayers.id, id));
    return layer;
  }
  
  async createArcGISLayer(layer: InsertArcGISLayer): Promise<ArcGISLayer> {
    const [newLayer] = await db.insert(arcgisLayers)
      .values(layer)
      .returning();
    return newLayer;
  }
  
  async updateArcGISLayer(id: number, updates: Partial<InsertArcGISLayer>): Promise<ArcGISLayer> {
    const [updatedLayer] = await db.update(arcgisLayers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(arcgisLayers.id, id))
      .returning();
    
    if (!updatedLayer) {
      throw new Error(`ArcGIS Layer with ID ${id} not found`);
    }
    
    return updatedLayer;
  }
  
  async deleteArcGISLayer(id: number): Promise<boolean> {
    const result = await db.delete(arcgisLayers)
      .where(eq(arcgisLayers.id, id));
    
    return result.rowCount > 0;
  }
  
  // ArcGIS Sketch operations
  async getArcGISSketches(configId: number, userId?: number): Promise<ArcGISSketch[]> {
    let query = db.select()
      .from(arcgisSketches)
      .where(eq(arcgisSketches.configId, configId));
    
    if (userId) {
      query = query.where(eq(arcgisSketches.userId, userId));
    }
    
    return query.orderBy(desc(arcgisSketches.updatedAt));
  }
  
  async getArcGISSketch(id: number): Promise<ArcGISSketch | undefined> {
    const [sketch] = await db.select()
      .from(arcgisSketches)
      .where(eq(arcgisSketches.id, id));
    return sketch;
  }
  
  async createArcGISSketch(sketch: InsertArcGISSketch): Promise<ArcGISSketch> {
    const [newSketch] = await db.insert(arcgisSketches)
      .values(sketch)
      .returning();
    return newSketch;
  }
  
  async updateArcGISSketch(id: number, updates: Partial<InsertArcGISSketch>): Promise<ArcGISSketch> {
    const [updatedSketch] = await db.update(arcgisSketches)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(arcgisSketches.id, id))
      .returning();
    
    if (!updatedSketch) {
      throw new Error(`ArcGIS Sketch with ID ${id} not found`);
    }
    
    return updatedSketch;
  }
  
  async deleteArcGISSketch(id: number): Promise<boolean> {
    const result = await db.delete(arcgisSketches)
      .where(eq(arcgisSketches.id, id));
    
    return result.rowCount > 0;
  }
  
  // ArcGIS Analysis Results operations
  async getArcGISAnalysisResults(configId: number, userId?: number): Promise<ArcGISAnalysisResult[]> {
    let query = db.select()
      .from(arcgisAnalysisResults)
      .where(eq(arcgisAnalysisResults.configId, configId));
    
    if (userId) {
      query = query.where(eq(arcgisAnalysisResults.userId, userId));
    }
    
    return query.orderBy(desc(arcgisAnalysisResults.createdAt));
  }
  
  async getArcGISAnalysisResult(id: number): Promise<ArcGISAnalysisResult | undefined> {
    const [result] = await db.select()
      .from(arcgisAnalysisResults)
      .where(eq(arcgisAnalysisResults.id, id));
    return result;
  }
  
  async createArcGISAnalysisResult(analysisResult: InsertArcGISAnalysisResult): Promise<ArcGISAnalysisResult> {
    const [newResult] = await db.insert(arcgisAnalysisResults)
      .values(analysisResult)
      .returning();
    return newResult;
  }
  
  async deleteArcGISAnalysisResult(id: number): Promise<boolean> {
    const result = await db.delete(arcgisAnalysisResults)
      .where(eq(arcgisAnalysisResults.id, id));
    
    return result.rowCount > 0;
  }
  
  // Workflow operations
  async getWorkflows(userId?: number): Promise<Workflow[]> {
    let query = db.select().from(workflows);
    
    if (userId) {
      query = query.where(eq(workflows.userId, userId));
    }
    
    return query.orderBy(desc(workflows.updatedAt));
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select()
      .from(workflows)
      .where(eq(workflows.id, id));
    
    return workflow;
  }
  
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows)
      .values(workflow)
      .returning();
    
    return newWorkflow;
  }
  
  async updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow> {
    const [updatedWorkflow] = await db.update(workflows)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(workflows.id, id))
      .returning();
    
    if (!updatedWorkflow) {
      throw new Error(`Workflow with ID ${id} not found`);
    }
    
    return updatedWorkflow;
  }
  
  // Workflow state operations
  async getWorkflowState(workflowId: number): Promise<WorkflowState | undefined> {
    const [state] = await db.select()
      .from(workflowStates)
      .where(eq(workflowStates.workflowId, workflowId));
    
    return state;
  }
  
  async createWorkflowState(state: InsertWorkflowState): Promise<WorkflowState> {
    const [newState] = await db.insert(workflowStates)
      .values(state)
      .returning();
    
    return newState;
  }
  
  async updateWorkflowState(workflowId: number, updates: Partial<InsertWorkflowState>): Promise<WorkflowState> {
    // Check if state exists
    const existingState = await this.getWorkflowState(workflowId);
    
    if (existingState) {
      // Update existing state
      const [updatedState] = await db.update(workflowStates)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(workflowStates.workflowId, workflowId))
        .returning();
      
      return updatedState;
    } else {
      // Create new state if it doesn't exist
      return this.createWorkflowState({
        workflowId,
        currentStep: updates.currentStep || 1,
        formData: updates.formData || {},
        ...updates
      });
    }
  }
  
  // Workflow event operations
  async getWorkflowEvents(workflowId: number): Promise<WorkflowEvent[]> {
    return db.select()
      .from(workflowEvents)
      .where(eq(workflowEvents.workflowId, workflowId))
      .orderBy(desc(workflowEvents.createdAt));
  }
  
  async createWorkflowEvent(event: InsertWorkflowEvent): Promise<WorkflowEvent> {
    const [newEvent] = await db.insert(workflowEvents)
      .values(event)
      .returning();
    
    return newEvent;
  }
  
  // Checklist operations
  async getChecklistItems(workflowId: number): Promise<ChecklistItem[]> {
    return db.select()
      .from(checklistItems)
      .where(eq(checklistItems.workflowId, workflowId))
      .orderBy(asc(checklistItems.order));
  }
  
  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    const [item] = await db.select()
      .from(checklistItems)
      .where(eq(checklistItems.id, id));
    
    return item;
  }
  
  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const [newItem] = await db.insert(checklistItems)
      .values(item)
      .returning();
    
    return newItem;
  }
  
  async updateChecklistItem(id: number, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem> {
    const [updatedItem] = await db.update(checklistItems)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(checklistItems.id, id))
      .returning();
    
    if (!updatedItem) {
      throw new Error(`Checklist item with ID ${id} not found`);
    }
    
    return updatedItem;
  }
  
  async deleteChecklistItem(id: number): Promise<boolean> {
    const result = await db.delete(checklistItems)
      .where(eq(checklistItems.id, id));
    
    return result.rowCount > 0;
  }
}

// Class removed to simplify file
export class MemStorage implements IStorage {
  // In-memory storage using Maps
  private users: Map<number, User> = new Map();
  private mapBookmarks: Map<number, MapBookmark> = new Map();
  private mapPreferences: Map<number, MapPreference> = new Map();
  private recentlyViewedParcels: Map<string, RecentlyViewedParcel> = new Map();
  private documentParcelRelationships: Map<number, DocumentParcelRelationship> = new Map();
  private documents: Map<string, DocumentEntity> = new Map();
  private documentEvents: Map<string, DocumentLineageEvent[]> = new Map();
  private documentRelationships: Map<string, DocumentRelationship[]> = new Map();
  private processingStages: Map<string, DocumentProcessingStage> = new Map();
  
  // Additional storage for direct document and parcel operations 
  private parcels: Map<number, Parcel> = new Map();
  private parcelsByNumber: Map<string, Parcel> = new Map();
  private standardDocuments: Map<number, Document> = new Map();
  private documentParcelLinks: Map<string, any> = new Map();
  private mapLayers: Map<number, any> = new Map();
  private reportTemplates: Map<number, any> = new Map();
  private reports: Map<number, any> = new Map();
  private reportData: Map<number, any> = new Map();
  private reportExports: Map<number, any> = new Map();
  private reportSchedules: Map<number, any> = new Map();

  // ArcGIS in-memory storage
  private arcgisMapConfigs: Map<number, ArcGISMapConfig> = new Map();
  private arcgisLayers: Map<number, ArcGISLayer> = new Map();
  private arcgisSketches: Map<number, ArcGISSketch> = new Map();
  private arcgisAnalysisResults: Map<number, ArcGISAnalysisResult> = new Map();
  
  // Workflow in-memory storage
  private workflows: Map<number, Workflow> = new Map();
  private workflowStates: Map<number, WorkflowState> = new Map();
  private workflowEvents: Map<number, WorkflowEvent[]> = new Map();
  private checklistItems: Map<number, ChecklistItem> = new Map();
  async getUser(id: number): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }
  
  async createUser(user: InsertUser): Promise<User> {
    throw new Error('Method not implemented.');
  }
  
  async getMapBookmarks(userId: number): Promise<MapBookmark[]> {
    throw new Error('Method not implemented.');
  }
  
  async getMapBookmark(id: number): Promise<MapBookmark | undefined> {
    throw new Error('Method not implemented.');
  }
  
  async createMapBookmark(bookmark: InsertMapBookmark): Promise<MapBookmark> {
    throw new Error('Method not implemented.');
  }
  
  async updateMapBookmark(id: number, updates: Partial<InsertMapBookmark>): Promise<MapBookmark> {
    throw new Error('Method not implemented.');
  }
  
  async deleteMapBookmark(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  
  async getMapPreferences(userId: number): Promise<MapPreference | undefined> {
    throw new Error('Method not implemented.');
  }
  
  async createMapPreferences(preferences: InsertMapPreference): Promise<MapPreference> {
    throw new Error('Method not implemented.');
  }
  
  async updateMapPreferences(userId: number, updates: Partial<InsertMapPreference>): Promise<MapPreference> {
    throw new Error('Method not implemented.');
  }
  
  async getRecentlyViewedParcels(userId: number, limit?: number): Promise<RecentlyViewedParcel[]> {
    throw new Error('Method not implemented.');
  }
  
  async addRecentlyViewedParcel(data: InsertRecentlyViewedParcel): Promise<RecentlyViewedParcel> {
    throw new Error('Method not implemented.');
  }
  
  async clearRecentlyViewedParcels(userId: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  
  async createDocument(document: InsertDocumentEntity): Promise<DocumentEntity> {
    throw new Error('Method not implemented.');
  }
  
  async getDocumentById(id: string): Promise<DocumentEntity | undefined> {
    throw new Error('Method not implemented.');
  }
  
  async updateDocument(id: string, updates: Partial<DocumentEntity>): Promise<DocumentEntity> {
    throw new Error('Method not implemented.');
  }
  
  async listDocuments(filter?: { documentType?: string; parcelId?: string; status?: 'active' | 'archived' | 'deleted'; }): Promise<DocumentEntity[]> {
    throw new Error('Method not implemented.');
  }
  
  async createDocumentEvent(event: InsertDocumentLineageEvent): Promise<DocumentLineageEvent> {
    throw new Error('Method not implemented.');
  }
  
  async getDocumentEvents(documentId: string): Promise<DocumentLineageEvent[]> {
    throw new Error('Method not implemented.');
  }
  
  async createDocumentRelationship(relationship: InsertDocumentRelationship): Promise<DocumentRelationship> {
    throw new Error('Method not implemented.');
  }
  
  async getDocumentRelationships(documentId: string): Promise<DocumentRelationship[]> {
    throw new Error('Method not implemented.');
  }
  
  async createProcessingStage(stage: InsertDocumentProcessingStage): Promise<DocumentProcessingStage> {
    throw new Error('Method not implemented.');
  }
  
  async updateProcessingStage(id: string, updates: Partial<DocumentProcessingStage>): Promise<DocumentProcessingStage> {
    throw new Error('Method not implemented.');
  }
  
  async getProcessingStageById(id: string): Promise<DocumentProcessingStage | undefined> {
    throw new Error('Method not implemented.');
  }
  
  async getDocumentProcessingStages(documentId: string): Promise<DocumentProcessingStage[]> {
    throw new Error('Method not implemented.');
  }
  
  async getDocumentLineageGraph(documentId: string, depth?: number): Promise<DocumentLineageGraph> {
    throw new Error('Method not implemented.');
  }
  
  async getDocumentProvenance(documentId: string): Promise<DocumentEntity[]> {
    throw new Error('Method not implemented.');
  }
  
  async getCompleteDocumentGraph(documentIds: string[]): Promise<DocumentLineageGraph> {
    throw new Error('Method not implemented.');
  }
  
  // ArcGIS Map Config operations
  async getArcGISMapConfigs(userId: number): Promise<ArcGISMapConfig[]> {
    const results: ArcGISMapConfig[] = [];
    for (const config of this.arcgisMapConfigs.values()) {
      if (config.userId === userId) {
        results.push(config);
      }
    }
    // Sort by most recently updated
    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getArcGISMapConfig(id: number): Promise<ArcGISMapConfig | undefined> {
    return this.arcgisMapConfigs.get(id);
  }
  
  async createArcGISMapConfig(config: InsertArcGISMapConfig): Promise<ArcGISMapConfig> {
    const id = this.arcgisMapConfigs.size + 1;
    const now = new Date();
    const newConfig: ArcGISMapConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.arcgisMapConfigs.set(id, newConfig);
    return newConfig;
  }
  
  async updateArcGISMapConfig(id: number, updates: Partial<InsertArcGISMapConfig>): Promise<ArcGISMapConfig> {
    const config = this.arcgisMapConfigs.get(id);
    if (!config) {
      throw new Error(`ArcGIS map config with id ${id} not found`);
    }
    
    const updatedConfig = {
      ...config,
      ...updates,
      id: config.id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.arcgisMapConfigs.set(id, updatedConfig);
    return updatedConfig;
  }
  
  async deleteArcGISMapConfig(id: number): Promise<boolean> {
    // Also delete related layers, sketches, and analysis results
    const sketch = Array.from(this.arcgisSketches.values())
      .filter(sketch => sketch.configId === id);
    
    for (const item of sketch) {
      this.arcgisSketches.delete(item.id);
    }
    
    const layers = Array.from(this.arcgisLayers.values())
      .filter(layer => layer.configId === id);
    
    for (const item of layers) {
      this.arcgisLayers.delete(item.id);
    }
    
    const analyses = Array.from(this.arcgisAnalysisResults.values())
      .filter(result => result.configId === id);
    
    for (const item of analyses) {
      this.arcgisAnalysisResults.delete(item.id);
    }
    
    return this.arcgisMapConfigs.delete(id);
  }
  
  // ArcGIS Layer operations
  async getArcGISLayers(configId: number): Promise<ArcGISLayer[]> {
    const results: ArcGISLayer[] = [];
    for (const layer of this.arcgisLayers.values()) {
      if (layer.configId === configId) {
        results.push(layer);
      }
    }
    // Sort by display order
    return results.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
  
  async getArcGISLayer(id: number): Promise<ArcGISLayer | undefined> {
    return this.arcgisLayers.get(id);
  }
  
  async createArcGISLayer(layer: InsertArcGISLayer): Promise<ArcGISLayer> {
    const id = this.arcgisLayers.size + 1;
    const now = new Date();
    const newLayer: ArcGISLayer = {
      ...layer,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.arcgisLayers.set(id, newLayer);
    return newLayer;
  }
  
  async updateArcGISLayer(id: number, updates: Partial<InsertArcGISLayer>): Promise<ArcGISLayer> {
    const layer = this.arcgisLayers.get(id);
    if (!layer) {
      throw new Error(`ArcGIS layer with id ${id} not found`);
    }
    
    const updatedLayer = {
      ...layer,
      ...updates,
      id: layer.id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.arcgisLayers.set(id, updatedLayer);
    return updatedLayer;
  }
  
  async deleteArcGISLayer(id: number): Promise<boolean> {
    return this.arcgisLayers.delete(id);
  }
  
  // ArcGIS Sketch operations
  async getArcGISSketches(configId: number, userId?: number): Promise<ArcGISSketch[]> {
    const results: ArcGISSketch[] = [];
    for (const sketch of this.arcgisSketches.values()) {
      if (sketch.configId === configId) {
        // If userId is provided, filter by it
        if (userId && sketch.userId !== userId) {
          continue;
        }
        results.push(sketch);
      }
    }
    // Sort by most recently updated
    return results.sort((a, b) => {
      const dateA = a.updatedAt ? a.updatedAt.getTime() : a.createdAt.getTime();
      const dateB = b.updatedAt ? b.updatedAt.getTime() : b.createdAt.getTime();
      return dateB - dateA;
    });
  }
  
  async getArcGISSketch(id: number): Promise<ArcGISSketch | undefined> {
    return this.arcgisSketches.get(id);
  }
  
  async createArcGISSketch(sketch: InsertArcGISSketch): Promise<ArcGISSketch> {
    const id = this.arcgisSketches.size + 1;
    const now = new Date();
    const newSketch: ArcGISSketch = {
      ...sketch,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.arcgisSketches.set(id, newSketch);
    return newSketch;
  }
  
  async updateArcGISSketch(id: number, updates: Partial<InsertArcGISSketch>): Promise<ArcGISSketch> {
    const sketch = this.arcgisSketches.get(id);
    if (!sketch) {
      throw new Error(`ArcGIS sketch with id ${id} not found`);
    }
    
    const updatedSketch = {
      ...sketch,
      ...updates,
      id: sketch.id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.arcgisSketches.set(id, updatedSketch);
    return updatedSketch;
  }
  
  async deleteArcGISSketch(id: number): Promise<boolean> {
    return this.arcgisSketches.delete(id);
  }
  
  // ArcGIS Analysis Results operations
  async getArcGISAnalysisResults(configId: number, userId?: number): Promise<ArcGISAnalysisResult[]> {
    const results: ArcGISAnalysisResult[] = [];
    for (const result of this.arcgisAnalysisResults.values()) {
      if (result.configId === configId) {
        // If userId is provided, filter by it
        if (userId && result.userId !== userId) {
          continue;
        }
        results.push(result);
      }
    }
    // Sort by most recently created
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getArcGISAnalysisResult(id: number): Promise<ArcGISAnalysisResult | undefined> {
    return this.arcgisAnalysisResults.get(id);
  }
  
  async createArcGISAnalysisResult(analysisResult: InsertArcGISAnalysisResult): Promise<ArcGISAnalysisResult> {
    const id = this.arcgisAnalysisResults.size + 1;
    const now = new Date();
    const newResult: ArcGISAnalysisResult = {
      ...analysisResult,
      id,
      createdAt: now
    };
    this.arcgisAnalysisResults.set(id, newResult);
    return newResult;
  }
  
  async deleteArcGISAnalysisResult(id: number): Promise<boolean> {
    return this.arcgisAnalysisResults.delete(id);
  }
  
  // Workflow operations
  async getWorkflows(userId?: number): Promise<Workflow[]> {
    const results: Workflow[] = [];
    for (const workflow of this.workflows.values()) {
      if (!userId || workflow.userId === userId) {
        results.push(workflow);
      }
    }
    // Sort by most recently updated
    return results.sort((a, b) => {
      const dateA = a.updatedAt ? a.updatedAt.getTime() : a.createdAt.getTime();
      const dateB = b.updatedAt ? b.updatedAt.getTime() : b.createdAt.getTime();
      return dateB - dateA;
    });
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }
  
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflows.size + 1;
    const now = new Date();
    const newWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.workflows.set(id, newWorkflow);
    return newWorkflow;
  }
  
  async updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow with id ${id} not found`);
    }
    
    const updatedWorkflow = {
      ...workflow,
      ...updates,
      id: workflow.id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }
  
  // Workflow state operations
  async getWorkflowState(workflowId: number): Promise<WorkflowState | undefined> {
    return this.workflowStates.get(workflowId);
  }
  
  async createWorkflowState(state: InsertWorkflowState): Promise<WorkflowState> {
    const now = new Date();
    const newState: WorkflowState = {
      ...state,
      createdAt: now,
      updatedAt: now
    };
    this.workflowStates.set(state.workflowId, newState);
    return newState;
  }
  
  async updateWorkflowState(workflowId: number, updates: Partial<InsertWorkflowState>): Promise<WorkflowState> {
    // Check if state exists
    const existingState = await this.getWorkflowState(workflowId);
    
    if (existingState) {
      // Update existing state
      const updatedState = {
        ...existingState,
        ...updates,
        workflowId, // Ensure workflowId doesn't change
        updatedAt: new Date()
      };
      
      this.workflowStates.set(workflowId, updatedState);
      return updatedState;
    } else {
      // Create new state if it doesn't exist
      return this.createWorkflowState({
        workflowId,
        currentStep: updates.currentStep || 1,
        formData: updates.formData || {},
        ...updates
      });
    }
  }
  
  // Workflow event operations
  async getWorkflowEvents(workflowId: number): Promise<WorkflowEvent[]> {
    const events = this.workflowEvents.get(workflowId) || [];
    // Sort by most recently created
    return [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createWorkflowEvent(event: InsertWorkflowEvent): Promise<WorkflowEvent> {
    const id = Date.now(); // Use timestamp as unique ID
    const now = new Date();
    const newEvent: WorkflowEvent = {
      ...event,
      id,
      createdAt: now
    };
    
    // Get existing events for this workflow or create a new array
    const events = this.workflowEvents.get(event.workflowId) || [];
    events.push(newEvent);
    
    // Store the updated events
    this.workflowEvents.set(event.workflowId, events);
    
    return newEvent;
  }
  
  // Checklist operations
  async getChecklistItems(workflowId: number): Promise<ChecklistItem[]> {
    const items: ChecklistItem[] = [];
    for (const item of this.checklistItems.values()) {
      if (item.workflowId === workflowId) {
        items.push(item);
      }
    }
    // Sort by order
    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  
  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    return this.checklistItems.get(id);
  }
  
  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const id = this.checklistItems.size + 1;
    const now = new Date();
    const newItem: ChecklistItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.checklistItems.set(id, newItem);
    return newItem;
  }
  
  async updateChecklistItem(id: number, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem> {
    const item = this.checklistItems.get(id);
    if (!item) {
      throw new Error(`Checklist item with id ${id} not found`);
    }
    
    const updatedItem = {
      ...item,
      ...updates,
      id: item.id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.checklistItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteChecklistItem(id: number): Promise<boolean> {
    return this.checklistItems.delete(id);
  }

  // Data Quality Rule operations
  private dataQualityRules = new Map<number, DataQualityRule>();
  private dataQualityEvaluations = new Map<number, DataQualityEvaluation>();
  private dataQualityScores = new Map<string, DataQualityScore>(); // Key is `${entityType}-${entityId}`

  async getDataQualityRules(dimension?: string, entityType?: string, importance?: string): Promise<DataQualityRule[]> {
    const rules: DataQualityRule[] = [];
    
    for (const rule of this.dataQualityRules.values()) {
      let matches = true;
      
      if (dimension && rule.dimension !== dimension) {
        matches = false;
      }
      
      if (entityType && rule.entityType !== entityType) {
        matches = false;
      }
      
      if (importance && rule.importance !== importance) {
        matches = false;
      }
      
      if (matches) {
        rules.push(rule);
      }
    }
    
    return rules;
  }

  async getDataQualityRule(id: number): Promise<DataQualityRule | undefined> {
    return this.dataQualityRules.get(id);
  }

  async createDataQualityRule(rule: InsertDataQualityRule): Promise<DataQualityRule> {
    const id = this.dataQualityRules.size + 1;
    const now = new Date();
    
    const newRule: DataQualityRule = {
      ...rule,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.dataQualityRules.set(id, newRule);
    return newRule;
  }

  async updateDataQualityRule(id: number, updates: Partial<InsertDataQualityRule>): Promise<DataQualityRule> {
    const rule = this.dataQualityRules.get(id);
    
    if (!rule) {
      throw new Error(`Data quality rule with ID ${id} not found`);
    }
    
    const updatedRule: DataQualityRule = {
      ...rule,
      ...updates,
      id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.dataQualityRules.set(id, updatedRule);
    return updatedRule;
  }

  // Data Quality Evaluation operations
  async evaluateDataQualityRule(ruleId: number, entityType: string, entityId: number, userId?: number): Promise<DataQualityEvaluation> {
    const rule = await this.getDataQualityRule(ruleId);
    
    if (!rule) {
      throw new Error(`Data quality rule with ID ${ruleId} not found`);
    }
    
    // In a real implementation, this would apply the rule's validation logic
    // For now, simulate a rule evaluation with a simple pass/fail
    const passed = Math.random() > 0.3; // 70% pass rate for simulation
    const score = passed ? 1.0 : 0.0;
    
    const id = this.dataQualityEvaluations.size + 1;
    const evaluation: DataQualityEvaluation = {
      id,
      ruleId,
      entityType,
      entityId,
      passed,
      score,
      details: {
        issues: passed ? [] : [`Simulated issue for ${entityType} ${entityId}`],
        affectedFields: passed ? [] : ['field1', 'field2'],
        metadata: { simulatedEvaluation: true }
      },
      evaluatedAt: new Date(),
      evaluatedBy: userId
    };
    
    this.dataQualityEvaluations.set(id, evaluation);
    
    // Update the entity's overall quality score
    await this.updateEntityQualityScore(entityType, entityId);
    
    return evaluation;
  }

  async getDataQualityEvaluations(entityType: string, entityId: number, limit: number = 10): Promise<DataQualityEvaluation[]> {
    const evaluations: DataQualityEvaluation[] = [];
    
    for (const evaluation of this.dataQualityEvaluations.values()) {
      if (evaluation.entityType === entityType && evaluation.entityId === entityId) {
        evaluations.push(evaluation);
      }
    }
    
    // Sort by most recent first and apply limit
    return evaluations
      .sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime())
      .slice(0, limit);
  }

  // Data Quality Score operations
  async getDataQualityScore(entityType: string, entityId: number): Promise<DataQualityScore | undefined> {
    const key = `${entityType}-${entityId}`;
    return this.dataQualityScores.get(key);
  }

  async updateDataQualityScore(entityType: string, entityId: number, scoreData: Partial<InsertDataQualityScore>): Promise<DataQualityScore> {
    const key = `${entityType}-${entityId}`;
    const existingScore = this.dataQualityScores.get(key);
    
    if (existingScore) {
      const updatedScore: DataQualityScore = {
        ...existingScore,
        ...scoreData,
        lastEvaluatedAt: new Date()
      };
      
      this.dataQualityScores.set(key, updatedScore);
      return updatedScore;
    } else {
      // Create new score entry
      const id = this.dataQualityScores.size + 1;
      const newScore: DataQualityScore = {
        id,
        entityType,
        entityId,
        overallScore: scoreData.overallScore || 0,
        dimensionScores: scoreData.dimensionScores || {},
        passedRules: scoreData.passedRules || 0,
        totalRules: scoreData.totalRules || 0,
        lastEvaluatedAt: new Date()
      };
      
      this.dataQualityScores.set(key, newScore);
      return newScore;
    }
  }

  // Helper methods
  private async updateEntityQualityScore(entityType: string, entityId: number): Promise<void> {
    // Get all evaluations for this entity
    const evaluations = await this.getDataQualityEvaluations(entityType, entityId, Number.MAX_SAFE_INTEGER);
    
    if (evaluations.length === 0) {
      return; // No evaluations to calculate score from
    }
    
    // Calculate overall score and dimension scores
    const passedRules = evaluations.filter(e => e.passed).length;
    const totalRules = evaluations.length;
    const overallScore = totalRules > 0 ? passedRules / totalRules : 0;
    
    // Calculate dimension scores
    const dimensionScores: Record<string, number> = {};
    const dimensionCounts: Record<string, { passed: number, total: number }> = {};
    
    for (const evaluation of evaluations) {
      const rule = await this.getDataQualityRule(evaluation.ruleId);
      
      if (rule) {
        const dimension = rule.dimension;
        
        if (!dimensionCounts[dimension]) {
          dimensionCounts[dimension] = { passed: 0, total: 0 };
        }
        
        dimensionCounts[dimension].total++;
        
        if (evaluation.passed) {
          dimensionCounts[dimension].passed++;
        }
      }
    }
    
    // Calculate score for each dimension
    for (const [dimension, counts] of Object.entries(dimensionCounts)) {
      dimensionScores[dimension] = counts.total > 0 ? counts.passed / counts.total : 0;
    }
    
    // Update the score
    await this.updateDataQualityScore(entityType, entityId, {
      overallScore,
      dimensionScores,
      passedRules,
      totalRules
    });
  }

  // Parcel operations
  async getParcelByNumber(parcelNumber: string): Promise<Parcel | undefined> {
    return this.parcelsByNumber.get(parcelNumber);
  }

  async getParcelById(id: number): Promise<Parcel | undefined> {
    return this.parcels.get(id);
  }

  async getParcelInfo(id: number): Promise<Parcel | undefined> {
    return this.parcels.get(id);
  }

  async createParcel(parcel: InsertParcel): Promise<Parcel> {
    const id = parcel.id || this.parcels.size + 1;
    const now = new Date();
    const newParcel: Parcel = {
      ...parcel,
      id,
      createdAt: parcel.createdAt || now,
      updatedAt: now
    };
    
    this.parcels.set(id, newParcel);
    
    // Also store by parcel number for quick lookups
    if (newParcel.parcelNumber) {
      this.parcelsByNumber.set(newParcel.parcelNumber, newParcel);
    }
    
    return newParcel;
  }

  async searchParcelsByAddress(address: string): Promise<Parcel[]> {
    const searchTerm = address.toLowerCase();
    const results: Parcel[] = [];
    
    for (const parcel of this.parcels.values()) {
      if (parcel.address && parcel.address.toLowerCase().includes(searchTerm)) {
        results.push(parcel);
      }
    }
    
    return results;
  }

  async searchParcelsByNumber(parcelNumber: string): Promise<Parcel[]> {
    const searchTerm = parcelNumber.toLowerCase();
    const results: Parcel[] = [];
    
    for (const parcel of this.parcels.values()) {
      if (parcel.parcelNumber && parcel.parcelNumber.toLowerCase().includes(searchTerm)) {
        results.push(parcel);
      }
    }
    
    return results;
  }

  async getAllParcels(): Promise<Parcel[]> {
    return Array.from(this.parcels.values());
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    return this.standardDocuments.get(id);
  }

  async getDocuments(filter?: any): Promise<Document[]> {
    const results: Document[] = [];
    
    for (const doc of this.standardDocuments.values()) {
      let matches = true;
      
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          if (doc[key as keyof Document] !== value) {
            matches = false;
            break;
          }
        }
      }
      
      if (matches) {
        results.push(doc);
      }
    }
    
    return results;
  }

  async getDocumentsForParcel(parcelId: number): Promise<Document[]> {
    const results: Document[] = [];
    
    for (const doc of this.standardDocuments.values()) {
      if (doc.parcelId === parcelId) {
        results.push(doc);
      }
    }
    
    return results;
  }

  // Document-Parcel Link operations
  async getDocumentParcelLink(documentId: number, parcelId: number): Promise<any | undefined> {
    const key = `${documentId}-${parcelId}`;
    return this.documentParcelLinks.get(key);
  }

  async createDocumentParcelLink(link: any): Promise<any> {
    const { documentId, parcelId } = link;
    const key = `${documentId}-${parcelId}`;
    
    // Check if the link already exists
    const existingLink = await this.getDocumentParcelLink(documentId, parcelId);
    
    if (existingLink) {
      return { ...existingLink, alreadyExists: true };
    }
    
    this.documentParcelLinks.set(key, link);
    return link;
  }

  async removeDocumentParcelLinks(documentId: number): Promise<boolean> {
    let removed = false;
    
    for (const [key, link] of this.documentParcelLinks.entries()) {
      if (key.startsWith(`${documentId}-`)) {
        this.documentParcelLinks.delete(key);
        removed = true;
      }
    }
    
    return removed;
  }

  async getParcelsForDocument(documentId: number): Promise<Parcel[]> {
    const results: Parcel[] = [];
    
    for (const [key, link] of this.documentParcelLinks.entries()) {
      if (key.startsWith(`${documentId}-`)) {
        const parcelId = link.parcelId;
        const parcel = await this.getParcelById(parcelId);
        
        if (parcel) {
          results.push(parcel);
        }
      }
    }
    
    return results;
  }
  
  // Document-Parcel Relationship operations
  async getDocumentParcelRelationship(id: number): Promise<DocumentParcelRelationship | undefined> {
    return this.documentParcelRelationships.get(id);
  }
  
  async getDocumentParcelRelationshipByDocumentAndParcel(
    documentId: number, 
    parcelId: number, 
    relationshipType?: string
  ): Promise<DocumentParcelRelationship | undefined> {
    for (const relationship of this.documentParcelRelationships.values()) {
      if (
        relationship.documentId === documentId && 
        relationship.parcelId === parcelId && 
        (relationshipType === undefined || relationship.relationshipType === relationshipType)
      ) {
        return relationship;
      }
    }
    return undefined;
  }
  
  async getDocumentParcelRelationshipsForDocument(documentId: number): Promise<DocumentParcelRelationship[]> {
    const results: DocumentParcelRelationship[] = [];
    
    for (const relationship of this.documentParcelRelationships.values()) {
      if (relationship.documentId === documentId) {
        results.push(relationship);
      }
    }
    
    return results;
  }
  
  async getDocumentParcelRelationshipsForParcel(parcelId: number): Promise<DocumentParcelRelationship[]> {
    const results: DocumentParcelRelationship[] = [];
    
    for (const relationship of this.documentParcelRelationships.values()) {
      if (relationship.parcelId === parcelId) {
        results.push(relationship);
      }
    }
    
    return results;
  }
  
  async createDocumentParcelRelationship(relationship: InsertDocumentParcelRelationship): Promise<DocumentParcelRelationship> {
    const id = this.documentParcelRelationships.size + 1;
    const now = new Date();
    
    const newRelationship: DocumentParcelRelationship = {
      ...relationship,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.documentParcelRelationships.set(id, newRelationship);
    return newRelationship;
  }
  
  async updateDocumentParcelRelationship(id: number, updates: Partial<InsertDocumentParcelRelationship>): Promise<DocumentParcelRelationship> {
    const relationship = this.documentParcelRelationships.get(id);
    
    if (!relationship) {
      throw new Error(`Document-parcel relationship with id ${id} not found`);
    }
    
    const updatedRelationship: DocumentParcelRelationship = {
      ...relationship,
      ...updates,
      id: relationship.id, // Ensure ID doesn't change
      updatedAt: new Date()
    };
    
    this.documentParcelRelationships.set(id, updatedRelationship);
    return updatedRelationship;
  }
  
  async deleteDocumentParcelRelationship(id: number): Promise<boolean> {
    return this.documentParcelRelationships.delete(id);
  }

  async updateDocumentClassification(id: number, classification: string): Promise<Document> {
    const document = await this.getDocument(id);
    
    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    const updatedDocument = {
      ...document,
      classification
    };
    
    this.standardDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  // Map layer operations
  async getMapLayers(): Promise<any[]> {
    return Array.from(this.mapLayers.values());
  }

  async updateMapLayer(id: number, data: any): Promise<any> {
    const layer = this.mapLayers.get(id);
    
    if (!layer) {
      throw new Error(`Map layer with id ${id} not found`);
    }
    
    const updatedLayer = {
      ...layer,
      ...data,
      id: layer.id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.mapLayers.set(id, updatedLayer);
    return updatedLayer;
  }

  async getVisibleMapLayers(): Promise<any[]> {
    const layers = await this.getMapLayers();
    return layers.filter(layer => layer.visible);
  }

  // Additional Map Preference operations
  async getMapPreference(id: number): Promise<MapPreference | undefined> {
    return this.mapPreferences.get(id);
  }

  async createOrUpdateMapPreference(data: any): Promise<MapPreference> {
    const { userId } = data;
    
    // Check if a preference already exists for this user
    const existingPrefs = await this.getMapPreferences(userId);
    
    if (existingPrefs) {
      return this.updateMapPreferences(userId, data);
    } else {
      return this.createMapPreferences(data);
    }
  }

  // Report operations
  private reportTemplates = new Map<number, any>();
  private reports = new Map<number, any>();
  private reportData = new Map<number, any>();
  private reportExports = new Map<number, any>();
  private reportSchedules = new Map<number, any>();

  async getReportTemplates(): Promise<any[]> {
    return Array.from(this.reportTemplates.values());
  }

  async getReportTemplate(id: number): Promise<any> {
    const template = this.reportTemplates.get(id);
    
    if (!template) {
      throw new Error(`Report template with id ${id} not found`);
    }
    
    return template;
  }

  async createReportTemplate(template: any): Promise<any> {
    const id = template.id || this.reportTemplates.size + 1;
    const now = new Date();
    const newTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.reportTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async getReport(id: number): Promise<any> {
    const report = this.reports.get(id);
    
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }
    
    return report;
  }

  async getReports(userId: number): Promise<any[]> {
    const results: any[] = [];
    
    for (const report of this.reports.values()) {
      if (report.userId === userId) {
        results.push(report);
      }
    }
    
    return results;
  }

  async createReport(report: any): Promise<any> {
    const id = report.id || this.reports.size + 1;
    const now = new Date();
    const newReport = {
      ...report,
      id,
      createdAt: now,
      updatedAt: now,
      status: report.status || 'pending'
    };
    
    this.reports.set(id, newReport);
    return newReport;
  }

  async updateReport(id: number, data: any): Promise<any> {
    const report = this.reports.get(id);
    
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }
    
    const updatedReport = {
      ...report,
      ...data,
      id: report.id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async generateReportData(reportId: number): Promise<any> {
    const report = await this.getReport(reportId);
    
    // Simulate report data generation
    const data = {
      reportId,
      generatedAt: new Date(),
      data: {
        summary: `Generated data for report: ${report.title}`,
        sections: [
          {
            title: 'Section 1',
            content: 'Sample content for section 1'
          },
          {
            title: 'Section 2',
            content: 'Sample content for section 2'
          }
        ]
      }
    };
    
    this.reportData.set(reportId, data);
    return data;
  }

  async getReportData(reportId: number): Promise<any> {
    const data = this.reportData.get(reportId);
    
    if (!data) {
      throw new Error(`Report data for report id ${reportId} not found`);
    }
    
    return data;
  }

  async exportReport(reportId: number, format: string): Promise<any> {
    await this.getReport(reportId);
    
    // Simulate report export generation
    const exportId = Date.now();
    const exportData = {
      id: exportId,
      reportId,
      format,
      createdAt: new Date(),
      downloadUrl: `/api/report-exports/${exportId}/download`,
      status: 'completed'
    };
    
    this.reportExports.set(exportId, exportData);
    return exportData;
  }

  async getReportExport(exportId: number): Promise<any> {
    const exportData = this.reportExports.get(exportId);
    
    if (!exportData) {
      throw new Error(`Report export with id ${exportId} not found`);
    }
    
    return exportData;
  }

  async generateReportPreview(templateId: number, data: any): Promise<any> {
    const template = await this.getReportTemplate(templateId);
    
    // Simulate preview generation
    return {
      templateId,
      previewedAt: new Date(),
      preview: `Preview of ${template.name} with data: ${JSON.stringify(data).substring(0, 100)}...`
    };
  }

  async getReportSchedules(userId: number): Promise<any[]> {
    const results: any[] = [];
    
    for (const schedule of this.reportSchedules.values()) {
      if (schedule.userId === userId) {
        results.push(schedule);
      }
    }
    
    return results;
  }

  async getReportSchedule(id: number): Promise<any> {
    const schedule = this.reportSchedules.get(id);
    
    if (!schedule) {
      throw new Error(`Report schedule with id ${id} not found`);
    }
    
    return schedule;
  }

  async createReportSchedule(schedule: any): Promise<any> {
    const id = schedule.id || this.reportSchedules.size + 1;
    const now = new Date();
    const newSchedule = {
      ...schedule,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.reportSchedules.set(id, newSchedule);
    return newSchedule;
  }

  async updateReportSchedule(id: number, data: any): Promise<any> {
    const schedule = this.reportSchedules.get(id);
    
    if (!schedule) {
      throw new Error(`Report schedule with id ${id} not found`);
    }
    
    const updatedSchedule = {
      ...schedule,
      ...data,
      id: schedule.id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.reportSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteReportSchedule(id: number): Promise<boolean> {
    return this.reportSchedules.delete(id);
  }

  // Additional operations
  async generateParcelNumbers(count: number): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate a realistic-looking parcel number
      const section = Math.floor(Math.random() * 36) + 1;
      const township = Math.floor(Math.random() * 20) + 1;
      const range = Math.floor(Math.random() * 30) + 1;
      
      const parcelNumber = `${section}-${township}-${range}-${i.toString().padStart(4, '0')}`;
      results.push(parcelNumber);
    }
    
    return results;
  }

  async generateSM00Report(parcelIds: number[]): Promise<any> {
    // Simulate SM00 report generation
    return {
      id: Date.now(),
      type: 'SM00',
      generatedAt: new Date(),
      parcelIds,
      data: {
        summary: `SM00 Report for ${parcelIds.length} parcels`,
        parcels: await Promise.all(parcelIds.map(id => this.getParcelInfo(id)))
      }
    };
  }

  async queryAssistant(query: string): Promise<any> {
    // Simulate AI assistant response
    return {
      query,
      response: `Response to query: ${query}`,
      timestamp: new Date()
    };
  }
}

// Use MemStorage for all storage operations as we're currently prototyping.
// Switch to DatabaseStorage when moving to production with persistent storage
export const storage = new MemStorage();