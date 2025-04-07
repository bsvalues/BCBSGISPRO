import { createInsertSchema } from 'drizzle-zod';
import { integer, json, pgEnum, pgTable, serial, text, timestamp, boolean, varchar, uniqueIndex, primaryKey, doublePrecision } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { DocumentType } from './document-types';

// Document lineage types
export const DOCUMENT_TYPES = [
  'DEED',
  'PLAT',
  'SURVEY',
  'EASEMENT',
  'TAX_RECORD',
  'LEGAL_DESCRIPTION',
  'PERMIT',
  'COVENANT',
  'ASSESSMENT',
  'TITLE_REPORT',
  'COURT_ORDER',
  'CORRESPONDENCE'
] as const;

export const EVENT_TYPES = [
  'UPLOAD',
  'DOWNLOAD',
  'VIEW',
  'EDIT',
  'ANNOTATION',
  'CLASSIFICATION',
  'VERIFICATION',
  'SHARING',
  'DELETION',
  'ARCHIVAL',
  'EXPORT',
  'LINK'
] as const;

export const RELATIONSHIP_TYPES = [
  'DERIVED_FROM',
  'SUPERSEDES',
  'REFERS_TO',
  'SUPPLEMENTS',
  'CONTRADICTS',
  'VALIDATES',
  'PART_OF',
  'CONTAINS',
  'PREDECESSOR',
  'SUCCESSOR'
] as const;

