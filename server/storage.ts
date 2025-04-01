import {
  users, type User, type InsertUser,
  workflows, type Workflow, type InsertWorkflow,
  workflowStates, type WorkflowState, type InsertWorkflowState,
  checklistItems, type ChecklistItem, type InsertChecklistItem,
  documents, type Document, type InsertDocument,
  parcels, type Parcel, type InsertParcel,
  mapLayers, type MapLayer,
  sm00Reports, type SM00Report
} from "@shared/schema";
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
  
  // Workflow state operations
  getWorkflowState(workflowId: number): Promise<WorkflowState | undefined>;
  updateWorkflowState(workflowId: number, state: InsertWorkflowState): Promise<WorkflowState>;
  
  // Checklist operations
  getChecklistItems(workflowId: number): Promise<ChecklistItem[]>;
  updateChecklistItem(itemId: number, completed: boolean): Promise<ChecklistItem>;
  
  // Document operations
  getDocuments(workflowId: number): Promise<Document[]>;
  addDocument(workflowId: number, doc: { name: string, type: string, content: string }): Promise<Document>;
  
  // Parcel operations
  generateParcelNumbers(parentParcelId: string, count: number): Promise<string[]>;
  getParcelInfo(parcelId: string): Promise<any | undefined>;
  searchParcelsByAddress(address: string, city?: string, zip?: string): Promise<any[]>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private workflowStates: Map<number, WorkflowState>;
  private checklistItems: Map<number, ChecklistItem>;
  private documents: Map<number, Document>;
  private parcels: Map<number, Parcel>;
  private mapLayers: Map<number, MapLayer>;
  private sm00Reports: Map<number, SM00Report>;
  
  sessionStore: ReturnType<typeof createMemoryStore>;
  
  userId: number;
  workflowId: number;
  stateId: number;
  checklistId: number;
  documentId: number;
  parcelId: number;
  layerId: number;
  reportId: number;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.workflowStates = new Map();
    this.checklistItems = new Map();
    this.documents = new Map();
    this.parcels = new Map();
    this.mapLayers = new Map();
    this.sm00Reports = new Map();
    
    this.userId = 1;
    this.workflowId = 1;
    this.stateId = 1;
    this.checklistId = 1;
    this.documentId = 1;
    this.parcelId = 1;
    this.layerId = 1;
    this.reportId = 1;
    
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
    
    return workflow;
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
  
  // Document operations
  async getDocuments(workflowId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter((doc) => doc.workflowId === workflowId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }
  
  async addDocument(workflowId: number, doc: { name: string, type: string, content: string }): Promise<Document> {
    const id = this.documentId++;
    const document: Document = {
      id,
      workflowId,
      name: doc.name,
      type: doc.type,
      content: doc.content,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
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
}

// DatabaseStorage implementation that uses Postgres/Drizzle
export class DatabaseStorage implements IStorage {
  sessionStore: ReturnType<typeof createMemoryStore>;

  constructor() {
    // Set up PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL
      },
      createTableIfMissing: true
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
    
    return workflow;
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

  // Document operations
  async getDocuments(workflowId: number): Promise<Document[]> {
    return db.select().from(documents)
      .where(eq(documents.workflowId, workflowId))
      .orderBy(desc(documents.uploadedAt));
  }

  async addDocument(workflowId: number, doc: { name: string, type: string, content: string }): Promise<Document> {
    const [document] = await db.insert(documents)
      .values({
        workflowId,
        name: doc.name,
        type: doc.type,
        content: doc.content,
        uploadedAt: new Date()
      })
      .returning();
    return document;
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
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
