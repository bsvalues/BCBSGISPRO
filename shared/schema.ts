import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  department: text("department"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  department: true,
  isAdmin: true,
});

// Workflow types enum
export const workflowTypeEnum = pgEnum("workflow_type", [
  "long_plat",
  "bla",
  "merge_split",
  "sm00_report",
]);

export enum WorkflowType {
  LONG_PLAT = "long_plat",
  BLA = "bla",
  MERGE_SPLIT = "merge_split",
  SM00_REPORT = "sm00_report",
}

// Workflow status enum
export const workflowStatusEnum = pgEnum("workflow_status", [
  "draft",
  "in_progress",
  "review",
  "completed",
  "archived",
]);

// Workflow priority enum
export const workflowPriorityEnum = pgEnum("workflow_priority", [
  "low",
  "medium",
  "high",
]);

// Workflows table
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: workflowTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: workflowStatusEnum("status").default("draft"),
  priority: workflowPriorityEnum("priority").default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  userId: true,
  type: true,
  title: true,
  description: true,
  status: true,
  priority: true,
});

// Workflow state (for storing form data)
export const workflowStates = pgTable("workflow_states", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  currentStep: integer("current_step").default(1),
  formData: jsonb("form_data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkflowStateSchema = createInsertSchema(workflowStates).pick({
  workflowId: true,
  currentStep: true,
  formData: true,
});

// Workflow Events table for tracking timeline
export const workflowEventTypeEnum = pgEnum("workflow_event_type", [
  "created",
  "updated",
  "status_changed",
  "priority_changed",
  "document_added",
  "parcel_added"
]);

export const workflowEvents = pgTable("workflow_events", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  eventType: workflowEventTypeEnum("event_type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional event data (e.g., old/new values)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertWorkflowEventSchema = createInsertSchema(workflowEvents).omit({
  id: true,
  createdAt: true,
});

// Checklist items
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  order: integer("order").notNull(),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  workflowId: true,
  title: true,
  description: true,
  completed: true,
  order: true,
});

// Document Types
export const documentTypeEnum = pgEnum("document_type", [
  "plat_map",
  "deed",
  "survey",
  "legal_description",
  "boundary_line_adjustment",
  "tax_form",
  "unclassified",
]);

// Document Content Types
export const documentContentTypeEnum = pgEnum("document_content_type", [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
]);

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: documentTypeEnum("type").notNull(),
  contentType: documentContentTypeEnum("content_type").notNull(),
  contentHash: text("content_hash").notNull(), // Hash of document content for integrity checks
  storageKey: text("storage_key").notNull(), // Where the document is stored
  classification: jsonb("classification").$type<{
    documentType: string;
    confidence: number;
    wasManuallyClassified: boolean;
    classifiedAt: string;
  }>(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  contentHash: true,
  storageKey: true,
  classification: true,
  uploadedAt: true,
  updatedAt: true,
}).extend({
  content: z.string(), // Base64 encoded file content
});

// Document-Parcel Links
export const documentParcelLinks = pgTable("document_parcel_links", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  parcelId: integer("parcel_id").references(() => parcels.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentParcelLinkSchema = createInsertSchema(documentParcelLinks).omit({
  id: true,
  createdAt: true,
});

// Document Versions
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  versionNumber: integer("version_number").notNull(),
  contentHash: text("content_hash").notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
}).extend({
  content: z.string(), // Base64 encoded file content
});

// Parcels
export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  parcelNumber: text("parcel_number").notNull().unique(),
  workflowId: integer("workflow_id").references(() => workflows.id),
  parentParcelId: text("parent_parcel_id"),
  legalDescription: text("legal_description"),
  acreage: text("acreage"),
  address: text("address"),
  city: text("city"),
  zip: text("zip"),
  propertyType: text("property_type"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParcelSchema = createInsertSchema(parcels).pick({
  parcelNumber: true,
  workflowId: true,
  parentParcelId: true,
  legalDescription: true,
  acreage: true,
  address: true,
  city: true,
  zip: true,
  propertyType: true,
  isActive: true,
});

// Map layer type enum
export const mapLayerTypeEnum = pgEnum("map_layer_type", [
  "vector",
  "raster",
  "tile",
  "wms",
  "geojson"
]);

// Map layer source enum
export const mapLayerSourceEnum = pgEnum("map_layer_source", [
  "county",
  "state",
  "federal",
  "custom",
  "osm"
]);

// Map layers
export const mapLayers = pgTable("map_layers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  source: mapLayerSourceEnum("source").notNull(), // E.g., "county", "state", etc.
  type: mapLayerTypeEnum("type").notNull(), // E.g., "vector", "raster"
  visible: boolean("visible").default(true),
  opacity: integer("opacity").default(100), // Opacity percentage (0-100)
  zindex: integer("zindex").default(0), // Layer z-index for ordering (note: lowercase in DB)
  order: integer("order").default(0), // Display order in layer control
  metadata: jsonb("metadata"), // Additional layer info including style properties
  url: text("url"), // URL for external layers (WMS, tile)
  attribution: text("attribution"), // Copyright/attribution text
  category: text("category"), // Category for filtering (e.g., "basemap", "property", "environmental")
});

export const insertMapLayerSchema = createInsertSchema(mapLayers).pick({
  name: true,
  source: true,
  type: true,
  visible: true,
  opacity: true,
  zindex: true, // lowercase to match the database column name
  order: true,
  metadata: true,
  url: true,
  attribution: true,
  category: true,
});

// SM00 Reports
export const sm00Reports = pgTable("sm00_reports", {
  id: serial("id").primaryKey(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  generatedBy: integer("generated_by").notNull().references(() => users.id),
  status: text("status").notNull(), // "pending", "sent", etc.
  reportData: jsonb("report_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSM00ReportSchema = createInsertSchema(sm00Reports).pick({
  startDate: true,
  endDate: true,
  generatedBy: true,
  status: true,
  reportData: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowState = typeof workflowStates.$inferSelect;
export type InsertWorkflowState = z.infer<typeof insertWorkflowStateSchema>;

export type WorkflowEvent = typeof workflowEvents.$inferSelect;
export type InsertWorkflowEvent = z.infer<typeof insertWorkflowEventSchema>;

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentParcelLink = typeof documentParcelLinks.$inferSelect;
export type InsertDocumentParcelLink = z.infer<typeof insertDocumentParcelLinkSchema>;

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;

export type MapLayer = typeof mapLayers.$inferSelect;
export type InsertMapLayer = z.infer<typeof insertMapLayerSchema>;

export type SM00Report = typeof sm00Reports.$inferSelect;
export type InsertSM00Report = z.infer<typeof insertSM00ReportSchema>;
