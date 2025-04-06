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
  createParcel(parcel: Omit<InsertParcel, 'id'>): Promise<Parcel>;
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
  createOrUpdateMapPreference(preference: InsertMapPreference): Promise<MapPreference>;
  
  // Recently viewed parcels operations
  getRecentlyViewedParcels(userId: number, limit?: number): Promise<RecentlyViewedParcel[]>;
  addRecentlyViewedParcel(userId: number, parcelId: number): Promise<RecentlyViewedParcel>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private workflowStates: Map<number, WorkflowState>;
  private workflowEvents: Map<number, WorkflowEvent>;
  private checklistItems: Map<number, ChecklistItem>;
  private documents: Map<number, Document>;
  private parcels: Map<number, Parcel>;
  private mapLayers: Map<number, MapLayer>;
  private sm00Reports: Map<number, SM00Report>;
  private searchHistory: Map<number, SearchHistory>;
  private searchSuggestions: Map<number, SearchSuggestion>;
  private mapBookmarks: Map<number, MapBookmark>;
  private mapPreferences: Map<number, MapPreference>;
  private recentlyViewedParcels: Map<number, RecentlyViewedParcel>;
  
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
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.mapPreferences.set(id, newPreference);
      return newPreference;
    }
  }
  
  // Recently viewed parcels operations
  async getRecentlyViewedParcels(userId: number, limit?: number): Promise<RecentlyViewedParcel[]> {
    const limitCount = limit || 10;
    
    return Array.from(this.recentlyViewedParcels.values())
      .filter(record => record.userId === userId)
      .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime())
      .slice(0, limitCount);
  }
  
  async addRecentlyViewedParcel(userId: number, parcelId: number): Promise<RecentlyViewedParcel> {
    // Check if this parcel was already viewed by this user
    const existingRecord = Array.from(this.recentlyViewedParcels.values())
      .find(record => record.userId === userId && record.parcelId === parcelId);
    
    if (existingRecord) {
      // Update the existing record with the new timestamp
      const updatedRecord: RecentlyViewedParcel = {
        ...existingRecord,
        viewedAt: new Date()
      };
      
      this.recentlyViewedParcels.set(existingRecord.id, updatedRecord);
      return updatedRecord;
    } else {
      // Create a new record
      const id = this.recentlyViewedParcelId++;
      const newRecord: RecentlyViewedParcel = {
        id,
        userId,
        parcelId,
        viewedAt: new Date()
      };
      
      this.recentlyViewedParcels.set(id, newRecord);
      return newRecord;
    }
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
  
  // Recently viewed parcels operations
  async getRecentlyViewedParcels(userId: number, limit?: number): Promise<RecentlyViewedParcel[]> {
    return db.select()
      .from(recentlyViewedParcels)
      .where(eq(recentlyViewedParcels.userId, userId))
      .orderBy(desc(recentlyViewedParcels.viewedAt))
      .limit(limit || 10);
  }
  
  async addRecentlyViewedParcel(userId: number, parcelId: number): Promise<RecentlyViewedParcel> {
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
          viewedAt: new Date()
        })
        .where(eq(recentlyViewedParcels.id, existingRecord.id))
        .returning();
      
      return updatedRecord;
    } else {
      // Create a new record
      const [newRecord] = await db.insert(recentlyViewedParcels)
        .values({
          userId,
          parcelId,
          viewedAt: new Date()
        })
        .returning();
      
      return newRecord;
    }
  }
}

// Use DatabaseStorage instead of MemStorage
// Use in-memory storage for development
export const storage = new MemStorage();
