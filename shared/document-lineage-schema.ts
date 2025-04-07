import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Document Lineage Schema
 * 
 * Tracks the provenance and lineage of documents within the system
 */

// Document entity table
export const documentEntity = sqliteTable(
  "document_entity",
  {
    id: text("id").primaryKey().notNull(),
    documentName: text("document_name").notNull(),
    documentType: text("document_type").notNull(), // deed, survey, plat, etc.
    fileHash: text("file_hash"), // for document integrity verification
    fileFormat: text("file_format"), // pdf, docx, jpg, etc.
    uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    status: text("status").notNull().default("active"), // active, archived, deleted
    parcelId: text("parcel_id"), // optional reference to a parcel
    metadata: text("metadata", { mode: "json" }),
  },
  (table) => {
    return {
      fileHashIdx: uniqueIndex("file_hash_idx").on(table.fileHash),
    };
  }
);

// Document lineage event table
export const documentLineageEvent = sqliteTable(
  "document_lineage_event",
  {
    id: text("id").primaryKey().notNull(),
    documentId: text("document_id")
      .notNull()
      .references(() => documentEntity.id),
    eventType: text("event_type").notNull(), // created, viewed, processed, classified, linked, etc.
    eventTimestamp: integer("event_timestamp", { mode: "timestamp" }).notNull(),
    performedBy: text("performed_by").notNull(), // user or system component
    details: text("details", { mode: "json" }),
    previousVersionId: text("previous_version_id").references(() => documentEntity.id), // for version tracking
    relatedEntityId: text("related_entity_id"), // for tracking relationships to other entities
    relatedEntityType: text("related_entity_type"), // type of related entity (parcel, user, workflow, etc.)
    confidence: integer("confidence"), // for ML-based processing events
  }
);

// Document relationship table
export const documentRelationship = sqliteTable(
  "document_relationship",
  {
    id: text("id").primaryKey().notNull(),
    sourceDocumentId: text("source_document_id")
      .notNull()
      .references(() => documentEntity.id),
    targetDocumentId: text("target_document_id")
      .notNull()
      .references(() => documentEntity.id),
    relationshipType: text("relationship_type").notNull(), // derives-from, supplements, replaces, references, etc.
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    createdBy: text("created_by").notNull(),
    confidence: integer("confidence"), // for automatically detected relationships
    metadata: text("metadata", { mode: "json" }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  }
);

// Document processing stage table
export const documentProcessingStage = sqliteTable(
  "document_processing_stage",
  {
    id: text("id").primaryKey().notNull(),
    documentId: text("document_id")
      .notNull()
      .references(() => documentEntity.id),
    stageName: text("stage_name").notNull(), // intake, classification, validation, integration, etc.
    stageOrder: integer("stage_order").notNull(),
    startTime: integer("start_time", { mode: "timestamp" }),
    completionTime: integer("completion_time", { mode: "timestamp" }),
    status: text("status").notNull(), // pending, in-progress, completed, failed
    processorId: text("processor_id"), // system component or user that processed this stage
    processorType: text("processor_type"), // human, ml-model, rule-based, etc.
    result: text("result", { mode: "json" }),
    confidence: integer("confidence"),
    nextStageIds: text("next_stage_ids", { mode: "json" }), // array of potential next stages
  }
);

// Insert schemas for validation
export const insertDocumentEntitySchema = createInsertSchema(documentEntity).omit({
  id: true,
});
export const insertDocumentLineageEventSchema = createInsertSchema(documentLineageEvent).omit({
  id: true,
});
export const insertDocumentRelationshipSchema = createInsertSchema(documentRelationship).omit({
  id: true,
});
export const insertDocumentProcessingStageSchema = createInsertSchema(documentProcessingStage).omit({
  id: true,
});

// TypeScript types
export type InsertDocumentEntity = z.infer<typeof insertDocumentEntitySchema>;
export type InsertDocumentLineageEvent = z.infer<typeof insertDocumentLineageEventSchema>;
export type InsertDocumentRelationship = z.infer<typeof insertDocumentRelationshipSchema>;
export type InsertDocumentProcessingStage = z.infer<typeof insertDocumentProcessingStageSchema>;

export type DocumentEntity = typeof documentEntity.$inferSelect;
export type DocumentLineageEvent = typeof documentLineageEvent.$inferSelect;
export type DocumentRelationship = typeof documentRelationship.$inferSelect;
export type DocumentProcessingStage = typeof documentProcessingStage.$inferSelect;

// Custom types for UI
export interface DocumentLineageNode {
  id: string;
  type: "document" | "event" | "stage" | "processor";
  label: string;
  data: DocumentEntity | DocumentLineageEvent | DocumentProcessingStage | any;
}

export interface DocumentLineageEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: any;
}

export interface DocumentLineageGraph {
  nodes: DocumentLineageNode[];
  edges: DocumentLineageEdge[];
}