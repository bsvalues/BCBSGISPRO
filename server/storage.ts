import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  users, 
  mapBookmarks,
  mapPreferences,
  recentlyViewedParcels,
  type User,
  type InsertUser,
  type MapBookmark,
  type InsertMapBookmark,
  type MapPreference,
  type InsertMapPreference,
  type RecentlyViewedParcel,
  type InsertRecentlyViewedParcel
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
}

// Class removed to simplify file
export class MemStorage implements IStorage {
  // Implementation removed to simplify file
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
}

// Use DatabaseStorage for all storage operations
export const storage = new DatabaseStorage();