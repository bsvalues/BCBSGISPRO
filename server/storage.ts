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
  type InsertArcGISAnalysisResult
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
  
  // Map bookmarks operations
  getMapBookmarks(userId: number): Promise<MapBookmark[]>;
  getMapBookmark(id: number): Promise<MapBookmark | undefined>;
  createMapBookmark(bookmark: InsertMapBookmark): Promise<MapBookmark>;
  updateMapBookmark(id: number, updates: Partial<InsertMapBookmark>): Promise<MapBookmark>;
  deleteMapBookmark(id: number): Promise<boolean>;
  
  // Map preferences operations
  getMapPreferences(userId: number): Promise<MapPreference | undefined>;
  createMapPreferences(preferences: InsertMapPreference): Promise<MapPreference>;
  updateMapPreferences(userId: number, updates: Partial<InsertMapPreference>): Promise<MapPreference>;
  
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
}

// Implementation of storage interface using the database
export class DatabaseStorage implements IStorage {
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
}

// Class removed to simplify file
export class MemStorage implements IStorage {
  // In-memory storage using Maps
  private users: Map<number, User> = new Map();
  private mapBookmarks: Map<number, MapBookmark> = new Map();
  private mapPreferences: Map<number, MapPreference> = new Map();
  private recentlyViewedParcels: Map<string, RecentlyViewedParcel> = new Map();
  private documents: Map<string, DocumentEntity> = new Map();
  private documentEvents: Map<string, DocumentLineageEvent[]> = new Map();
  private documentRelationships: Map<string, DocumentRelationship[]> = new Map();
  private processingStages: Map<string, DocumentProcessingStage> = new Map();

  // ArcGIS in-memory storage
  private arcgisMapConfigs: Map<number, ArcGISMapConfig> = new Map();
  private arcgisLayers: Map<number, ArcGISLayer> = new Map();
  private arcgisSketches: Map<number, ArcGISSketch> = new Map();
  private arcgisAnalysisResults: Map<number, ArcGISAnalysisResult> = new Map();
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
}

// Use MemStorage for all storage operations as we're currently prototyping.
// Switch to DatabaseStorage when moving to production with persistent storage
export const storage = new MemStorage();