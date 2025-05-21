import { 
  pgTable, 
  varchar, 
  serial, 
  timestamp, 
  boolean, 
  json, 
  text, 
  index,
  foreignKey
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Create insert schema from the users table
export const insertUserSchema = createInsertSchema(users);

// Create types based on the schema
export type InsertUser = z.infer<typeof insertUserSchema>;

// Map layers for geographic information
export const mapLayers = pgTable("map_layers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  url: text("url").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "tile", "vector", "feature"
  isActive: boolean("is_active").default(true),
  zIndex: serial("z_index"),
  opacity: serial("opacity").default(100), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isVisible: boolean("is_visible").default(true),
  metadata: json("metadata"),
});

export type MapLayer = typeof mapLayers.$inferSelect;
export type InsertMapLayer = typeof mapLayers.$inferInsert;
export const insertMapLayerSchema = createInsertSchema(mapLayers);

// Parcels of land
export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  parcelNumber: varchar("parcel_number", { length: 100 }).notNull().unique(),
  countyId: varchar("county_id", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  owner: varchar("owner", { length: 255 }),
  legalDescription: text("legal_description"),
  acres: serial("acres"),
  landUseCode: varchar("land_use_code", { length: 50 }),
  zoning: varchar("zoning", { length: 50 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = typeof parcels.$inferInsert;
export const insertParcelSchema = createInsertSchema(parcels);

// Documents related to parcels
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "deed", "plat", "survey", etc.
  filePath: varchar("file_path", { length: 255 }),
  uploadedBy: varchar("uploaded_by", { length: 255 }).notNull(),
  classification: json("classification"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export const insertDocumentSchema = createInsertSchema(documents);

// Relationship between documents and parcels
export const documentParcelRelationships = pgTable("document_parcel_relationships", {
  id: serial("id").primaryKey(),
  documentId: serial("document_id").notNull().references(() => documents.id),
  parcelId: serial("parcel_id").notNull().references(() => parcels.id),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(), // "primary", "reference", etc.
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DocumentParcelRelationship = typeof documentParcelRelationships.$inferSelect;
export type InsertDocumentParcelRelationship = typeof documentParcelRelationships.$inferInsert;
export const insertDocumentParcelRelationshipSchema = createInsertSchema(documentParcelRelationships);

// Workflows for tracking assessment processes
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending", "in-progress", "complete", "cancelled"
  workflowType: varchar("workflow_type", { length: 50 }).notNull(), // "assessment", "appeal", "split", "merge"
  assignedTo: varchar("assigned_to", { length: 255 }),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  dueDate: timestamp("due_date"),
  priority: varchar("priority", { length: 50 }).default("medium"), // "low", "medium", "high", "urgent"
  metadata: json("metadata"),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;
export const insertWorkflowSchema = createInsertSchema(workflows);

// Events that occur during a workflow
export const workflowEvents = pgTable("workflow_events", {
  id: serial("id").primaryKey(),
  workflowId: serial("workflow_id").notNull().references(() => workflows.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // "created", "updated", "comment", "status-change"
  details: text("details"),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: json("metadata"),
});

export type WorkflowEvent = typeof workflowEvents.$inferSelect;
export type InsertWorkflowEvent = typeof workflowEvents.$inferInsert;
export const insertWorkflowEventSchema = createInsertSchema(workflowEvents);

// State of a workflow (stored as JSON)
export const workflowStates = pgTable("workflow_states", {
  id: serial("id").primaryKey(),
  workflowId: serial("workflow_id").notNull().references(() => workflows.id).unique(),
  state: json("state").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type WorkflowState = typeof workflowStates.$inferSelect;
export type InsertWorkflowState = typeof workflowStates.$inferInsert;
export const insertWorkflowStateSchema = createInsertSchema(workflowStates);

// Checklist items for workflows
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  workflowId: serial("workflow_id").notNull().references(() => workflows.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false),
  completedBy: varchar("completed_by", { length: 255 }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  dueDate: timestamp("due_date"),
  priority: varchar("priority", { length: 50 }).default("medium"), // "low", "medium", "high", "urgent"
  metadata: json("metadata"),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;
export const insertChecklistItemSchema = createInsertSchema(checklistItems);

// Counties for geographic data organization
export const counties = pgTable("counties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  state: varchar("state", { length: 2 }).notNull(),
  fips: varchar("fips", { length: 10 }).unique(),
  population: serial("population"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  metadata: json("metadata"),
});

export type County = typeof counties.$inferSelect;
export type InsertCounty = typeof counties.$inferInsert;
export const insertCountySchema = createInsertSchema(counties);