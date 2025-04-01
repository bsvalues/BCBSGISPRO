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

// Workflows table
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: workflowTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: workflowStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  userId: true,
  type: true,
  title: true,
  description: true,
  status: true,
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

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(), // This would be a file path or content reference
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  workflowId: true,
  name: true,
  type: true,
  content: true,
});

// Parcels
export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  parcelNumber: text("parcel_number").notNull().unique(),
  workflowId: integer("workflow_id").references(() => workflows.id),
  parentParcelId: text("parent_parcel_id"),
  legalDescription: text("legal_description"),
  acreage: text("acreage"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParcelSchema = createInsertSchema(parcels).pick({
  parcelNumber: true,
  workflowId: true,
  parentParcelId: true,
  legalDescription: true,
  acreage: true,
  isActive: true,
});

// Map layers
export const mapLayers = pgTable("map_layers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  source: text("source").notNull(), // E.g., "county_gis", "arcgis", etc.
  type: text("type").notNull(), // E.g., "vector", "raster"
  visible: boolean("visible").default(true),
  metadata: jsonb("metadata"), // Additional layer info
});

export const insertMapLayerSchema = createInsertSchema(mapLayers).pick({
  name: true,
  source: true,
  type: true,
  visible: true,
  metadata: true,
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

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;

export type MapLayer = typeof mapLayers.$inferSelect;
export type InsertMapLayer = z.infer<typeof insertMapLayerSchema>;

export type SM00Report = typeof sm00Reports.$inferSelect;
export type InsertSM00Report = z.infer<typeof insertSM00ReportSchema>;
