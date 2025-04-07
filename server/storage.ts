import { 
  type Parcel, type Document, type Annotation,
  type MapBookmark, type InsertMapBookmark,
  type MapPreference, type InsertMapPreference,
  type User, type InsertUser,
  type RecentlyViewedParcel, type InsertRecentlyViewedParcel,
  type SearchHistory, type InsertSearchHistory,
  type SearchSuggestion, type InsertSearchSuggestion,
  type MapLayer, type InsertMapLayer,
  type Workflow, type InsertWorkflow,
  type WorkflowEvent, type InsertWorkflowEvent,
  type WorkflowState, type InsertWorkflowState,
  type ChecklistItem, type InsertChecklistItem,
  type DocumentVersion, type InsertDocumentVersion,
  type DocumentParcelLink, type InsertDocumentParcelLink,
  type MapViewState,
  users, workflows, workflowEvents, workflowStates, checklistItems,
  documents, documentVersions, documentParcelLinks, parcels, mapLayers,
  searchHistory, searchSuggestions, mapBookmarks, mapPreferences,
  recentlyViewedParcels
} from "../shared/schema";
import { DocumentType } from "../shared/document-types";
import session from "express-session";
import createMemoryStore from "memorystore";
import { 
  type DocumentEntity, type InsertDocumentEntity,
  type DocumentLineageEvent, type InsertDocumentLineageEvent,
  type DocumentRelationship, type InsertDocumentRelationship,
  type DocumentProcessingStage, type InsertDocumentProcessingStage,
  type DocumentLineageGraph
} from "../shared/document-lineage-schema";
import { v4 as uuidv4 } from 'uuid';
import { documentLineageStorage } from './document-lineage-storage';
import { eq, and, desc, asc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { db } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Modify the storage interface to include all required CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session management
  sessionStore: ReturnType<typeof createMemoryStore>;
  
  // Workflow operations
  getWorkflows(userId: number | undefined): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  
  // Workflow events operations
  getWorkflowEvents(workflowId: number): Promise<WorkflowEvent[]>;
  createWorkflowEvent(event: InsertWorkflowEvent): Promise<WorkflowEvent>;
  
  // Workflow state operations
  getWorkflowState(workflowId: number): Promise<WorkflowState | undefined>;
  updateWorkflowState(workflowId: number, state: InsertWorkflowState): Promise<WorkflowState>;
  
  // Checklist operations
  getChecklistItems(workflowId: number): Promise<ChecklistItem[]>;
  updateChecklistItem(itemId: number, completed: boolean): Promise<ChecklistItem>;
  createChecklistItem(item: Partial<{
    workflowId: number;
    title: string;
    description: string;
    completed: boolean;
    order: number;
  }>): Promise<ChecklistItem>;
  
  // Document Lineage operations
  // Document entity operations
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
  getCompleteLineageGraph(documentIds: string[], depth?: number): Promise<DocumentLineageGraph>;
  
  // Document operations
  getDocuments(workflowId?: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  addDocument(params: {
    workflowId?: number; 
    name: string;
    type: DocumentType;
    contentType: string;
    contentHash: string;
    storageKey: string;
    classification?: {
      documentType: string;
      confidence: number;
      wasManuallyClassified: boolean;
      classifiedAt: string;
    };
    content: string;
  }): Promise<Document>;
  updateDocumentClassification(documentId: number, classification: {
    documentType: string;
    confidence: number;
    wasManuallyClassified: boolean;
    classifiedAt: string;
  }): Promise<Document>;
  
  // Document versions
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  addDocumentVersion(params: {
    documentId: number;
    versionNumber: number;
    contentHash: string;
    storageKey: string;
    notes?: string;
    content: string;
  }): Promise<DocumentVersion>;
  
  // Document-parcel links
  getDocumentParcelLink(documentId: number, parcelId: number): Promise<DocumentParcelLink | undefined>;
  createDocumentParcelLink(link: InsertDocumentParcelLink): Promise<DocumentParcelLink>;
  removeDocumentParcelLinks(documentId: number, parcelIds?: number[]): Promise<number>;
  getParcelsForDocument(documentId: number): Promise<Parcel[]>;
  getDocumentsForParcel(parcelId: number): Promise<Document[]>;
  getParcelById(id: number): Promise<Parcel | undefined>;
  searchParcelsByNumber(parcelNumber: string): Promise<Parcel[]>;
  
  // Parcel operations
  generateParcelNumbers(parentParcelId: string, count: number): Promise<string[]>;
  getParcelInfo(parcelId: string): Promise<any | undefined>;
  searchParcelsByAddress(address: string, city?: string, zip?: string): Promise<any[]>;
  getParcelByNumber(parcelNumber: string): Promise<Parcel | undefined>;
  createParcel(parcel: any): Promise<Parcel>;
  getAllParcels(): Promise<Parcel[]>;
  
  // Map operations
  getMapLayers(): Promise<MapLayer[]>;
  getVisibleMapLayers(): Promise<MapLayer[]>;
  updateMapLayer(id: number, updates: Partial<{
    visible: boolean;
    opacity: number;
    zindex: number;
    order: number;
  }>): Promise<MapLayer>;
  
  // Report operations
  generateSM00Report(startDate: string, endDate: string): Promise<any>;
  
  // Assistant operations
  queryAssistant(query: string): Promise<string>;
  
  // Search operations
  getSearchHistory(userId?: number, limit?: number): Promise<SearchHistory[]>;
  saveSearchQuery(query: string, type: string, userId?: number, results?: number): Promise<SearchHistory>;
  getSearchSuggestions(prefix: string, type?: string, limit?: number): Promise<SearchSuggestion[]>;
  addSearchSuggestion(term: string, type: string, priority?: number, metadata?: any): Promise<SearchSuggestion>;
  
  // Map bookmarks operations
  getMapBookmarks(userId: number): Promise<MapBookmark[]>;
  getMapBookmark(id: number): Promise<MapBookmark | undefined>;
  createMapBookmark(bookmark: InsertMapBookmark): Promise<MapBookmark>;
  updateMapBookmark(id: number, updates: Partial<Omit<InsertMapBookmark, 'id'>>): Promise<MapBookmark>;
  deleteMapBookmark(id: number): Promise<boolean>;
  
  // Map preferences operations
  getMapPreference(userId: number): Promise<MapPreference | undefined>;
  getMapPreferences(userId: number): Promise<MapPreference | undefined>;
  createMapPreferences(preference: InsertMapPreference): Promise<MapPreference>;
  createOrUpdateMapPreference(preference: InsertMapPreference): Promise<MapPreference>;
  updateMapPreferences(userId: number, updates: Partial<Omit<InsertMapPreference, 'id'>>): Promise<MapPreference>;
  resetMapPreferences(userId: number): Promise<MapPreference>;
  
  // Recently viewed parcels operations
  getRecentlyViewedParcels(userId: number, limit?: number): Promise<RecentlyViewedParcel[]>;
  addRecentlyViewedParcel(data: InsertRecentlyViewedParcel): Promise<RecentlyViewedParcel>;
  removeRecentlyViewedParcel(id: number): Promise<boolean>;
  clearRecentlyViewedParcels(userId: number): Promise<boolean>;
  
  
}

// The document lineage imports are already available from the top of the file

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private workflowStates: Map<number, WorkflowState>;
  private workflowEvents: Map<number, WorkflowEvent>;
  private checklistItems: Map<number, ChecklistItem>;
  private documents: Map<number, Document>;
  private parcels: Map<number, Parcel>;
  private mapLayers: Map<number, MapLayer>;
  private searchHistory: Map<number, SearchHistory>;
  private searchSuggestions: Map<number, SearchSuggestion>;
  private mapBookmarks: Map<number, MapBookmark>;
  private mapPreferences: Map<number, MapPreference>;
  private recentlyViewedParcels: Map<number, RecentlyViewedParcel>;
  
  // Document lineage storage
  private documentEntities: Map<string, DocumentEntity>;
  private documentLineageEvents: Map<string, DocumentLineageEvent>;
  private documentRelationships: Map<string, DocumentRelationship>;
  private documentProcessingStages: Map<string, DocumentProcessingStage>;
  
  sessionStore: ReturnType<typeof createMemoryStore>;
  
  userId: number;
  workflowId: number;
  stateId: number;
  workflowEventId: number;
  checklistId: number;
  documentId: number;
  parcelId: number;
  layerId: number;
  reportId: number;
  searchHistoryId: number;
  searchSuggestionId: number;
  mapBookmarkId: number;
  mapPreferenceId: number;
  recentlyViewedParcelId: number;
  
  // Document lineage IDs (using UUIDs for string IDs)
  private nextDocEntityId: number;
  private nextLineageEventId: number;
  private nextRelationshipId: number;
  private nextProcessingStageId: number;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.workflowStates = new Map();
    this.workflowEvents = new Map();
    this.checklistItems = new Map();
    this.documents = new Map();
    this.parcels = new Map();
    this.mapLayers = new Map();
    this.sm00Reports = new Map();
    this.searchHistory = new Map();
    this.searchSuggestions = new Map();
    this.mapBookmarks = new Map();
    this.mapPreferences = new Map();
    this.recentlyViewedParcels = new Map();
    
    // Initialize document lineage storage
    this.documentEntities = new Map();
    this.documentLineageEvents = new Map();
    this.documentRelationships = new Map();
    this.documentProcessingStages = new Map();
    
    this.userId = 1;
    this.workflowId = 1;
    this.stateId = 1;
    this.workflowEventId = 1;
    this.checklistId = 1;
    this.documentId = 1;
    this.parcelId = 1;
    this.layerId = 1;
    this.reportId = 1;
    this.searchHistoryId = 1;
    this.searchSuggestionId = 1;
    this.mapBookmarkId = 1;
    this.mapPreferenceId = 1;
    this.recentlyViewedParcelId = 1;
    
    // Initialize document lineage IDs
    this.nextDocEntityId = 1;
    this.nextLineageEventId = 1;
    this.nextRelationshipId = 1;
    this.nextProcessingStageId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize some map layers
    this.initializeMapLayers();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      department: insertUser.department || null,
      isAdmin: false,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Workflow operations
  async getWorkflows(userId: number | undefined): Promise<Workflow[]> {
    if (!userId) return [];
    return Array.from(this.workflows.values()).filter(
      (workflow) => workflow.userId === userId,
    );
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }
  
  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflowId++;
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(id, workflow);
    
    // Create initial workflow state
    this.createInitialWorkflowState(id);
    
    // Create default checklist items based on workflow type
    this.createDefaultChecklistItems(id, insertWorkflow.type);
    
    // Create workflow creation event
    await this.createWorkflowEvent({
      workflowId: id,
      eventType: "created",
      description: `Workflow created: ${insertWorkflow.title}`,
      metadata: {
        workflowType: insertWorkflow.type,
        userId: insertWorkflow.userId
      }
    });
    
    return workflow;
  }
  
  // Workflow events operations
  async getWorkflowEvents(workflowId: number): Promise<WorkflowEvent[]> {
    return Array.from(this.workflowEvents.values())
      .filter(event => event.workflowId === workflowId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createWorkflowEvent(event: InsertWorkflowEvent): Promise<WorkflowEvent> {
    const id = this.workflowEventId++;
    const workflowEvent: WorkflowEvent = {
      id,
      workflowId: event.workflowId,
      eventType: event.eventType,
      description: event.description,
      metadata: event.metadata || {},
      createdAt: new Date(),
      createdBy: event.createdBy || null,
    };
    
    this.workflowEvents.set(id, workflowEvent);
    return workflowEvent;
  }
  
  // Workflow state operations
  async getWorkflowState(workflowId: number): Promise<WorkflowState | undefined> {
    return Array.from(this.workflowStates.values()).find(
      (state) => state.workflowId === workflowId,
    );
  }
  
  async updateWorkflowState(workflowId: number, state: InsertWorkflowState): Promise<WorkflowState> {
    const existingState = await this.getWorkflowState(workflowId);
    
    if (existingState) {
      const updatedState: WorkflowState = {
        ...existingState,
        currentStep: state.currentStep,
        formData: state.formData,
        updatedAt: new Date(),
      };
      this.workflowStates.set(existingState.id, updatedState);
      return updatedState;
    } else {
      const id = this.stateId++;
      const newState: WorkflowState = {
        id,
        workflowId,
        currentStep: state.currentStep,
        formData: state.formData,
        updatedAt: new Date(),
      };
      this.workflowStates.set(id, newState);
      return newState;
    }
  }
  
  // Checklist operations
  async getChecklistItems(workflowId: number): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values())
      .filter((item) => item.workflowId === workflowId)
      .sort((a, b) => a.order - b.order);
  }
  
  async updateChecklistItem(itemId: number, completed: boolean): Promise<ChecklistItem> {
    const item = this.checklistItems.get(itemId);
    if (!item) {
      throw new Error(`Checklist item with ID ${itemId} not found`);
    }
    
    const updatedItem: ChecklistItem = {
      ...item,
      completed,
    };
    this.checklistItems.set(itemId, updatedItem);
    return updatedItem;
  }
  
  async createChecklistItem(item: Partial<{
    workflowId: number;
    title: string;
    description: string;
    completed: boolean;
    order: number;
  }>): Promise<ChecklistItem> {
    if (!item.workflowId || !item.title || item.order === undefined) {
      throw new Error("Checklist item must have workflowId, title, and order");
    }
    
    const id = this.checklistId++;
    const checklistItem: ChecklistItem = {
      id,
      workflowId: item.workflowId,
      title: item.title,
      description: item.description || null,
      completed: item.completed || false,
      order: item.order,
    };
    
    this.checklistItems.set(id, checklistItem);
    return checklistItem;
  }
  
  // Document operations
  // Additional storage for document management
  private documentVersions: Map<number, DocumentVersion> = new Map();
  private documentParcelLinks: Map<number, DocumentParcelLink> = new Map();
  private documentVersionId: number = 1;
  private documentParcelLinkId: number = 1;
  
  async getDocuments(workflowId?: number): Promise<Document[]> {
    if (workflowId === undefined) {
      return Array.from(this.documents.values())
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    }
    return Array.from(this.documents.values())
      .filter((doc) => doc.workflowId === workflowId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async addDocument(params: {
    workflowId?: number; 
    name: string;
    type: DocumentType;
    contentType: string;
    contentHash: string;
    storageKey: string;
    classification?: {
      documentType: string;
      confidence: number;
      wasManuallyClassified: boolean;
      classifiedAt: string;
    };
    content: string;
  }): Promise<Document> {
    const id = this.documentId++;
    const document: Document = {
      id,
      workflowId: params.workflowId || null,
      name: params.name,
      type: params.type,
      contentType: params.contentType,
      contentHash: params.contentHash,
      storageKey: params.storageKey,
      classification: params.classification || null,
      uploadedAt: new Date(),
      updatedAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }
  
  async updateDocumentClassification(documentId: number, classification: {
    documentType: string;
    confidence: number;
    wasManuallyClassified: boolean;
    classifiedAt: string;
  }): Promise<Document> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    const updatedDocument = {
      ...document,
      type: classification.documentType as DocumentType,
      classification,
      updatedAt: new Date()
    };
    
    this.documents.set(documentId, updatedDocument);
    return updatedDocument;
  }
  
  // Document version operations
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return Array.from(this.documentVersions.values())
      .filter(version => version.documentId === documentId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }
  
  async addDocumentVersion(params: {
    documentId: number;
    versionNumber: number;
    contentHash: string;
    storageKey: string;
    notes?: string;
    content: string; // Base64 content, not actually stored in the database
  }): Promise<DocumentVersion> {
    const id = this.documentVersionId++;
    const version: DocumentVersion = {
      id,
      documentId: params.documentId,
      versionNumber: params.versionNumber,
      contentHash: params.contentHash,
      storageKey: params.storageKey,
      notes: params.notes || null,
      createdAt: new Date()
    };
    
    this.documentVersions.set(id, version);
    return version;
  }
  
  // Document-parcel link operations
  async getDocumentParcelLink(documentId: number, parcelId: number): Promise<DocumentParcelLink | undefined> {
    return Array.from(this.documentParcelLinks.values()).find(
      link => link.documentId === documentId && link.parcelId === parcelId
    );
  }
  
  async createDocumentParcelLink(link: InsertDocumentParcelLink): Promise<DocumentParcelLink> {
    const id = this.documentParcelLinkId++;
    const documentParcelLink: DocumentParcelLink = {
      id,
      documentId: link.documentId,
      parcelId: link.parcelId,
      linkType: link.linkType || 'reference',
      notes: link.notes || null,
      createdAt: new Date()
    };
    
    this.documentParcelLinks.set(id, documentParcelLink);
    return documentParcelLink;
  }
  
  async removeDocumentParcelLinks(documentId: number, parcelIds?: number[]): Promise<number> {
    const links = Array.from(this.documentParcelLinks.values()).filter(
      link => link.documentId === documentId && 
        (parcelIds === undefined || parcelIds.includes(link.parcelId))
    );
    
    // Remove the links
    for (const link of links) {
      this.documentParcelLinks.delete(link.id);
    }
    
    return links.length;
  }
  
  async getParcelsForDocument(documentId: number): Promise<Parcel[]> {
    const parcelIds = Array.from(this.documentParcelLinks.values())
      .filter(link => link.documentId === documentId)
      .map(link => link.parcelId);
    
    return Array.from(this.parcels.values())
      .filter(parcel => parcelIds.includes(parcel.id));
  }
  
  async getDocumentsForParcel(parcelId: number): Promise<Document[]> {
    const documentIds = Array.from(this.documentParcelLinks.values())
      .filter(link => link.parcelId === parcelId)
      .map(link => link.documentId);
    
    return Array.from(this.documents.values())
      .filter(doc => documentIds.includes(doc.id));
  }
  
  async getParcelById(id: number): Promise<Parcel | undefined> {
    return this.parcels.get(id);
  }
  
  async searchParcelsByNumber(parcelNumber: string): Promise<Parcel[]> {
    return Array.from(this.parcels.values())
      .filter(parcel => parcel.parcelNumber.includes(parcelNumber));
  }
  
  async getAllParcels(): Promise<Parcel[]> {
    return Array.from(this.parcels.values())
      .sort((a, b) => a.parcelNumber.localeCompare(b.parcelNumber));
  }
  
  // Parcel operations
  async generateParcelNumbers(parentParcelId: string, count: number): Promise<string[]> {
    const parcelNumbers: string[] = [];
    
    if (!parentParcelId || parentParcelId.length !== 15) {
      throw new Error("Invalid parent parcel ID. Must be 15 digits.");
    }
    
    // Simple algorithm for generating sequential parcel IDs
    // In a real implementation, this would follow Benton County's rules
    const basePrefix = parentParcelId.substring(0, 10);
    const lastUsedSuffix = parseInt(parentParcelId.substring(10), 10);
    
    for (let i = 1; i <= count; i++) {
      const newSuffix = (lastUsedSuffix + i).toString().padStart(5, '0');
      parcelNumbers.push(`${basePrefix}${newSuffix}`);
    }
    
    return parcelNumbers;
  }
  
  async getParcelInfo(parcelId: string): Promise<any | undefined> {
    // In a real implementation, this would query the database for actual parcel information
    
    // Check if this is a valid parcel ID format
    if (!parcelId || parcelId.length !== 15) {
      return undefined;
    }
    
    // Generate some dummy parcel information for testing purposes
    // In production, this would come from the database
    
    // Extract some information from the parcel ID to make it look realistic
    const section = parcelId.substring(0, 2);
    const township = parcelId.substring(2, 4);
    const range = parcelId.substring(4, 6);
    const suffix = parseInt(parcelId.substring(10), 10);
    
    // Create realistic but random property values
    const propertyTypes = ["Residential", "Commercial", "Agricultural", "Industrial", "Public"];
    const propertyType = propertyTypes[Math.floor(suffix % propertyTypes.length)];
    
    // Calculate a realistic assessed value based on property type
    let baseValue = 100000;
    switch (propertyType) {
      case "Residential": baseValue = 150000 + (suffix * 1000); break;
      case "Commercial": baseValue = 250000 + (suffix * 5000); break;
      case "Agricultural": baseValue = 50000 + (suffix * 200); break;
      case "Industrial": baseValue = 350000 + (suffix * 7500); break;
      case "Public": baseValue = 500000; break;
    }
    
    // Generate a realistic address
    const streets = ["Main St", "Washington Ave", "River Rd", "Park Ave", "County Line Rd"];
    const street = streets[Math.floor(suffix % streets.length)];
    const streetNumber = 100 + (suffix % 900);
    const cities = ["Kennewick", "Richland", "West Richland", "Prosser", "Benton City"];
    const city = cities[Math.floor(suffix % cities.length)];
    const zip = `9930${(suffix % 10)}`;
    
    return {
      parcelId,
      address: `${streetNumber} ${street}`,
      city: city,
      zip: zip,
      ownerName: suffix % 2 === 0 ? "John & Jane Smith" : "Benton Properties LLC",
      acres: (0.25 + (suffix % 10) / 4).toFixed(2),
      propertyType,
      assessedValue: baseValue,
      lastUpdated: "2023-12-15",
      legalDescription: `Section ${section}, Township ${township}, Range ${range}E, W.M.`,
      zones: ["R-1", "Residential"],
      improvements: [
        { type: "Building", value: baseValue * 0.7, yearBuilt: 1980 + (suffix % 40) },
        { type: "Outbuilding", value: baseValue * 0.05, yearBuilt: 1990 + (suffix % 30) }
      ]
    };
  }
  
  // Search parcels by address, city, and/or zip
  async searchParcelsByAddress(address: string, city?: string, zip?: string): Promise<any[]> {
    // In a real implementation, this would query the database
    // For now, we'll generate some mock data based on the query
    
    // Generate 5 sample parcel IDs for our search results
    const results = [];
    for (let i = 1; i <= 5; i++) {
      const baseId = "1122334455";
      const suffix = (parseInt(address.replace(/\D/g, '') || '1') * i).toString().padStart(5, '0');
      const parcelId = `${baseId}${suffix}`;
      
      // Get the parcel info
      const parcelInfo = await this.getParcelInfo(parcelId);
      
      // Filter by address, city, and zip if provided
      const addressMatch = parcelInfo.address.toLowerCase().includes(address.toLowerCase());
      const cityMatch = !city || parcelInfo.city.toLowerCase().includes(city.toLowerCase());
      const zipMatch = !zip || parcelInfo.zip.includes(zip);
      
      if (addressMatch && cityMatch && zipMatch) {
        results.push(parcelInfo);
      }
    }
    
    return results;
  }
  
  async getParcelByNumber(parcelNumber: string): Promise<Parcel | undefined> {
    return Array.from(this.parcels.values())
      .find(parcel => parcel.parcelNumber === parcelNumber);
  }
  
  async createParcel(parcel: Omit<InsertParcel, 'id'>): Promise<Parcel> {
    const id = this.parcelId++;
    const newParcel: Parcel = {
      id,
      parcelNumber: parcel.parcelNumber,
      workflowId: parcel.workflowId || null,
      parentParcelId: parcel.parentParcelId || null,
      legalDescription: parcel.legalDescription || null,
      acreage: parcel.acreage || null,
      acres: parcel.acres || null,
      address: parcel.address || null,
      city: parcel.city || null,
      zip: parcel.zip || null,
      propertyType: parcel.propertyType || null,
      owner: parcel.owner || null,
      zoning: parcel.zoning || null,
      assessedValue: parcel.assessedValue || null,
      geometry: parcel.geometry || null,
      isActive: parcel.isActive !== undefined ? parcel.isActive : true,
      createdAt: new Date()
    };
    this.parcels.set(id, newParcel);
    return newParcel;
  }
  
  // Map operations
  async getMapLayers(): Promise<MapLayer[]> {
    return Array.from(this.mapLayers.values());
  }
  
  // Get only visible map layers
  async getVisibleMapLayers(): Promise<MapLayer[]> {
    return Array.from(this.mapLayers.values()).filter(layer => layer.visible);
  }
  
  // Update map layer settings
  async updateMapLayer(id: number, updates: Partial<{
    visible: boolean;
    opacity: number;
    zindex: number;
    order: number;
  }>): Promise<MapLayer> {
    const layer = this.mapLayers.get(id);
    if (!layer) {
      throw new Error(`Map layer with ID ${id} not found`);
    }
    
    const updatedLayer = {
      ...layer,
      ...updates
    };
    
    this.mapLayers.set(id, updatedLayer);
    return updatedLayer;
  }
  
  // Report operations
  async generateSM00Report(startDate: string, endDate: string): Promise<any> {
    // In a real implementation, this would query parcels and generate a proper report
    return {
      title: "SM00 Segregation Report",
      dateRange: `${startDate} to ${endDate}`,
      totalParcels: 24,
      newParcels: 12,
      mergedParcels: 4,
      splitParcels: 8,
      details: [
        { type: "Long Plat", name: "Riverside Estates", parcelCount: 12 },
        { type: "BLA", name: "Johnson Property", parcelCount: 2 },
        { type: "Merge", name: "Smith Farmland", parcelCount: 2 },
        { type: "Split", name: "Mountain View", parcelCount: 8 },
      ]
    };
  }
  
  // Assistant operations
  async queryAssistant(query: string): Promise<string> {
    const responses: Record<string, string> = {
      "how do i process a long plat": "To process a long plat, follow these steps: 1) Verify the plat is filed with the Auditor's Office, 2) Scan plat map at 300+ DPI, 3) Create standardized file names, 4) Verify ownership from parent parcel, 5) Check for annexation issues, 6) Complete the Long Plat checklist in the workflow.",
      "what are the steps for processing a bla": "To process a Boundary Line Adjustment (BLA): 1) Verify the BLA documentation is complete, 2) Check for legal description accuracy, 3) Verify ownership records, 4) Process the parent parcels, 5) Generate new parcel numbers if needed, 6) Update the GIS map with new boundaries, 7) Complete the BLA checklist in the workflow.",
      "how do i generate parcel numbers": "To generate parcel numbers: 1) Navigate to the Parcel ID Generator tool, 2) Enter the parent parcel ID (15 digits), 3) Specify how many new parcel numbers you need, 4) The system will validate and generate sequential numbers following Benton County's Ab/Sub code system."
    };
    
    // Simple keyword matching
    const normalizedQuery = query.toLowerCase().trim();
    for (const [key, response] of Object.entries(responses)) {
      if (normalizedQuery.includes(key)) {
        return response;
      }
    }
    
    return "I'm sorry, I don't have specific information about that query. Please check the documentation or contact your supervisor for assistance.";
  }
  
  // Helper methods
  private createInitialWorkflowState(workflowId: number) {
    const id = this.stateId++;
    const state: WorkflowState = {
      id,
      workflowId,
      currentStep: 1,
      formData: {},
      updatedAt: new Date(),
    };
    this.workflowStates.set(id, state);
  }
  
  private createDefaultChecklistItems(workflowId: number, workflowType: string) {
    let items: Partial<ChecklistItem>[] = [];
    
    if (workflowType === "long_plat") {
      items = [
        { title: "Checked Auditor's Office for Filed Plat", description: "Verify with Auditor's Office that the plat has been properly filed according to Chapter 58.18 RCW.", order: 1 },
        { title: "Scanned Plat Map at 300+ DPI", description: "Ensure map is scanned at sufficient resolution for georeferencing.", order: 2 },
        { title: "Created Standardized File Names", description: "Apply county naming convention to all plat-related files.", order: 3 },
        { title: "Verified Ownership from Parent Parcel", description: "Confirm ownership details match county records.", order: 4 },
        { title: "Checked for Annexation Issues", description: "If annexation involved, notify Molly for review.", order: 5 },
        { title: "Created COGO Boundaries", description: "Use Coordinate Geometry to recreate surveyed boundaries.", order: 6 },
        { title: "Generated New Parcel Numbers", description: "Create and assign new parcel IDs for all lots.", order: 7 },
        { title: "Updated GIS Map", description: "Add new parcels to county GIS system.", order: 8 },
        { title: "Verified Legal Descriptions", description: "Confirm all legal descriptions match plat map.", order: 9 },
        { title: "Generated SM00 Report Entry", description: "Add to monthly segregation report.", order: 10 },
        { title: "Updated Assessment Year Layers", description: "Ensure parcels appear in correct assessment year.", order: 11 },
        { title: "Final Supervisor Review", description: "Get final approval from supervisor.", order: 12 }
      ];
    } else if (workflowType === "bla") {
      items = [
        { title: "Verified BLA Documentation", description: "Check that all required documents are present and complete.", order: 1 },
        { title: "Checked Legal Description Accuracy", description: "Verify legal descriptions match survey documents.", order: 2 },
        { title: "Verified Ownership Records", description: "Confirm ownership details match county records.", order: 3 },
        { title: "Processed Parent Parcels", description: "Mark existing parcels for adjustment.", order: 4 },
        { title: "Updated Boundaries in GIS", description: "Modify parcel boundaries in GIS system.", order: 5 },
        { title: "Updated Legal Descriptions", description: "Update legal descriptions in property records.", order: 6 },
        { title: "Added to SM00 Report", description: "Include in monthly segregation report.", order: 7 },
        { title: "Final Quality Check", description: "Verify all changes are accurate and complete.", order: 8 }
      ];
    } else if (workflowType === "merge_split") {
      items = [
        { title: "Verified Deed Documents", description: "Check all deed documents for completeness.", order: 1 },
        { title: "Retrieved Parent Parcel Data", description: "Pull all data for parcels being merged/split.", order: 2 },
        { title: "Followed Merge Check-Off List", description: "Complete all steps in the merge procedure.", order: 3 },
        { title: "Recalculated Parcel Sizes", description: "Update acreage/size information.", order: 4 },
        { title: "Marked Parent Parcels Inactive", description: "For merges, mark original parcels as inactive.", order: 5 },
        { title: "Created New Parcels", description: "Generate new parcels with proper IDs.", order: 6 },
        { title: "Updated GIS Data", description: "Update boundaries in GIS system.", order: 7 },
        { title: "Added to SM00 Report", description: "Include in monthly segregation report.", order: 8 },
        { title: "Final Review", description: "Complete final review of all changes.", order: 9 }
      ];
    } else if (workflowType === "sm00_report") {
      items = [
        { title: "Set Report Date Range", description: "Define the start and end dates for the report period.", order: 1 },
        { title: "Pulled Tracking Data", description: "Extract data from SM00 tracking database.", order: 2 },
        { title: "Filtered by Assessment Year", description: "Filter data by relevant assessment year.", order: 3 },
        { title: "Grouped by Supplement", description: "Group data by supplement category.", order: 4 },
        { title: "Generated PDF Report", description: "Create formatted PDF report.", order: 5 },
        { title: "Sent to Required Recipients", description: "Distribute report to all required parties.", order: 6 },
        { title: "Archived Report Copy", description: "Save report copy to archives.", order: 7 }
      ];
    }
    
    items.forEach(item => {
      const id = this.checklistId++;
      const checklistItem: ChecklistItem = {
        id,
        workflowId,
        title: item.title!,
        description: item.description,
        completed: false,
        order: item.order!,
      };
      this.checklistItems.set(id, checklistItem);
    });
  }
  
  private initializeMapLayers() {
    const layers = [
      { name: "Parcels", source: "county_gis", type: "vector", visible: true, metadata: { description: "Base parcel layer", year: 2023 } },
      { name: "Roads", source: "county_gis", type: "vector", visible: true, metadata: { description: "County road network", year: 2023 } },
      { name: "Plat Boundaries", source: "arcgis", type: "vector", visible: true, metadata: { description: "Recorded plat boundaries", year: 2023 } },
      { name: "Aerial Imagery", source: "usgs", type: "raster", visible: false, metadata: { description: "USGS aerial photography", year: 2022 } },
      { name: "Zoning", source: "county_planning", type: "vector", visible: false, metadata: { description: "County zoning districts", year: 2023 } },
      { name: "Hydrology", source: "county_gis", type: "vector", visible: false, metadata: { description: "Water features", year: 2022 } },
    ];
    
    layers.forEach(layer => {
      const id = this.layerId++;
      const mapLayer: MapLayer = {
        id,
        name: layer.name,
        source: layer.source,
        type: layer.type,
        visible: layer.visible,
        metadata: layer.metadata,
      };
      this.mapLayers.set(id, mapLayer);
    });
  }
  
  // Search operations
  async getSearchHistory(userId?: number, limit?: number): Promise<SearchHistory[]> {
    const limitCount = limit || 10;
    let searchEntries = Array.from(this.searchHistory.values());
    
    if (userId) {
      searchEntries = searchEntries.filter(entry => entry.userId === userId);
    }
    
    return searchEntries
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limitCount);
  }
  
  async saveSearchQuery(query: string, type: string, userId?: number, results?: number): Promise<SearchHistory> {
    const id = this.searchHistoryId++;
    const searchEntry: SearchHistory = {
      id,
      userId: userId || null,
      query,
      type,
      resultCount: results || 0,
      createdAt: new Date()
    };
    
    this.searchHistory.set(id, searchEntry);
    return searchEntry;
  }
  
  async getSearchSuggestions(prefix: string, type?: string, limit?: number): Promise<SearchSuggestion[]> {
    const limitCount = limit || 5;
    let suggestions = Array.from(this.searchSuggestions.values());
    
    if (prefix) {
      suggestions = suggestions.filter(suggestion => 
        suggestion.term.toLowerCase().startsWith(prefix.toLowerCase()));
    }
    
    if (type) {
      suggestions = suggestions.filter(suggestion => suggestion.type === type);
    }
    
    return suggestions
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, limitCount);
  }
  
  async addSearchSuggestion(term: string, type: string, priority?: number, metadata?: any): Promise<SearchSuggestion> {
    const id = this.searchSuggestionId++;
    const suggestion: SearchSuggestion = {
      id,
      term,
      type,
      priority: priority || 0,
      metadata: metadata || null,
      createdAt: new Date()
    };
    
    this.searchSuggestions.set(id, suggestion);
    return suggestion;
  }
  
  // Map bookmarks operations
  async getMapBookmarks(userId: number): Promise<MapBookmark[]> {
    return Array.from(this.mapBookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getMapBookmark(id: number): Promise<MapBookmark | undefined> {
    return this.mapBookmarks.get(id);
  }
  
  async createMapBookmark(bookmark: InsertMapBookmark): Promise<MapBookmark> {
    const id = this.mapBookmarkId++;
    const newBookmark: MapBookmark = {
      ...bookmark,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.mapBookmarks.set(id, newBookmark);
    return newBookmark;
  }
  
  async updateMapBookmark(id: number, updates: Partial<Omit<InsertMapBookmark, 'id'>>): Promise<MapBookmark> {
    const bookmark = this.mapBookmarks.get(id);
    if (!bookmark) {
      throw new Error(`Map bookmark with ID ${id} not found`);
    }
    
    const updatedBookmark: MapBookmark = {
      ...bookmark,
      ...updates,
      updatedAt: new Date()
    };
    
    this.mapBookmarks.set(id, updatedBookmark);
    return updatedBookmark;
  }
  
  async deleteMapBookmark(id: number): Promise<boolean> {
    if (!this.mapBookmarks.has(id)) {
      return false;
    }
    
    return this.mapBookmarks.delete(id);
  }
  
  // Map preferences operations
  async getMapPreference(userId: number): Promise<MapPreference | undefined> {
    return Array.from(this.mapPreferences.values())
      .find(preference => preference.userId === userId);
  }
  
  async getMapPreferences(userId: number): Promise<MapPreference | undefined> {
    // This is an alias for getMapPreference for API consistency
    return this.getMapPreference(userId);
  }
  
  async createMapPreferences(preference: InsertMapPreference): Promise<MapPreference> {
    const id = this.mapPreferenceId++;
    const newPreference: MapPreference = {
      ...preference,
      id,
      updatedAt: new Date()
    };
    
    this.mapPreferences.set(id, newPreference);
    return newPreference;
  }
  
  async createOrUpdateMapPreference(preference: InsertMapPreference): Promise<MapPreference> {
    const existingPreference = await this.getMapPreference(preference.userId);
    
    if (existingPreference) {
      const updatedPreference: MapPreference = {
        ...existingPreference,
        ...preference,
        updatedAt: new Date()
      };
      
      this.mapPreferences.set(existingPreference.id, updatedPreference);
      return updatedPreference;
    } else {
      const id = this.mapPreferenceId++;
      const newPreference: MapPreference = {
        ...preference,
        id,
        updatedAt: new Date()
      };
      
      this.mapPreferences.set(id, newPreference);
      return newPreference;
    }
  }
  
  async updateMapPreferences(userId: number, updates: Partial<Omit<InsertMapPreference, 'id'>>): Promise<MapPreference> {
    const existingPreference = await this.getMapPreference(userId);
    
    if (!existingPreference) {
      throw new Error(`Map preferences for user ${userId} not found`);
    }
    
    const updatedPreference: MapPreference = {
      ...existingPreference,
      ...updates,
      userId, // Ensure userId doesn't change
      updatedAt: new Date()
    };
    
    this.mapPreferences.set(existingPreference.id, updatedPreference);
    return updatedPreference;
  }
  
  async resetMapPreferences(userId: number): Promise<MapPreference> {
    const existingPreference = await this.getMapPreference(userId);
    
    if (!existingPreference) {
      throw new Error(`Map preferences for user ${userId} not found`);
    }
    
    // Create default preferences
    const defaultPreference: InsertMapPreference = {
      userId,
      defaultCenter: { lat: 46.06, lng: -123.43 }, // Default Benton County center
      defaultZoom: 12,
      baseLayer: 'streets',
      layerVisibility: 'visible',
      theme: 'light',
      measurement: { enabled: false, unit: 'imperial' },
      snapToFeature: true,
      showLabels: true,
      animation: true,
    };
    
    const resetPreference: MapPreference = {
      ...defaultPreference,
      id: existingPreference.id,
      updatedAt: new Date()
    };
    
    this.mapPreferences.set(existingPreference.id, resetPreference);
    return resetPreference;
  }
  
  // Recently viewed parcels operations
  async getRecentlyViewedParcels(userId: number, limit?: number): Promise<RecentlyViewedParcel[]> {
    const limitCount = limit || 10;
    
    return Array.from(this.recentlyViewedParcels.values())
      .filter(record => record.userId === userId)
      .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime())
      .slice(0, limitCount);
  }
  
  async addRecentlyViewedParcel(data: InsertRecentlyViewedParcel): Promise<RecentlyViewedParcel> {
    const userId = data.userId;
    const parcelId = data.parcelId;
    
    // Check if this parcel was already viewed by this user
    const existingRecord = Array.from(this.recentlyViewedParcels.values())
      .find(record => record.userId === userId && record.parcelId === parcelId);
    
    if (existingRecord) {
      // Update the existing record with the new timestamp
      const updatedRecord: RecentlyViewedParcel = {
        ...existingRecord,
        viewedAt: data.viewedAt || new Date()
      };
      
      this.recentlyViewedParcels.set(existingRecord.id, updatedRecord);
      return updatedRecord;
    } else {
      // Create a new record
      const id = data.id || this.recentlyViewedParcelId++;
      const newRecord: RecentlyViewedParcel = {
        id,
        userId,
        parcelId,
        viewedAt: data.viewedAt || new Date()
      };
      
      this.recentlyViewedParcels.set(id, newRecord);
      return newRecord;
    }
  }
  
  async removeRecentlyViewedParcel(id: number): Promise<boolean> {
    if (!this.recentlyViewedParcels.has(id)) {
      return false;
    }
    
    return this.recentlyViewedParcels.delete(id);
  }
  
  async clearRecentlyViewedParcels(userId: number): Promise<boolean> {
    const parcelIdsToRemove = Array.from(this.recentlyViewedParcels.values())
      .filter(record => record.userId === userId)
      .map(record => record.id);
    
    let success = true;
    for (const id of parcelIdsToRemove) {
      const result = this.recentlyViewedParcels.delete(id);
      if (!result) success = false;
    }
    
    return success;
  }
}

// DatabaseStorage implementation that uses Postgres/Drizzle
export class DatabaseStorage implements IStorage {
  sessionStore: ReturnType<typeof createMemoryStore>;

  constructor() {
    // Set up PostgreSQL session store with improved configuration
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL
      },
      createTableIfMissing: true,
      tableName: 'session', // Default table name
      pruneSessionInterval: 60, // Cleanup expired sessions every minute
      ttl: 86400 // 24 hours - matching the cookie maxAge
    }) as unknown as ReturnType<typeof createMemoryStore>;
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Workflow operations
  async getWorkflows(userId: number | undefined): Promise<Workflow[]> {
    if (!userId) return [];
    return db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.updatedAt));
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    // Start a transaction for creating workflow and related items
    const [workflow] = await db.insert(workflows).values(insertWorkflow).returning();
    
    // Create initial workflow state
    await this.createInitialWorkflowState(workflow.id);
    
    // Create default checklist items
    await this.createDefaultChecklistItems(workflow.id, workflow.type);
    
    // Create workflow creation event
    await this.createWorkflowEvent({
      workflowId: workflow.id,
      eventType: "created",
      description: `Workflow created: ${insertWorkflow.title}`,
      metadata: {
        workflowType: insertWorkflow.type,
        userId: insertWorkflow.userId
      }
    });
    
    return workflow;
  }
  
  // Workflow events operations
  async getWorkflowEvents(workflowId: number): Promise<WorkflowEvent[]> {
    return db
      .select()
      .from(workflowEvents)
      .where(eq(workflowEvents.workflowId, workflowId))
      .orderBy(desc(workflowEvents.createdAt));
  }
  
  async createWorkflowEvent(event: InsertWorkflowEvent): Promise<WorkflowEvent> {
    const [workflowEvent] = await db
      .insert(workflowEvents)
      .values({
        workflowId: event.workflowId,
        eventType: event.eventType,
        description: event.description,
        metadata: event.metadata || {},
        createdBy: event.createdBy || null
      })
      .returning();
    
    return workflowEvent;
  }

  // Workflow state operations
  async getWorkflowState(workflowId: number): Promise<WorkflowState | undefined> {
    const [state] = await db.select().from(workflowStates)
      .where(eq(workflowStates.workflowId, workflowId));
    return state;
  }

  async updateWorkflowState(workflowId: number, state: InsertWorkflowState): Promise<WorkflowState> {
    const existingState = await this.getWorkflowState(workflowId);
    
    if (existingState) {
      const [updatedState] = await db.update(workflowStates)
        .set({
          currentStep: state.currentStep,
          formData: state.formData,
          updatedAt: new Date()
        })
        .where(eq(workflowStates.id, existingState.id))
        .returning();
      return updatedState;
    } else {
      const [newState] = await db.insert(workflowStates)
        .values({
          workflowId,
          currentStep: state.currentStep,
          formData: state.formData,
          updatedAt: new Date()
        })
        .returning();
      return newState;
    }
  }

  // Checklist operations
  async getChecklistItems(workflowId: number): Promise<ChecklistItem[]> {
    return db.select().from(checklistItems)
      .where(eq(checklistItems.workflowId, workflowId))
      .orderBy(asc(checklistItems.order));
  }

  async updateChecklistItem(itemId: number, completed: boolean): Promise<ChecklistItem> {
    const [updatedItem] = await db.update(checklistItems)
      .set({ completed })
      .where(eq(checklistItems.id, itemId))
      .returning();
    
    if (!updatedItem) {
      throw new Error(`Checklist item with ID ${itemId} not found`);
    }
    
    return updatedItem;
  }
  
  async createChecklistItem(item: Partial<{
    workflowId: number;
    title: string;
    description: string;
    completed: boolean;
    order: number;
  }>): Promise<ChecklistItem> {
    if (!item.workflowId || !item.title || item.order === undefined) {
      throw new Error("Checklist item must have workflowId, title, and order");
    }
    
    const [newItem] = await db.insert(checklistItems).values({
      workflowId: item.workflowId,
      title: item.title,
      description: item.description || null,
      completed: item.completed || false,
      order: item.order
    }).returning();
    
    return newItem;
  }

  // Document Lineage operations
  // Document entity operations
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

  async getCompleteLineageGraph(documentIds: string[], depth?: number): Promise<DocumentLineageGraph> {
    return documentLineageStorage.getCompleteLineageGraph(documentIds, depth);
  }

  // Document operations
  async getDocuments(workflowId?: number): Promise<Document[]> {
    if (workflowId === undefined) {
      return db.select()
        .from(documents)
        .orderBy(desc(documents.uploadedAt));
    }
    return db.select()
      .from(documents)
      .where(eq(documents.workflowId, workflowId))
      .orderBy(desc(documents.uploadedAt));
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }
  
  async addDocument(params: {
    workflowId?: number; 
    name: string;
    type: DocumentType;
    contentType?: string; // Made optional since the DB doesn't have it
    contentHash?: string; // Made optional since the DB doesn't have it
    storageKey?: string;  // Made optional since the DB doesn't have it
    classification?: {
      documentType: string;
      confidence: number;
      wasManuallyClassified: boolean;
      classifiedAt: string;
    };
    content: string;
  }): Promise<Document> {
    // Only use fields that actually exist in the database
    const [document] = await db.insert(documents)
      .values({
        workflowId: params.workflowId || null,
        name: params.name,
        type: params.type,
        content: params.content, // Store the content in the content field
        uploadedAt: new Date(),
      })
      .returning();
    
    // If we wanted to store additional metadata like classification in a separate table, 
    // we would need to add that logic here
    
    return document;
  }
  
  async updateDocumentClassification(documentId: number, classification: {
    documentType: string;
    confidence: number;
    wasManuallyClassified: boolean;
    classifiedAt: string;
  }): Promise<Document> {
    // Just update the type field since that's all we have in the database
    const [updatedDocument] = await db.update(documents)
      .set({
        type: classification.documentType as DocumentType
        // No classification or updatedAt field in current schema
      })
      .where(eq(documents.id, documentId))
      .returning();
      
    if (!updatedDocument) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Return the document with the classification data appended (not stored in DB)
    return {
      ...updatedDocument,
      classification  // Add the classification even though it's not in the DB
    };
  }
  
  // Document version operations
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return db.select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(asc(documentVersions.versionNumber));
  }
  
  async addDocumentVersion(params: {
    documentId: number;
    versionNumber: number;
    contentHash: string;
    storageKey: string;
    notes?: string;
    content: string; // Base64 content, not actually stored in the database
  }): Promise<DocumentVersion> {
    const [version] = await db.insert(documentVersions)
      .values({
        documentId: params.documentId,
        versionNumber: params.versionNumber,
        contentHash: params.contentHash,
        storageKey: params.storageKey,
        notes: params.notes || null,
        createdAt: new Date()
      })
      .returning();
    return version;
  }
  
  // Document-parcel link operations
  async getDocumentParcelLink(documentId: number, parcelId: number): Promise<DocumentParcelLink | undefined> {
    const [link] = await db.select()
      .from(documentParcelLinks)
      .where(
        and(
          eq(documentParcelLinks.documentId, documentId),
          eq(documentParcelLinks.parcelId, parcelId)
        )
      );
    return link;
  }
  
  async createDocumentParcelLink(link: InsertDocumentParcelLink): Promise<DocumentParcelLink> {
    const [documentParcelLink] = await db.insert(documentParcelLinks)
      .values({
        documentId: link.documentId,
        parcelId: link.parcelId,
        linkType: link.linkType || 'reference',
        notes: link.notes || null,
        createdAt: new Date()
      })
      .returning();
    return documentParcelLink;
  }
  
  async removeDocumentParcelLinks(documentId: number, parcelIds?: number[]): Promise<number> {
    if (parcelIds && parcelIds.length > 0) {
      const result = await db.delete(documentParcelLinks)
        .where(
          and(
            eq(documentParcelLinks.documentId, documentId),
            sql`${documentParcelLinks.parcelId} IN (${sql.join(parcelIds, sql`, `)})`
          )
        );
      return result.rowCount || 0;
    } else {
      const result = await db.delete(documentParcelLinks)
        .where(eq(documentParcelLinks.documentId, documentId));
      return result.rowCount || 0;
    }
  }
  
  async getParcelsForDocument(documentId: number): Promise<Parcel[]> {
    return db.select({
      parcel: parcels
    })
    .from(documentParcelLinks)
    .innerJoin(parcels, eq(documentParcelLinks.parcelId, parcels.id))
    .where(eq(documentParcelLinks.documentId, documentId))
    .then(rows => rows.map(row => row.parcel));
  }
  
  async getDocumentsForParcel(parcelId: number): Promise<Document[]> {
    return db.select({
      document: documents
    })
    .from(documentParcelLinks)
    .innerJoin(documents, eq(documentParcelLinks.documentId, documents.id))
    .where(eq(documentParcelLinks.parcelId, parcelId))
    .then(rows => rows.map(row => row.document));
  }
  
  async getParcelById(id: number): Promise<Parcel | undefined> {
    const [parcel] = await db.select()
      .from(parcels)
      .where(eq(parcels.id, id));
    return parcel;
  }
  
  async searchParcelsByNumber(parcelNumber: string): Promise<Parcel[]> {
    return db.select()
      .from(parcels)
      .where(sql`${parcels.parcelNumber} LIKE ${`%${parcelNumber}%`}`);
  }
  
  async getAllParcels(): Promise<Parcel[]> {
    return db.select()
      .from(parcels)
      .orderBy(parcels.parcelNumber);
  }
  
  async getParcelByNumber(parcelNumber: string): Promise<Parcel | undefined> {
    const [parcel] = await db.select()
      .from(parcels)
      .where(eq(parcels.parcelNumber, parcelNumber));
    return parcel;
  }
  
  async createParcel(parcel: Omit<InsertParcel, 'id'>): Promise<Parcel> {
    const [newParcel] = await db.insert(parcels)
      .values({
        parcelNumber: parcel.parcelNumber,
        workflowId: parcel.workflowId || null,
        parentParcelId: parcel.parentParcelId || null,
        legalDescription: parcel.legalDescription || null,
        acreage: parcel.acreage || null,
        acres: parcel.acres || null,
        address: parcel.address || null,
        city: parcel.city || null,
        zip: parcel.zip || null,
        propertyType: parcel.propertyType || null,
        owner: parcel.owner || null,
        zoning: parcel.zoning || null,
        assessedValue: parcel.assessedValue || null,
        geometry: parcel.geometry || null,
        isActive: parcel.isActive !== undefined ? parcel.isActive : true
      })
      .returning();
    return newParcel;
  }

  // Parcel operations
  async generateParcelNumbers(parentParcelId: string, count: number): Promise<string[]> {
    const parcelNumbers: string[] = [];
    
    if (!parentParcelId || parentParcelId.length !== 15) {
      throw new Error("Invalid parent parcel ID. Must be 15 digits.");
    }
    
    // Simple algorithm for generating sequential parcel IDs
    // In a real implementation, this would follow Benton County's rules
    const basePrefix = parentParcelId.substring(0, 10);
    const lastUsedSuffix = parseInt(parentParcelId.substring(10), 10);
    
    for (let i = 1; i <= count; i++) {
      const newSuffix = (lastUsedSuffix + i).toString().padStart(5, '0');
      parcelNumbers.push(`${basePrefix}${newSuffix}`);
    }
    
    return parcelNumbers;
  }

  async getParcelInfo(parcelId: string): Promise<any | undefined> {
    // Try to find in database first
    const [parcel] = await db.select().from(parcels).where(eq(parcels.parcelNumber, parcelId));
    
    if (parcel) {
      return {
        parcelId: parcel.parcelNumber,
        legalDescription: parcel.legalDescription,
        acres: parcel.acreage,
        address: parcel.address,
        city: parcel.city,
        zip: parcel.zip,
        propertyType: parcel.propertyType,
        isActive: parcel.isActive,
        createdAt: parcel.createdAt
      };
    }
    
    // If not found, return undefined
    return undefined;
  }
  
  // Search parcels by address, city, and/or zip
  async searchParcelsByAddress(address: string, city?: string, zip?: string): Promise<any[]> {
    try {
      // Search in the database
      let query = db.select().from(parcels);
      
      // Apply filters if provided
      if (address) {
        query = query.where(sql`${parcels.address} ILIKE ${`%${address}%`}`);
      }
      
      if (city) {
        query = query.where(sql`${parcels.city} ILIKE ${`%${city}%`}`);
      }
      
      if (zip) {
        query = query.where(sql`${parcels.zip} LIKE ${`%${zip}%`}`);
      }
      
      const results = await query.limit(10);
      
      return results.map(parcel => ({
        parcelId: parcel.parcelNumber,
        address: parcel.address,
        city: parcel.city,
        zip: parcel.zip,
        propertyType: parcel.propertyType,
        acres: parcel.acreage
      }));
    } catch (error) {
      console.error("Error searching parcels by address:", error);
      return [];
    }
  }

  // Map operations
  async getMapLayers(): Promise<MapLayer[]> {
    return db.select().from(mapLayers);
  }
  
  // Get only visible map layers
  async getVisibleMapLayers(): Promise<MapLayer[]> {
    return db.select().from(mapLayers).where(eq(mapLayers.visible, true));
  }

  // Report operations
  async generateSM00Report(startDate: string, endDate: string): Promise<any> {
    // In a real implementation, this would query workflows and parcels
    // For now, it returns mock data for development
    return {
      title: "SM00 Segregation Report",
      dateRange: `${startDate} to ${endDate}`,
      totalParcels: 24,
      newParcels: 12,
      mergedParcels: 4,
      splitParcels: 8,
      details: [
        { type: "Long Plat", name: "Riverside Estates", parcelCount: 12 },
        { type: "BLA", name: "Johnson Property", parcelCount: 2 },
        { type: "Merge", name: "Smith Farmland", parcelCount: 2 },
        { type: "Split", name: "Mountain View", parcelCount: 8 },
      ]
    };
  }

  // Assistant operations
  async queryAssistant(query: string): Promise<string> {
    const responses: Record<string, string> = {
      "how do i process a long plat": "To process a long plat, follow these steps: 1) Verify the plat is filed with the Auditor's Office, 2) Scan plat map at 300+ DPI, 3) Create standardized file names, 4) Verify ownership from parent parcel, 5) Check for annexation issues, 6) Complete the Long Plat checklist in the workflow.",
      "what are the steps for processing a bla": "To process a Boundary Line Adjustment (BLA): 1) Verify the BLA documentation is complete, 2) Check for legal description accuracy, 3) Verify ownership records, 4) Process the parent parcels, 5) Generate new parcel numbers if needed, 6) Update the GIS map with new boundaries, 7) Complete the BLA checklist in the workflow.",
      "how do i generate parcel numbers": "To generate parcel numbers: 1) Navigate to the Parcel ID Generator tool, 2) Enter the parent parcel ID (15 digits), 3) Specify how many new parcel numbers you need, 4) The system will validate and generate sequential numbers following Benton County's Ab/Sub code system."
    };
    
    // Simple keyword matching
    const normalizedQuery = query.toLowerCase().trim();
    for (const [key, response] of Object.entries(responses)) {
      if (normalizedQuery.includes(key)) {
        return response;
      }
    }
    
    return "I'm sorry, I don't have specific information about that query. Please check the documentation or contact your supervisor for assistance.";
  }

  // Helper methods
  private async createInitialWorkflowState(workflowId: number) {
    await db.insert(workflowStates).values({
      workflowId,
      currentStep: 1,
      formData: {},
      updatedAt: new Date()
    });
  }

  private async createDefaultChecklistItems(workflowId: number, workflowType: string) {
    let items: Partial<InsertChecklistItem>[] = [];
    
    if (workflowType === "long_plat") {
      items = [
        { workflowId, title: "Checked Auditor's Office for Filed Plat", description: "Verify with Auditor's Office that the plat has been properly filed according to Chapter 58.18 RCW.", order: 1, completed: false },
        { workflowId, title: "Scanned Plat Map at 300+ DPI", description: "Ensure map is scanned at sufficient resolution for georeferencing.", order: 2, completed: false },
        { workflowId, title: "Created Standardized File Names", description: "Apply county naming convention to all plat-related files.", order: 3, completed: false },
        { workflowId, title: "Verified Ownership from Parent Parcel", description: "Confirm ownership details match county records.", order: 4, completed: false },
        { workflowId, title: "Checked for Annexation Issues", description: "If annexation involved, notify Molly for review.", order: 5, completed: false },
        { workflowId, title: "Created COGO Boundaries", description: "Use Coordinate Geometry to recreate surveyed boundaries.", order: 6, completed: false },
        { workflowId, title: "Generated New Parcel Numbers", description: "Create and assign new parcel IDs for all lots.", order: 7, completed: false },
        { workflowId, title: "Updated GIS Map", description: "Add new parcels to county GIS system.", order: 8, completed: false },
        { workflowId, title: "Verified Legal Descriptions", description: "Confirm all legal descriptions match plat map.", order: 9, completed: false },
        { workflowId, title: "Generated SM00 Report Entry", description: "Add to monthly segregation report.", order: 10, completed: false },
        { workflowId, title: "Updated Assessment Year Layers", description: "Ensure parcels appear in correct assessment year.", order: 11, completed: false },
        { workflowId, title: "Final Supervisor Review", description: "Get final approval from supervisor.", order: 12, completed: false }
      ];
    } else if (workflowType === "bla") {
      items = [
        { workflowId, title: "Verified BLA Documentation", description: "Check that all required documents are present and complete.", order: 1, completed: false },
        { workflowId, title: "Checked Legal Description Accuracy", description: "Verify legal descriptions match survey documents.", order: 2, completed: false },
        { workflowId, title: "Verified Ownership Records", description: "Confirm ownership details match county records.", order: 3, completed: false },
        { workflowId, title: "Processed Parent Parcels", description: "Mark existing parcels for adjustment.", order: 4, completed: false },
        { workflowId, title: "Updated Boundaries in GIS", description: "Modify parcel boundaries in GIS system.", order: 5, completed: false },
        { workflowId, title: "Updated Legal Descriptions", description: "Update legal descriptions in property records.", order: 6, completed: false },
        { workflowId, title: "Added to SM00 Report", description: "Include in monthly segregation report.", order: 7, completed: false },
        { workflowId, title: "Final Quality Check", description: "Verify all changes are accurate and complete.", order: 8, completed: false }
      ];
    } else if (workflowType === "merge_split") {
      items = [
        { workflowId, title: "Verified Deed Documents", description: "Check all deed documents for completeness.", order: 1, completed: false },
        { workflowId, title: "Retrieved Parent Parcel Data", description: "Pull all data for parent parcels.", order: 2, completed: false },
        { workflowId, title: "Validated Legal Descriptions", description: "Check all legal descriptions for accuracy.", order: 3, completed: false },
        { workflowId, title: "Created Geometry", description: "Draw the new parcel shapes in GIS.", order: 4, completed: false },
        { workflowId, title: "Generated New Parcel Numbers", description: "Create new parcel IDs as needed.", order: 5, completed: false },
        { workflowId, title: "Added to SM00 Report", description: "Include in monthly segregation report.", order: 6, completed: false },
        { workflowId, title: "Updated Map Layers", description: "Update all affected map layers.", order: 7, completed: false },
        { workflowId, title: "Final Review", description: "Get supervisor approval.", order: 8, completed: false }
      ];
    } else if (workflowType === "sm00_report") {
      items = [
        { workflowId, title: "Set Date Range", description: "Define the reporting period.", order: 1, completed: false },
        { workflowId, title: "Gathered Segregation Data", description: "Pull all segregation data for period.", order: 2, completed: false },
        { workflowId, title: "Verified Parcel Counts", description: "Check all parcel counts for accuracy.", order: 3, completed: false },
        { workflowId, title: "Generated Report", description: "Produce the full report document.", order: 4, completed: false },
        { workflowId, title: "Submitted to Assessor", description: "Submit report to County Assessor.", order: 5, completed: false },
        { workflowId, title: "Filed Report Copy", description: "Save copy in digital system.", order: 6, completed: false }
      ];
    }
    
    if (items.length > 0) {
      await db.insert(checklistItems).values(items);
    }
  }
  
  // Map operations
  async getMapLayers(): Promise<MapLayer[]> {
    return db.select().from(mapLayers);
  }
  
  async getVisibleMapLayers(): Promise<MapLayer[]> {
    return db.select().from(mapLayers).where(eq(mapLayers.visible, true));
  }
  
  async updateMapLayer(id: number, updates: Partial<{
    visible: boolean;
    opacity: number;
    zindex: number;
    order: number;
  }>): Promise<MapLayer> {
    const [updatedLayer] = await db.update(mapLayers)
      .set(updates)
      .where(eq(mapLayers.id, id))
      .returning();
      
    if (!updatedLayer) {
      throw new Error(`Map layer with ID ${id} not found`);
    }
    
    return updatedLayer;
  }
  
  // Search operations
  async getSearchHistory(userId?: number, limit?: number): Promise<SearchHistory[]> {
    let query = db.select().from(searchHistory);
    
    if (userId) {
      query = query.where(eq(searchHistory.userId, userId));
    }
    
    return query
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit || 10);
  }
  
  async saveSearchQuery(query: string, type: string, userId?: number, results?: number): Promise<SearchHistory> {
    const [searchEntry] = await db.insert(searchHistory)
      .values({
        userId: userId || null,
        query,
        type,
        resultCount: results || 0,
        createdAt: new Date()
      })
      .returning();
    
    return searchEntry;
  }
  
  async getSearchSuggestions(prefix: string, type?: string, limit?: number): Promise<SearchSuggestion[]> {
    let query = db.select().from(searchSuggestions);
    
    // Filter by prefix (starts with)
    if (prefix) {
      query = query.where(sql`${searchSuggestions.term} ILIKE ${prefix + '%'}`);
    }
    
    // Filter by type if provided
    if (type) {
      query = query.where(eq(searchSuggestions.type, type));
    }
    
    return query
      .orderBy(desc(searchSuggestions.priority))
      .limit(limit || 5);
  }
  
  async addSearchSuggestion(term: string, type: string, priority?: number, metadata?: any): Promise<SearchSuggestion> {
    const [suggestion] = await db.insert(searchSuggestions)
      .values({
        term,
        type,
        priority: priority || 0,
        metadata: metadata || null,
        createdAt: new Date()
      })
      .returning();
    
    return suggestion;
  }
  
  // Map bookmarks operations
  async getMapBookmarks(userId: number): Promise<MapBookmark[]> {
    return db.select()
      .from(mapBookmarks)
      .where(eq(mapBookmarks.userId, userId))
      .orderBy(asc(mapBookmarks.name));
  }
  
  async getMapBookmark(id: number): Promise<MapBookmark | undefined> {
    const [bookmark] = await db.select()
      .from(mapBookmarks)
      .where(eq(mapBookmarks.id, id));
    
    return bookmark;
  }
  
  async createMapBookmark(bookmark: InsertMapBookmark): Promise<MapBookmark> {
    const [newBookmark] = await db.insert(mapBookmarks)
      .values({
        ...bookmark,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newBookmark;
  }
  
  async updateMapBookmark(id: number, updates: Partial<Omit<InsertMapBookmark, 'id'>>): Promise<MapBookmark> {
    const [updatedBookmark] = await db.update(mapBookmarks)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(mapBookmarks.id, id))
      .returning();
    
    if (!updatedBookmark) {
      throw new Error(`Map bookmark with ID ${id} not found`);
    }
    
    return updatedBookmark;
  }
  
  async deleteMapBookmark(id: number): Promise<boolean> {
    const result = await db.delete(mapBookmarks)
      .where(eq(mapBookmarks.id, id));
    
    return result.rowCount > 0;
  }
  
  // Map preferences operations
  async getMapPreference(userId: number): Promise<MapPreference | undefined> {
    const [preference] = await db.select()
      .from(mapPreferences)
      .where(eq(mapPreferences.userId, userId));
    
    return preference;
  }
  
  async getMapPreferences(userId: number): Promise<MapPreference | undefined> {
    // This is an alias for getMapPreference for API consistency
    return this.getMapPreference(userId);
  }
  
  async createMapPreferences(preference: InsertMapPreference): Promise<MapPreference> {
    const [newPreference] = await db.insert(mapPreferences)
      .values({
        ...preference,
        updatedAt: new Date()
      })
      .returning();
    
    return newPreference;
  }
  
  async createOrUpdateMapPreference(preference: InsertMapPreference): Promise<MapPreference> {
    const existingPreference = await this.getMapPreference(preference.userId);
    
    if (existingPreference) {
      const [updatedPreference] = await db.update(mapPreferences)
        .set({
          ...preference,
          updatedAt: new Date()
        })
        .where(eq(mapPreferences.id, existingPreference.id))
        .returning();
      
      return updatedPreference;
    } else {
      const [newPreference] = await db.insert(mapPreferences)
        .values({
          ...preference,
          updatedAt: new Date()
        })
        .returning();
      
      return newPreference;
    }
  }
  
  async updateMapPreferences(userId: number, updates: Partial<Omit<InsertMapPreference, 'id'>>): Promise<MapPreference> {
    const existingPreference = await this.getMapPreference(userId);
    
    if (!existingPreference) {
      throw new Error(`Map preferences not found for user ${userId}`);
    }
    
    const [updatedPreference] = await db.update(mapPreferences)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(mapPreferences.id, existingPreference.id))
      .returning();
    
    return updatedPreference;
  }
  
  async resetMapPreferences(userId: number): Promise<MapPreference> {
    const existingPreference = await this.getMapPreference(userId);
    
    // Default preferences configuration
    const defaultPreference: InsertMapPreference = {
      userId,
      defaultCenter: { lat: 44.5646, lng: -123.2620 }, // Default to Benton County coordinates
      defaultZoom: 12,
      baseLayer: "streets",
      layerVisibility: "all",
      theme: "light",
      measurement: { enabled: false, unit: "imperial" },
      snapToFeature: false,
      showLabels: true,
      animation: true
    };
    
    if (existingPreference) {
      // Update existing preference with default values
      const [resetPreference] = await db.update(mapPreferences)
        .set({
          ...defaultPreference,
          id: existingPreference.id,
          updatedAt: new Date()
        })
        .where(eq(mapPreferences.id, existingPreference.id))
        .returning();
      
      return resetPreference;
    } else {
      // Create new default preferences
      return this.createMapPreferences(defaultPreference);
    }
  }
  
  // Recently viewed parcels operations
  async getRecentlyViewedParcels(userId: number, limit?: number): Promise<RecentlyViewedParcel[]> {
    return db.select()
      .from(recentlyViewedParcels)
      .where(eq(recentlyViewedParcels.userId, userId))
      .orderBy(desc(recentlyViewedParcels.viewedAt))
      .limit(limit || 10);
  }
  
  async addRecentlyViewedParcel(data: InsertRecentlyViewedParcel): Promise<RecentlyViewedParcel> {
    const userId = data.userId;
    const parcelId = data.parcelId;
    
    // Check if this combination already exists
    const [existingRecord] = await db.select()
      .from(recentlyViewedParcels)
      .where(
        and(
          eq(recentlyViewedParcels.userId, userId),
          eq(recentlyViewedParcels.parcelId, parcelId)
        )
      );
    
    if (existingRecord) {
      // Update the viewed timestamp
      const [updatedRecord] = await db.update(recentlyViewedParcels)
        .set({
          viewedAt: data.viewedAt || new Date()
        })
        .where(eq(recentlyViewedParcels.id, existingRecord.id))
        .returning();
      
      return updatedRecord;
    } else {
      // Create a new record
      const [newRecord] = await db.insert(recentlyViewedParcels)
        .values({
          id: data.id,
          userId,
          parcelId,
          viewedAt: new Date()
        })
        .returning();
      
      return newRecord;
    }
  }
  
  async removeRecentlyViewedParcel(id: number): Promise<boolean> {
    const result = await db.delete(recentlyViewedParcels)
      .where(eq(recentlyViewedParcels.id, id));
    
    return result.rowCount > 0;
  }
  
  async clearRecentlyViewedParcels(userId: number): Promise<boolean> {
    const result = await db.delete(recentlyViewedParcels)
      .where(eq(recentlyViewedParcels.userId, userId));
    
    return result.rowCount > 0;
  }

  // Document Lineage Entity Operations
  async createDocument(data: InsertDocumentEntity): Promise<DocumentEntity> {
    const id = `doc_${this.nextDocEntityId++}`;
    const document: DocumentEntity = {
      id,
      documentType: data.documentType,
      documentName: data.documentName,
      description: data.description,
      fileSize: data.fileSize,
      fileHash: data.fileHash,
      parcelId: data.parcelId,
      uploadedBy: data.uploadedBy,
      createdAt: new Date(),
      status: 'active'
    };
    
    this.documentEntities.set(id, document);
    return document;
  }
  
  async getDocumentById(id: string): Promise<DocumentEntity | undefined> {
    return this.documentEntities.get(id);
  }
  
  async updateDocument(id: string, data: Partial<InsertDocumentEntity>): Promise<DocumentEntity | undefined> {
    const document = this.documentEntities.get(id);
    if (!document) {
      return undefined;
    }
    
    const updatedDocument: DocumentEntity = {
      ...document,
      documentType: data.documentType || document.documentType,
      documentName: data.documentName || document.documentName,
      description: data.description !== undefined ? data.description : document.description,
      fileSize: data.fileSize !== undefined ? data.fileSize : document.fileSize,
      fileHash: data.fileHash !== undefined ? data.fileHash : document.fileHash,
      parcelId: data.parcelId !== undefined ? data.parcelId : document.parcelId,
      uploadedBy: data.uploadedBy !== undefined ? data.uploadedBy : document.uploadedBy,
    };
    
    this.documentEntities.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async listDocuments(filters?: Partial<DocumentEntity>): Promise<DocumentEntity[]> {
    let documents = Array.from(this.documentEntities.values());
    
    // Apply filters if provided
    if (filters) {
      documents = documents.filter(doc => {
        for (const [key, value] of Object.entries(filters)) {
          // Skip undefined values in filters
          if (value === undefined) continue;
          
          // Handle special cases
          if (key === 'createdAt' && doc.createdAt !== value) {
            return false;
          }
          
          // @ts-ignore - We're dynamically accessing properties
          if (doc[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    return documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Document Lineage Event Operations
  async createLineageEvent(data: InsertDocumentLineageEvent): Promise<DocumentLineageEvent> {
    const id = `event_${this.nextLineageEventId++}`;
    const event: DocumentLineageEvent = {
      id,
      eventType: data.eventType,
      documentId: data.documentId,
      performedBy: data.performedBy,
      details: data.details,
      confidence: data.confidence,
      eventTimestamp: new Date()
    };
    
    this.documentLineageEvents.set(id, event);
    return event;
  }
  
  async getLineageEventsForDocument(documentId: string): Promise<DocumentLineageEvent[]> {
    return Array.from(this.documentLineageEvents.values())
      .filter(event => event.documentId === documentId)
      .sort((a, b) => b.eventTimestamp.getTime() - a.eventTimestamp.getTime());
  }
  
  // Document Relationship Operations
  async createRelationship(data: InsertDocumentRelationship): Promise<DocumentRelationship> {
    const id = `rel_${this.nextRelationshipId++}`;
    const relationship: DocumentRelationship = {
      id,
      sourceDocumentId: data.sourceDocumentId,
      targetDocumentId: data.targetDocumentId,
      relationshipType: data.relationshipType,
      notes: data.notes,
      metadata: data.metadata,
      createdAt: new Date()
    };
    
    this.documentRelationships.set(id, relationship);
    return relationship;
  }
  
  async getRelationshipsForDocument(documentId: string, relationshipType?: string): Promise<DocumentRelationship[]> {
    return Array.from(this.documentRelationships.values())
      .filter(rel => {
        const matchesDocument = rel.sourceDocumentId === documentId || rel.targetDocumentId === documentId;
        const matchesType = relationshipType ? rel.relationshipType === relationshipType : true;
        return matchesDocument && matchesType;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Document Processing Stage Operations
  async createProcessingStage(data: InsertDocumentProcessingStage): Promise<DocumentProcessingStage> {
    const id = `stage_${this.nextProcessingStageId++}`;
    const stage: DocumentProcessingStage = {
      id,
      documentId: data.documentId,
      stageName: data.stageName,
      processorName: data.processorName,
      processorVersion: data.processorVersion,
      result: data.result,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      completedAt: undefined
    };
    
    this.documentProcessingStages.set(id, stage);
    return stage;
  }
  
  async getProcessingStagesForDocument(documentId: string): Promise<DocumentProcessingStage[]> {
    return Array.from(this.documentProcessingStages.values())
      .filter(stage => stage.documentId === documentId)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  }
  
  async updateProcessingStage(id: string, data: Partial<InsertDocumentProcessingStage>): Promise<DocumentProcessingStage | undefined> {
    const stage = this.documentProcessingStages.get(id);
    if (!stage) {
      return undefined;
    }
    
    // Update the specified fields
    const updatedStage: DocumentProcessingStage = {
      ...stage,
      stageName: data.stageName || stage.stageName,
      processorName: data.processorName !== undefined ? data.processorName : stage.processorName,
      processorVersion: data.processorVersion !== undefined ? data.processorVersion : stage.processorVersion,
      result: data.result !== undefined ? data.result : stage.result,
    };
    
    this.documentProcessingStages.set(id, updatedStage);
    return updatedStage;
  }
  
  // Helper method to update a processing stage's status and progress
  async updateProcessingStageStatus(
    id: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'failed', 
    progress: number, 
    completedAt?: Date
  ): Promise<DocumentProcessingStage | undefined> {
    const stage = this.documentProcessingStages.get(id);
    if (!stage) {
      return undefined;
    }
    
    const updatedStage: DocumentProcessingStage = {
      ...stage,
      status,
      progress,
      completedAt: completedAt || (status === 'completed' ? new Date() : stage.completedAt)
    };
    
    this.documentProcessingStages.set(id, updatedStage);
    return updatedStage;
  }
  
  // Lineage Graph Generation
  async getDocumentLineage(documentId: string, depth: number = 2): Promise<DocumentLineageGraph> {
    const document = await this.getDocumentById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    const graph: DocumentLineageGraph = {
      nodes: [],
      edges: [],
      metadata: {
        generatedAt: new Date(),
        depth,
        rootDocumentId: documentId
      }
    };
    
    // Start building the graph with the source document
    await this.buildLineageGraph(document, graph, depth, 'outgoing');
    
    return graph;
  }
  
  async getDocumentProvenance(documentId: string, depth: number = 2): Promise<DocumentLineageGraph> {
    const document = await this.getDocumentById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    const graph: DocumentLineageGraph = {
      nodes: [],
      edges: [],
      metadata: {
        generatedAt: new Date(),
        depth,
        rootDocumentId: documentId
      }
    };
    
    // Start building the graph with the source document (in the 'incoming' direction)
    await this.buildLineageGraph(document, graph, depth, 'incoming');
    
    return graph;
  }
  
  async getCompleteDocumentGraph(documentIds: string[]): Promise<DocumentLineageGraph> {
    const graph: DocumentLineageGraph = {
      nodes: [],
      edges: [],
      metadata: {
        generatedAt: new Date(),
        documentCount: documentIds.length
      }
    };
    
    // Process each document
    for (const documentId of documentIds) {
      const document = await this.getDocumentById(documentId);
      if (document) {
        // Add both incoming and outgoing relationships, but with a limited depth
        await this.buildLineageGraph(document, graph, 1, 'both');
      }
    }
    
    return graph;
  }
  
  /**
   * Helper method to recursively build lineage graphs
   * @param document The document to process
   * @param graph The graph to build
   * @param remainingDepth How many more levels to traverse
   * @param direction 'outgoing' for lineage, 'incoming' for provenance, 'both' for complete graph
   */
  private async buildLineageGraph(
    document: DocumentEntity,
    graph: DocumentLineageGraph,
    remainingDepth: number,
    direction: 'incoming' | 'outgoing' | 'both'
  ): Promise<void> {
    // Check if we've already included this document node to prevent cycles
    const existingDocNode = graph.nodes.find(node => 
      node.type === 'document' && node.data.entityId === document.id);
    
    if (!existingDocNode) {
      // Create and add document node
      const documentNode: DocumentLineageNode = {
        id: `node_doc_${document.id}`,
        type: 'document',
        label: document.documentName,
        data: {
          entityId: document.id,
          documentName: document.documentName,
          documentType: document.documentType,
          createdAt: document.createdAt,
          uploadedBy: document.uploadedBy,
          parcelId: document.parcelId,
          status: document.status,
          description: document.description,
          fileSize: document.fileSize,
          fileHash: document.fileHash
        }
      };
      graph.nodes.push(documentNode);
      
      // Add events for this document
      const events = await this.getLineageEventsForDocument(document.id);
      for (const event of events) {
        const eventNode: DocumentLineageNode = {
          id: `node_event_${event.id}`,
          type: 'event',
          label: event.eventType,
          data: {
            entityId: event.id,
            eventType: event.eventType,
            eventTimestamp: event.eventTimestamp,
            performedBy: event.performedBy,
            documentId: event.documentId,
            details: event.details,
            confidence: event.confidence
          }
        };
        graph.nodes.push(eventNode);
        
        // Add edge from document to event
        const eventEdge: DocumentLineageEdge = {
          id: `edge_doc_event_${document.id}_${event.id}`,
          source: `node_doc_${document.id}`,
          target: `node_event_${event.id}`,
          type: 'has_event',
          label: 'has event'
        };
        graph.edges.push(eventEdge);
      }
      
      // Add processing stages for this document
      const stages = await this.getProcessingStagesForDocument(document.id);
      for (const stage of stages) {
        const stageNode: DocumentLineageNode = {
          id: `node_stage_${stage.id}`,
          type: 'processing',
          label: stage.stageName,
          data: {
            entityId: stage.id,
            stageName: stage.stageName,
            status: stage.status,
            startedAt: stage.startedAt,
            completedAt: stage.completedAt,
            processorName: stage.processorName,
            processorVersion: stage.processorVersion,
            progress: stage.progress,
            documentId: stage.documentId,
            result: stage.result
          }
        };
        graph.nodes.push(stageNode);
        
        // Add edge from document to stage
        const stageEdge: DocumentLineageEdge = {
          id: `edge_doc_stage_${document.id}_${stage.id}`,
          source: `node_doc_${document.id}`,
          target: `node_stage_${stage.id}`,
          type: 'has_processing',
          label: 'processed by'
        };
        graph.edges.push(stageEdge);
      }
      
      // Stop recursion if we've reached the depth limit
      if (remainingDepth <= 0) {
        return;
      }
      
      // Process relationships based on direction
      const relationships = await this.getRelationshipsForDocument(document.id);
      
      for (const relationship of relationships) {
        if (direction === 'outgoing' || direction === 'both') {
          // Outgoing relationships (document is the source)
          if (relationship.sourceDocumentId === document.id) {
            const targetDocument = await this.getDocumentById(relationship.targetDocumentId);
            if (targetDocument) {
              // Add the target document and the relationship
              await this.buildLineageGraph(targetDocument, graph, remainingDepth - 1, direction);
              
              // Add edge from source to target
              const edge: DocumentLineageEdge = {
                id: `edge_rel_${relationship.id}`,
                source: `node_doc_${document.id}`,
                target: `node_doc_${relationship.targetDocumentId}`,
                type: relationship.relationshipType,
                label: relationship.relationshipType,
                data: {
                  notes: relationship.notes,
                  metadata: relationship.metadata,
                  createdAt: relationship.createdAt
                }
              };
              
              // Check if this edge already exists to prevent duplicates
              if (!graph.edges.some(e => e.id === edge.id)) {
                graph.edges.push(edge);
              }
            }
          }
        }
        
        if (direction === 'incoming' || direction === 'both') {
          // Incoming relationships (document is the target)
          if (relationship.targetDocumentId === document.id) {
            const sourceDocument = await this.getDocumentById(relationship.sourceDocumentId);
            if (sourceDocument) {
              // Add the source document and the relationship
              await this.buildLineageGraph(sourceDocument, graph, remainingDepth - 1, direction);
              
              // Add edge from source to target
              const edge: DocumentLineageEdge = {
                id: `edge_rel_${relationship.id}`,
                source: `node_doc_${relationship.sourceDocumentId}`,
                target: `node_doc_${document.id}`,
                type: relationship.relationshipType,
                label: relationship.relationshipType,
                data: {
                  notes: relationship.notes,
                  metadata: relationship.metadata,
                  createdAt: relationship.createdAt
                }
              };
              
              // Check if this edge already exists to prevent duplicates
              if (!graph.edges.some(e => e.id === edge.id)) {
                graph.edges.push(edge);
              }
            }
          }
        }
      }
    }
  }
  
  // Document Lineage methods
  
  /**
   * Creates a new document entity
   */
  async createDocument(data: InsertDocumentEntity): Promise<DocumentEntity> {
    const document: DocumentEntity = {
      id: uuidv4(),
      documentType: data.documentType,
      documentName: data.documentName,
      createdAt: new Date(),
      status: 'active',
      description: data.description,
      fileSize: data.fileSize,
      fileHash: data.fileHash,
      parcelId: data.parcelId,
      uploadedBy: data.uploadedBy
    };
    
    this.documentEntities.set(document.id, document);
    return document;
  }

  /**
   * Retrieves a document by its ID
   */
  async getDocumentById(id: string): Promise<DocumentEntity | undefined> {
    return this.documentEntities.get(id);
  }

  /**
   * Updates an existing document
   */
  async updateDocument(id: string, data: Partial<InsertDocumentEntity>): Promise<DocumentEntity | undefined> {
    const document = this.documentEntities.get(id);
    
    if (!document) {
      return undefined;
    }
    
    const updatedDocument: DocumentEntity = {
      ...document,
      ...data
    };
    
    this.documentEntities.set(id, updatedDocument);
    return updatedDocument;
  }

  /**
   * Lists documents matching optional filters
   */
  async listDocuments(filters?: Partial<DocumentEntity>): Promise<DocumentEntity[]> {
    const documents = Array.from(this.documentEntities.values());
    
    if (!filters) {
      return documents;
    }
    
    return documents.filter(document => {
      // Check each filter property
      for (const [key, value] of Object.entries(filters)) {
        if (document[key as keyof DocumentEntity] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Creates a new lineage event
   */
  async createLineageEvent(data: InsertDocumentLineageEvent): Promise<DocumentLineageEvent> {
    const event: DocumentLineageEvent = {
      id: uuidv4(),
      eventType: data.eventType,
      eventTimestamp: new Date(),
      documentId: data.documentId,
      performedBy: data.performedBy,
      details: data.details,
      confidence: data.confidence
    };
    
    this.documentLineageEvents.set(event.id, event);
    return event;
  }

  /**
   * Gets lineage events for a document
   */
  async getLineageEventsForDocument(documentId: string): Promise<DocumentLineageEvent[]> {
    return Array.from(this.documentLineageEvents.values())
      .filter(event => event.documentId === documentId)
      .sort((a, b) => a.eventTimestamp.getTime() - b.eventTimestamp.getTime());
  }

  /**
   * Creates a new document relationship
   */
  async createRelationship(data: InsertDocumentRelationship): Promise<DocumentRelationship> {
    const relationship: DocumentRelationship = {
      id: uuidv4(),
      relationshipType: data.relationshipType,
      sourceDocumentId: data.sourceDocumentId,
      targetDocumentId: data.targetDocumentId,
      createdAt: new Date(),
      createdBy: data.createdBy,
      metadata: data.metadata
    };
    
    this.documentRelationships.set(relationship.id, relationship);
    return relationship;
  }

  /**
   * Gets relationships for a document
   * @param documentId - The document ID
   * @param relationshipType - Optional relationship type filter
   */
  async getRelationshipsForDocument(documentId: string, relationshipType?: string): Promise<DocumentRelationship[]> {
    return Array.from(this.documentRelationships.values())
      .filter(rel => 
        (rel.sourceDocumentId === documentId || rel.targetDocumentId === documentId) &&
        (!relationshipType || rel.relationshipType === relationshipType)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Creates a new document processing stage
   */
  async createProcessingStage(data: InsertDocumentProcessingStage): Promise<DocumentProcessingStage> {
    const stage: DocumentProcessingStage = {
      id: uuidv4(),
      documentId: data.documentId,
      stageName: data.stageName,
      stageType: data.stageType,
      status: 'pending',
      startedAt: new Date(),
      progress: 0,
      processorId: data.processorId,
      processorName: data.processorName,
      params: data.params,
      completedAt: null
    };
    
    this.documentProcessingStages.set(stage.id, stage);
    return stage;
  }

  /**
   * Gets processing stages for a document
   */
  async getProcessingStagesForDocument(documentId: string): Promise<DocumentProcessingStage[]> {
    return Array.from(this.documentProcessingStages.values())
      .filter(stage => stage.documentId === documentId)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  }

  /**
   * Updates an existing processing stage
   */
  async updateProcessingStage(id: string, data: Partial<InsertDocumentProcessingStage>): Promise<DocumentProcessingStage | undefined> {
    const stage = this.documentProcessingStages.get(id);
    
    if (!stage) {
      return undefined;
    }
    
    const updatedStage: DocumentProcessingStage = {
      ...stage,
      ...data
    };
    
    this.documentProcessingStages.set(id, updatedStage);
    return updatedStage;
  }
  
  /**
   * Updates processing stage status and progress
   */
  async updateProcessingStageStatus(
    id: string, 
    status: 'pending' | 'running' | 'completed' | 'failed', 
    progress?: number, 
    completedAt?: Date | null
  ): Promise<DocumentProcessingStage | undefined> {
    const stage = this.documentProcessingStages.get(id);
    
    if (!stage) {
      return undefined;
    }
    
    const updatedStage: DocumentProcessingStage = {
      ...stage,
      status,
      progress: progress !== undefined ? progress : stage.progress,
      completedAt: (status === 'completed' || status === 'failed') 
        ? completedAt || new Date() 
        : stage.completedAt
    };
    
    this.documentProcessingStages.set(id, updatedStage);
    return updatedStage;
  }

  /**
   * Generates a document lineage graph
   * Shows documents that were derived from the specified document
   */
  async getDocumentLineage(documentId: string, depth: number = 2): Promise<DocumentLineageGraph> {
    return documentLineageStorage.getDocumentLineage(documentId, depth);
  }

  /**
   * Generates a document provenance graph
   * Shows documents that the specified document was derived from
   */
  async getDocumentProvenance(documentId: string, depth: number = 2): Promise<DocumentLineageGraph> {
    return documentLineageStorage.getDocumentProvenance(documentId, depth);
  }

  /**
   * Generates a complete document graph for multiple documents
   */
  async getCompleteDocumentGraph(documentIds: string[]): Promise<DocumentLineageGraph> {
    return documentLineageStorage.getCompleteDocumentGraph(documentIds);
  }
}

// Use in-memory storage for development
export const storage = new MemStorage();
