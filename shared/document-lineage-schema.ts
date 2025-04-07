import { z } from 'zod';

/**
 * Document Entity Schema
 * 
 * Represents a document in the system that requires lineage tracking
 */
export const documentEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  status: z.enum(['active', 'archived', 'deleted']),
  documentName: z.string(),
  documentType: z.string(),
  fileSize: z.number().optional(),
  fileHash: z.string().optional(),
  uploadedBy: z.string().optional(),
  parcelId: z.string().optional(),
  description: z.string().optional()
});

export type DocumentEntity = z.infer<typeof documentEntitySchema>;
export type InsertDocumentEntity = Omit<DocumentEntity, 'id' | 'createdAt' | 'status'>;

/**
 * Document Lineage Event Schema
 * 
 * Represents an event in the document's history
 */
export const documentLineageEventSchema = z.object({
  id: z.string(),
  eventTimestamp: z.date(),
  documentId: z.string(),
  eventType: z.string(),
  performedBy: z.string(),
  details: z.record(z.any()).optional(),
  confidence: z.number().optional()
});

export type DocumentLineageEvent = z.infer<typeof documentLineageEventSchema>;
export type InsertDocumentLineageEvent = Omit<DocumentLineageEvent, 'id' | 'eventTimestamp'>;

/**
 * Document Relationship Schema
 * 
 * Represents a relationship between two documents
 */
export const documentRelationshipSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  sourceDocumentId: z.string(),
  targetDocumentId: z.string(),
  relationshipType: z.string(),
  description: z.string().optional()
});

export type DocumentRelationship = z.infer<typeof documentRelationshipSchema>;
export type InsertDocumentRelationship = Omit<DocumentRelationship, 'id' | 'createdAt'>;

/**
 * Document Processing Stage Schema
 * 
 * Represents a processing stage for a document
 */
export const documentProcessingStageSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  stageName: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  processorName: z.string().optional(),
  processorVersion: z.string().optional(),
  progress: z.number(),
  result: z.record(z.any()).optional()
});

export type DocumentProcessingStage = z.infer<typeof documentProcessingStageSchema>;
export type InsertDocumentProcessingStage = Omit<DocumentProcessingStage, 'id' | 'status' | 'startedAt' | 'progress'>;

/**
 * Document Lineage Node Schema
 * 
 * Represents a node in the document lineage graph
 */
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

/**
 * Document Lineage Edge Schema
 * 
 * Represents an edge in the document lineage graph
 */
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

/**
 * Document Lineage Graph Schema
 * 
 * Represents the entire document lineage graph
 */
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

/**
 * Document Type definitions
 */
export const DOCUMENT_TYPES = [
  'DEED',
  'SURVEY',
  'TAX_RECORD',
  'TITLE',
  'MORTGAGE',
  'PLAT',
  'LEGAL_DESCRIPTION',
  'ASSESSMENT',
  'EXEMPTION',
  'APPEAL',
  'PERMIT',
  'OTHER'
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

/**
 * Event Type definitions
 */
export const EVENT_TYPES = [
  'UPLOAD',
  'CLASSIFICATION',
  'EXTRACTION',
  'VALIDATION',
  'MODIFICATION',
  'REVIEW',
  'APPROVAL',
  'REJECTION',
  'LINK',
  'ARCHIVE',
  'DELETE',
  'OTHER'
] as const;

export type EventType = typeof EVENT_TYPES[number];

/**
 * Relationship Type definitions
 */
export const RELATIONSHIP_TYPES = [
  'DERIVED_FROM',
  'SUPERSEDES',
  'REFERENCES',
  'RELATED_TO',
  'PART_OF',
  'PREVIOUS_VERSION',
  'NEXT_VERSION',
  'DEPENDS_ON',
  'SUPPORTS',
  'CONTRADICTS',
  'OTHER'
] as const;

export type RelationshipType = typeof RELATIONSHIP_TYPES[number];

/**
 * Processing Stage Type definitions
 */
export const PROCESSING_STAGE_TYPES = [
  'CLASSIFICATION',
  'ENTITY_EXTRACTION',
  'LEGAL_DESCRIPTION_EXTRACTION',
  'PARCEL_MATCHING',
  'QUALITY_CHECK',
  'OCR',
  'METADATA_EXTRACTION',
  'VALIDATION',
  'REVIEW',
  'OTHER'
] as const;

export type ProcessingStageType = typeof PROCESSING_STAGE_TYPES[number];

/**
 * Document Node Data interface
 */
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

/**
 * Event Node Data interface
 */
export interface EventNodeData {
  id: string;
  eventType: string;
  eventTimestamp: Date;
  performedBy?: string;
  documentId: string;
  details?: Record<string, any>;
  confidence?: number;
}

/**
 * Processing Node Data interface
 */
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