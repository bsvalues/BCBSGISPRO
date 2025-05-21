import { pgTable, serial, text, varchar, timestamp, integer, boolean, json, doublePrecision, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Map Elements table - based on the 33 essential map elements for Benton County
export const mapElements = pgTable('map_elements', {
  id: serial('id').primaryKey(),
  elementId: varchar('element_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  importance: varchar('importance', { length: 20 }).notNull(), // 'high', 'medium', 'low'
  bentonCountyUsage: text('benton_county_usage').notNull(), // Specific usage in Benton County
  bentonCountyExample: text('benton_county_example'), // Real examples from Benton County
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Map Evaluation table - Stores user map evaluations with AI recommendations
export const mapEvaluations = pgTable('map_evaluations', {
  id: serial('id').primaryKey(),
  mapDescription: text('map_description').notNull(),
  mapPurpose: text('map_purpose').notNull(),
  mapContext: text('map_context'),
  overallScore: integer('overall_score').notNull(),
  aiRecommendations: text('ai_recommendations').notNull(),
  userId: integer('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Element Evaluations - Individual element evaluations within a map evaluation
export const elementEvaluations = pgTable('element_evaluations', {
  id: serial('id').primaryKey(),
  mapEvaluationId: integer('map_evaluation_id').notNull(),
  elementId: varchar('element_id', { length: 50 }).notNull(),
  implementationStatus: varchar('implementation_status', { length: 20 }).notNull(), // 'implemented', 'partial', 'missing'
  aiTips: text('ai_tips'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User tables for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }),
  role: varchar('role', { length: 50 }).notNull().default('public'),  // 'admin', 'staff', 'field', 'public'
  permissions: json('permissions'),  // JSON array of specific permissions
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Benton County Maps table - for saving real maps created for Benton County
export const bentonCountyMaps = pgTable('benton_county_maps', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  purpose: text('purpose').notNull(),
  creator: varchar('creator', { length: 100 }),
  department: varchar('department', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id'),
  isPublic: boolean('is_public').default(false),
  mapUrl: text('map_url'), // URL to the actual map file
  evaluationId: integer('evaluation_id'), // Reference to AI evaluation if available
});

// Achievements table - for the gamified achievement system
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // e.g., 'sync', 'map', 'legal', 'document'
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'milestone', 'streak', 'skill'
  points: integer('points').notNull().default(10),
  icon: varchar('icon', { length: 100 }).notNull(), // Icon name from lucide-react
  color: varchar('color', { length: 20 }).notNull(), // CSS color for the badge
  criteria: text('criteria').notNull(), // Description of how to earn the achievement
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User Achievements table - tracks which users have earned which achievements
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  achievementId: integer('achievement_id').notNull(),
  earnedAt: timestamp('earned_at').defaultNow(),
  progress: integer('progress').notNull().default(100), // Can be < 100 for partial completion
  metadata: json('metadata'), // Additional data about how achievement was earned
});

// Zod schemas for validation
export const insertMapElementSchema = createInsertSchema(mapElements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMapEvaluationSchema = createInsertSchema(mapEvaluations).omit({ id: true, createdAt: true, overallScore: true, aiRecommendations: true });
export const insertElementEvaluationSchema = createInsertSchema(elementEvaluations).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });
export const insertBentonCountyMapSchema = createInsertSchema(bentonCountyMaps).omit({ id: true, createdAt: true, updatedAt: true, evaluationId: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, earnedAt: true });

// Types using Zod inference
export type InsertMapElement = z.infer<typeof insertMapElementSchema>;
export type InsertMapEvaluation = z.infer<typeof insertMapEvaluationSchema>;
export type InsertElementEvaluation = z.infer<typeof insertElementEvaluationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBentonCountyMap = z.infer<typeof insertBentonCountyMapSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Select types using Drizzle inference
export type MapElement = typeof mapElements.$inferSelect;
export type MapEvaluation = typeof mapEvaluations.$inferSelect;
export type ElementEvaluation = typeof elementEvaluations.$inferSelect;
export type User = typeof users.$inferSelect;
export type BentonCountyMap = typeof bentonCountyMaps.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;

// Legal Description Types
export interface ParsedLegalDescription {
  section?: string;
  township?: string;
  range?: string;
  plat?: string;
  lot?: string;
  block?: string;
  subdivision?: string;
  boundaryPoints?: string[];
  acreage?: string;
  quarterSections?: string[];
  rawDescription: string;
}

export interface LegalDescriptionResult {
  validationScore: number;
  issues: string[];
  recommendations: string[];
  interpretation: string;
  boundaryDescription: string;
  drawingInstructions: string[];
  validationMethod?: string;
}

export interface LegalDescriptionVisualization {
  coordinates: [number, number][];
  cardinalPoints: string[];
  shapeType: string;
  estimatedArea: number;
  geometry?: any; // GeoJSON geometry
}

// County Assessment System Tables
// Counties Table
export const counties = pgTable('counties', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  population: integer('population'),
  area: doublePrecision('area'), // in square miles
  gisEnabled: boolean('gis_enabled').default(true),
  boundaries: json('boundaries'), // GeoJSON boundary data
  contact: json('contact'), // Contact information (address, phone, email)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Parcels Table
export const parcels = pgTable('parcels', {
  id: uuid('id').primaryKey(),
  parcelNumber: varchar('parcel_number', { length: 50 }).notNull().unique(),
  countyId: uuid('county_id').notNull(), // Foreign key to counties
  address: varchar('address', { length: 255 }),
  owner: varchar('owner', { length: 150 }),
  legalDescription: text('legal_description'),
  acres: doublePrecision('acres'),
  landUseCode: varchar('land_use_code', { length: 20 }),
  zoning: varchar('zoning', { length: 50 }),
  geometry: json('geometry'), // GeoJSON for parcel boundaries
  metadata: json('metadata'), // Additional parcel data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Valuations Table
export const valuations = pgTable('valuations', {
  id: uuid('id').primaryKey(),
  parcelId: uuid('parcel_id').notNull(), // Foreign key to parcels
  countyId: uuid('county_id').notNull(), // Foreign key to counties
  valuationDate: timestamp('valuation_date').notNull(),
  requestedBy: varchar('requested_by', { length: 100 }),
  landValue: doublePrecision('land_value').notNull().default(0),
  improvementsValue: doublePrecision('improvements_value').notNull().default(0),
  totalValue: doublePrecision('total_value').notNull().default(0),
  confidence: doublePrecision('confidence').default(1.0), // AI confidence score (0-1)
  method: varchar('method', { length: 50 }).notNull(), // 'manual', 'automated', 'ai', etc.
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'completed', 'rejected'
  comparableProperties: json('comparable_properties'),
  factors: json('factors'), // Valuation factors considered
  notes: text('notes'),
  metadata: json('metadata'), // Additional valuation data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Map Layers Table
export const mapLayers = pgTable('map_layers', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  countyId: uuid('county_id').notNull(), // Foreign key to counties
  description: text('description'),
  layerType: varchar('layer_type', { length: 50 }).notNull(), // 'vector', 'raster', 'tile', etc.
  source: varchar('source', { length: 255 }), // URL, file path, etc.
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'geojson', 'wms', 'shapefile', etc.
  styling: json('styling'), // Layer styling information
  visible: boolean('visible').default(true),
  minZoom: integer('min_zoom'),
  maxZoom: integer('max_zoom'),
  zIndex: integer('z_index').default(0),
  opacity: integer('opacity').default(100), // 0-100
  metadata: json('metadata'), // Additional layer metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Create Zod schemas for validation
export const insertCountySchema = createInsertSchema(counties).omit({ id: true, createdAt: true, updatedAt: true });
export const insertParcelSchema = createInsertSchema(parcels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertValuationSchema = createInsertSchema(valuations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMapLayerSchema = createInsertSchema(mapLayers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });

// Types using Zod inference
export type InsertCounty = z.infer<typeof insertCountySchema>;
export type InsertParcel = z.infer<typeof insertParcelSchema>;
export type InsertValuation = z.infer<typeof insertValuationSchema>;
export type InsertMapLayer = z.infer<typeof insertMapLayerSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;



// Workflows table - for tracking assessment workflows
export const workflows = pgTable('workflows', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'property_assessment', 'boundary_adjustment', etc.
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft', 'in_progress', 'review', 'completed', 'archived'
  priority: varchar('priority', { length: 20 }).notNull().default('medium'), // 'high', 'medium', 'low'
  createdBy: integer('created_by').notNull(), // Reference to user id
  assignedTo: integer('assigned_to'), // Reference to user id
  parcelId: varchar('parcel_id', { length: 100 }), // Reference to parcel number
  metadata: json('metadata'), // Additional workflow data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  dueDate: timestamp('due_date'),
});

// Documents table - for document management
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // 'pdf', 'image', 'text', etc.
  filePath: varchar('file_path', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // 'deed', 'survey', 'tax_form', etc.
  uploadedBy: integer('uploaded_by').notNull(), // Reference to user id
  parcelId: varchar('parcel_id', { length: 100 }), // Reference to parcel number
  workflowId: integer('workflow_id'), // Optional reference to workflow
  isPublic: boolean('is_public').default(false),
  metadata: json('metadata'), // Additional document metadata
  classification: json('classification'), // Document classification results
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Select types using Drizzle inference
export type County = typeof counties.$inferSelect;
export type Parcel = typeof parcels.$inferSelect;
export type Valuation = typeof valuations.$inferSelect;
export type MapLayer = typeof mapLayers.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type Document = typeof documents.$inferSelect;