export const PROCESSING_STAGE_TYPES = [
  'OCR',
  'CLASSIFICATION',
  'ENTITY_EXTRACTION',
  'GEOCODING',
  'VALIDATION',
  'CONVERSION',
  'INDEXING',
  'QUALITY_CHECK',
  'ANONYMIZATION',
  'SUMMARIZATION'
] as const;

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  fullName: varchar('full_name', { length: 100 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLogin: timestamp('last_login')
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const insertUserSchema = createInsertSchema(users).omit({ passwordHash: true });

// Parcel table
export const parcels = pgTable('parcels', {
  id: serial('id').primaryKey(),
  parcelNumber: varchar('parcel_number', { length: 50 }).notNull().unique(),
  legalDescription: text('legal_description'),
  geometry: text('geometry'),
  owner: varchar('owner', { length: 100 }),
  address: varchar('address', { length: 200 }),
  city: varchar('city', { length: 100 }),
  zip: varchar('zip', { length: 20 }),
  propertyType: varchar('property_type', { length: 50 }),
  assessedValue: integer('assessed_value'),
  acres: integer('acres'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = typeof parcels.$inferInsert;
export const insertParcelSchema = createInsertSchema(parcels);

// Document table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  path: text('path').notNull(),
  size: integer('size').notNull(),
  parcelId: integer('parcel_id').references(() => parcels.id),
  uploadDate: timestamp('upload_date').defaultNow(),
  isArchived: boolean('is_archived').default(false)
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export const insertDocumentSchema = createInsertSchema(documents);

// Map annotations
export const annotations = pgTable('annotations', {
  id: serial('id').primaryKey(),
  parcelId: integer('parcel_id').references(() => parcels.id),
  type: varchar('type', { length: 50 }).notNull(),
  geometry: json('geometry').notNull(),
  properties: json('properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by')
});

export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = typeof annotations.$inferInsert;
export const insertAnnotationSchema = createInsertSchema(annotations);

// Map bookmarks for saved locations
export const mapBookmarks = pgTable('map_bookmarks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  zoom: integer('zoom').notNull(),
  icon: varchar('icon', { length: 50 }), // Icon name for the bookmark
  color: varchar('color', { length: 20 }), // Custom color for the bookmark
  tags: json('tags').$type<string[]>(), // Array of tags for filtering
  isDefault: boolean('is_default').default(false), // Whether this is the default location
  isPinned: boolean('is_pinned').default(false), // Whether this is pinned to the top
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type MapBookmark = typeof mapBookmarks.$inferSelect;
export type InsertMapBookmark = typeof mapBookmarks.$inferInsert;
export const insertMapBookmarkSchema = createInsertSchema(mapBookmarks);

// Enum for map layer types
export const mapLayerVisibilityEnum = pgEnum('map_layer_visibility', ['visible', 'hidden', 'custom']);
export const mapBaseLayerEnum = pgEnum('map_base_layer', ['satellite', 'streets', 'terrain', 'light', 'dark', 'custom']);
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

// User map preferences
export const mapPreferences = pgTable('map_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  defaultCenter: json('default_center').$type<{lat: number, lng: number}>().notNull(), // Default map center
  defaultZoom: integer('default_zoom').notNull().default(12),
  baseLayer: mapBaseLayerEnum('base_layer').notNull().default('streets'),
  layerVisibility: mapLayerVisibilityEnum('layer_visibility').notNull().default('visible'),
  customBaseLayer: varchar('custom_base_layer', { length: 255 }), // URL for custom tile layer
  layerSettings: json('layer_settings'), // JSON with layer visibility preferences
  uiSettings: json('ui_settings'), // UI preferences like control positions, auto-hiding, etc.
  theme: themeEnum('theme').notNull().default('light'),
  measurement: json('measurement').$type<{
    enabled: boolean;
    unit: 'imperial' | 'metric';
  }>().default({ enabled: false, unit: 'imperial' }),
  snapToFeature: boolean('snap_to_feature').default(true),
  showLabels: boolean('show_labels').default(true),
  animation: boolean('animation').default(true), // Enable animations for panning/zooming
  updatedAt: timestamp('updated_at').defaultNow()
});

export type MapPreference = typeof mapPreferences.$inferSelect;
export type InsertMapPreference = typeof mapPreferences.$inferInsert;
export const insertMapPreferenceSchema = createInsertSchema(mapPreferences);

// Recently viewed parcels (for quick access)
export const recentlyViewedParcels = pgTable('recently_viewed_parcels', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  parcelId: integer('parcel_id').references(() => parcels.id).notNull(),
  viewedAt: timestamp('viewed_at').defaultNow(),
  
  // Enforce uniqueness of user-parcel combinations
  // and allow ordering by most recently viewed
}, (table) => {
  return {
    userParcelIdx: uniqueIndex('user_parcel_idx').on(table.userId, table.parcelId)
  }
});

export type RecentlyViewedParcel = typeof recentlyViewedParcels.$inferSelect;
export type InsertRecentlyViewedParcel = typeof recentlyViewedParcels.$inferInsert;
export const insertRecentlyViewedParcelSchema = createInsertSchema(recentlyViewedParcels);

// Helper types
export interface ParsedLegalDescription {
  township: string;
  range: string;
  section: string;
  description: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Map view state for saving/loading views
export interface MapViewState {
  center: [number, number]; // [latitude, longitude]
  zoom: number;
  bearing?: number;
  pitch?: number;
  layers?: {
    id: string;
    visible: boolean;
    opacity?: number;
  }[];
}

// Search history
export const searchHistory = pgTable('search_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  query: text('query').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // Type of search: 'parcel', 'address', 'document', etc.
  resultCount: integer('result_count').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;
export const insertSearchHistorySchema = createInsertSchema(searchHistory);

// Search suggestions for autocomplete
export const searchSuggestions = pgTable('search_suggestions', {
  id: serial('id').primaryKey(),
  term: varchar('term', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'parcel', 'address', 'document', etc.
  priority: integer('priority').default(0), // Higher priority items appear first
  metadata: json('metadata'), // Additional info like category, description, etc.
  createdAt: timestamp('created_at').defaultNow()
});

export type SearchSuggestion = typeof searchSuggestions.$inferSelect;
export type InsertSearchSuggestion = typeof searchSuggestions.$inferInsert;
export const insertSearchSuggestionSchema = createInsertSchema(searchSuggestions);

// Map Layers
export const mapLayers = pgTable('map_layers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  source: varchar('source', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'vector', 'raster', etc.
  url: text('url'),
  visible: boolean('visible').default(true),
  opacity: integer('opacity').default(100),
  zindex: integer('zindex').default(0),
  order: integer('order').default(0),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type MapLayer = typeof mapLayers.$inferSelect;
export type InsertMapLayer = typeof mapLayers.$inferInsert;
export const insertMapLayerSchema = createInsertSchema(mapLayers);

// ArcGIS Map Configuration
export const arcgisMapConfigs = pgTable('arcgis_map_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  portalUrl: varchar('portal_url', { length: 255 }).default('https://www.arcgis.com'),
  basemapId: varchar('basemap_id', { length: 100 }).default('streets'),
  viewConfig: json('view_config').$type<{
    center: [number, number],
    zoom: number,
    rotation?: number,
    constraints?: Record<string, any>
  }>(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type ArcGISMapConfig = typeof arcgisMapConfigs.$inferSelect;
export type InsertArcGISMapConfig = typeof arcgisMapConfigs.$inferInsert;
export const insertArcGISMapConfigSchema = createInsertSchema(arcgisMapConfigs);

// ArcGIS Layers
export const arcgisLayers = pgTable('arcgis_layers', {
  id: serial('id').primaryKey(),
  configId: integer('config_id').references(() => arcgisMapConfigs.id).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  url: varchar('url', { length: 255 }).notNull(),
  layerType: varchar('layer_type', { length: 50 }).notNull(), // FeatureLayer, MapImageLayer, etc.
  itemId: varchar('item_id', { length: 100 }), // ArcGIS item ID if applicable
  portalItem: boolean('portal_item').default(false), // Whether this is from a portal item
  visible: boolean('visible').default(true),
  opacity: doublePrecision('opacity').default(1.0), // 0 to 1
  definitionExpression: text('definition_expression'), // SQL-like filter
  layerOptions: json('layer_options').$type<Record<string, any>>(), // Additional options
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type ArcGISLayer = typeof arcgisLayers.$inferSelect;
export type InsertArcGISLayer = typeof arcgisLayers.$inferInsert;
export const insertArcGISLayerSchema = createInsertSchema(arcgisLayers);

// ArcGIS Sketches/Graphics
export const arcgisSketches = pgTable('arcgis_sketches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  configId: integer('config_id').references(() => arcgisMapConfigs.id).notNull(),
  title: varchar('title', { length: 100 }),
  sketchType: varchar('sketch_type', { length: 50 }).notNull(), // point, polyline, polygon, etc.
  geometry: json('geometry').notNull(), // GeoJSON or ArcGIS JSON format
  symbolProperties: json('symbol_properties').$type<{
    type: string,
    color?: number[],
    outline?: Record<string, any>,
    size?: number
  }>(),
  attributes: json('attributes').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type ArcGISSketch = typeof arcgisSketches.$inferSelect;
export type InsertArcGISSketch = typeof arcgisSketches.$inferInsert;
export const insertArcGISSketchSchema = createInsertSchema(arcgisSketches);

// ArcGIS Analysis Results
export const arcgisAnalysisResults = pgTable('arcgis_analysis_results', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  configId: integer('config_id').references(() => arcgisMapConfigs.id).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(), // buffer, clip, overlay, etc.
  parameters: json('parameters').$type<Record<string, any>>().notNull(),
  resultGeometry: json('result_geometry'), // Result geometry in GeoJSON or ArcGIS JSON
  resultAttributes: json('result_attributes').$type<Record<string, any>[]>(),
  status: varchar('status', { length: 20 }).default('completed'),
  createdAt: timestamp('created_at').defaultNow()
});

export type ArcGISAnalysisResult = typeof arcgisAnalysisResults.$inferSelect;
export type InsertArcGISAnalysisResult = typeof arcgisAnalysisResults.$inferInsert;
export const insertArcGISAnalysisResultSchema = createInsertSchema(arcgisAnalysisResults);

// Workflows
export const workflows = pgTable('workflows', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // workflow type: 'parcel_split', 'long_plat', etc.
  status: varchar('status', { length: 50 }).default('draft').notNull(), // 'draft', 'in_progress', 'completed', etc.
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // 'low', 'normal', 'high', 'urgent'
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;
export const insertWorkflowSchema = createInsertSchema(workflows);

// Workflow Events
export const workflowEvents = pgTable('workflow_events', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflows.id).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'created', 'updated', 'status_changed', 'comment', etc.
  description: text('description').notNull(),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
});

export type WorkflowEvent = typeof workflowEvents.$inferSelect;
export type InsertWorkflowEvent = typeof workflowEvents.$inferInsert;
export const insertWorkflowEventSchema = createInsertSchema(workflowEvents);

// Workflow State
export const workflowStates = pgTable('workflow_states', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflows.id).notNull().unique(),
  currentStep: integer('current_step').default(1).notNull(),
  formData: json('form_data').$type<Record<string, any>>().default({}),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type WorkflowState = typeof workflowStates.$inferSelect;
export type InsertWorkflowState = typeof workflowStates.$inferInsert;
export const insertWorkflowStateSchema = createInsertSchema(workflowStates);

// Checklist Items
export const checklistItems = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflows.id).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;
export const insertChecklistItemSchema = createInsertSchema(checklistItems);

// Document Versions
export const documentVersions = pgTable('document_versions', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id).notNull(),
  versionNumber: integer('version_number').notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  storageKey: varchar('storage_key', { length: 255 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;
export const insertDocumentVersionSchema = createInsertSchema(documentVersions);

// Document-Parcel Links
export const documentParcelLinks = pgTable('document_parcel_links', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id).notNull(),
  parcelId: integer('parcel_id').references(() => parcels.id).notNull(),
  linkType: varchar('link_type', { length: 50 }).default('reference').notNull(), // 'reference', 'primary', etc.
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => {
  return {
    docParcelIdx: uniqueIndex('doc_parcel_idx').on(table.documentId, table.parcelId)
  }
});

export type DocumentParcelLink = typeof documentParcelLinks.$inferSelect;
export type InsertDocumentParcelLink = typeof documentParcelLinks.$inferInsert;
export const insertDocumentParcelLinkSchema = createInsertSchema(documentParcelLinks);

// Report types
export interface SM00Report {
  id: number;
  reportDate: Date;
  startDate: string;
  endDate: string;
  generatedBy: number | null; // userId
  summary: {
    totalParcels: number;
    newParcels: number;
    updatedParcels: number;
    deletedParcels: number;
  };
  details: any; // Detailed report data
  createdAt: Date;
}

// Document Lineage Types
export type DocumentType = typeof DOCUMENT_TYPES[number];
export type EventType = typeof EVENT_TYPES[number];
export type RelationshipType = typeof RELATIONSHIP_TYPES[number];
export type ProcessingStageType = typeof PROCESSING_STAGE_TYPES[number];

// Document Entities table for lineage tracking
export const documentEntities = pgTable('document_entities', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  documentName: varchar('document_name', { length: 255 }).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  description: text('description'),
  fileSize: integer('file_size'),
  fileHash: varchar('file_hash', { length: 128 }),
  parcelId: varchar('parcel_id', { length: 50 }),
  uploadedBy: varchar('uploaded_by', { length: 100 })
});

export type DocumentEntity = typeof documentEntities.$inferSelect;
export type InsertDocumentEntity = Omit<DocumentEntity, 'id' | 'createdAt' | 'status'>;
export const insertDocumentEntitySchema = createInsertSchema(documentEntities).omit({
  id: true,
  createdAt: true,
  status: true
});

// Document Lineage Events table
export const documentLineageEvents = pgTable('document_lineage_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  eventTimestamp: timestamp('event_timestamp').defaultNow().notNull(),
  documentId: varchar('document_id', { length: 36 }).notNull()
    .references(() => documentEntities.id),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  performedBy: varchar('performed_by', { length: 100 }),
  details: json('details').$type<Record<string, any>>(),
  confidence: doublePrecision('confidence')
});

export type DocumentLineageEvent = typeof documentLineageEvents.$inferSelect;
export type InsertDocumentLineageEvent = Omit<DocumentLineageEvent, 'id' | 'eventTimestamp'>;
export const insertDocumentLineageEventSchema = createInsertSchema(documentLineageEvents).omit({
  id: true,
  eventTimestamp: true
});

// Document Relationships table
export const documentRelationships = pgTable('document_relationships', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  sourceDocumentId: varchar('source_document_id', { length: 36 }).notNull()
    .references(() => documentEntities.id),
  targetDocumentId: varchar('target_document_id', { length: 36 }).notNull()
    .references(() => documentEntities.id),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
  description: text('description'),
  metadata: json('metadata').$type<Record<string, any>>()
});

export type DocumentRelationship = typeof documentRelationships.$inferSelect;
export type InsertDocumentRelationship = Omit<DocumentRelationship, 'id' | 'createdAt'>;
export const insertDocumentRelationshipSchema = createInsertSchema(documentRelationships).omit({
  id: true,
  createdAt: true
});

// Document Processing Stages table
export const documentProcessingStages = pgTable('document_processing_stages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  documentId: varchar('document_id', { length: 36 }).notNull()
    .references(() => documentEntities.id),
  stageName: varchar('stage_name', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  processorName: varchar('processor_name', { length: 100 }),
  processorVersion: varchar('processor_version', { length: 50 }),
  progress: doublePrecision('progress').notNull().default(0),
  result: json('result').$type<Record<string, any>>()
});

export type DocumentProcessingStage = typeof documentProcessingStages.$inferSelect;
export type InsertDocumentProcessingStage = Omit<DocumentProcessingStage, 'id' | 'status' | 'startedAt' | 'progress'>;
export const insertDocumentProcessingStageSchema = createInsertSchema(documentProcessingStages).omit({
  id: true,
  status: true,
  startedAt: true,
  progress: true
});

// Document Lineage Node Interface
export interface DocumentLineageNode {
  id: string;
  type: string;
  label: string;
  data: {
    entityId?: string;
    [key: string]: any;
    position?: {
      x: number;
      y: number;
    };
  };
}

// Document Lineage Edge Interface
export interface DocumentLineageEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  data?: {
    [key: string]: any;
  };
}

// Document Lineage Graph Interface
export interface DocumentLineageGraph {
  nodes: DocumentLineageNode[];
  edges: DocumentLineageEdge[];
  metadata?: {
    generatedAt: Date;
    depth?: number;
    rootDocumentId?: string;
    [key: string]: any;
  };
}

// Node Data Interfaces
export interface DocumentNodeData {
  id: string;
  documentName: string;
  documentType: string;
  createdAt: Date;
  uploadedBy?: string;
  parcelId?: string;
  status: string;
  description?: string;
  fileSize?: number;
  fileHash?: string;
}

export interface EventNodeData {
  id: string;
  eventType: string;
  eventTimestamp: Date;
  performedBy?: string;
  documentId: string;
  details?: Record<string, any>;
  confidence?: number;
}

export interface ProcessingNodeData {
  id: string;
  stageName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  processorName?: string;
  processorVersion?: string;
  progress: number;
  documentId: string;
  result?: Record<string, any>;
}