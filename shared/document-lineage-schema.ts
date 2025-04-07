import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

/**
 * Document entity types
 */
export type DocumentStatus = 'active' | 'archived' | 'deleted';

/**
 * Document entity schema
 */
export const documentEntitySchema = z.object({
  id: z.string(),
  documentType: z.string(),
  documentName: z.string(),
  description: z.string().optional(),
  fileSize: z.number().optional(),
  fileHash: z.string().optional(),
  parcelId: z.string().optional(),
  uploadedBy: z.string().optional(),
  createdAt: z.date(),
  status: z.enum(['active', 'archived', 'deleted'])
});

export type DocumentEntity = z.infer<typeof documentEntitySchema>;
export const insertDocumentEntitySchema = documentEntitySchema.omit({ id: true, createdAt: true, status: true });
export type InsertDocumentEntity = z.infer<typeof insertDocumentEntitySchema>;

/**
 * Document lineage event schema
 */
export const documentLineageEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  documentId: z.string(),
  eventTimestamp: z.date(),
  performedBy: z.string(),
  details: z.record(z.any()).optional(),
  confidence: z.number().optional()
});

export type DocumentLineageEvent = z.infer<typeof documentLineageEventSchema>;
export const insertDocumentLineageEventSchema = documentLineageEventSchema.omit({ id: true, eventTimestamp: true });
export type InsertDocumentLineageEvent = z.infer<typeof insertDocumentLineageEventSchema>;

/**
 * Document relationship schema
 */
export const documentRelationshipSchema = z.object({
  id: z.string(),
  sourceDocumentId: z.string(),
  targetDocumentId: z.string(),
  relationshipType: z.string(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date()
});

export type DocumentRelationship = z.infer<typeof documentRelationshipSchema>;
export const insertDocumentRelationshipSchema = documentRelationshipSchema.omit({ id: true, createdAt: true });
export type InsertDocumentRelationship = z.infer<typeof insertDocumentRelationshipSchema>;

/**
 * Document processing stage schema
 */
export const documentProcessingStageSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  stageName: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  processorName: z.string().optional(),
  processorVersion: z.string().optional(),
  result: z.record(z.any()).optional()
});

export type DocumentProcessingStage = z.infer<typeof documentProcessingStageSchema>;
export const insertDocumentProcessingStageSchema = documentProcessingStageSchema.omit({ 
  id: true, 
  status: true, 
  progress: true, 
  startedAt: true, 
  completedAt: true 
});
export type InsertDocumentProcessingStage = z.infer<typeof insertDocumentProcessingStageSchema>;

/**
 * Document lineage graph types
 */
export type DocumentLineageNodeType = 'document' | 'event' | 'processing';

export type DocumentNodeData = {
  entityId: string;
  documentName: string;
  documentType: string;
  createdAt: Date;
  uploadedBy?: string;
  parcelId?: string;
  status: DocumentStatus;
  description?: string;
  fileSize?: number;
  fileHash?: string;
};

export type EventNodeData = {
  entityId: string;
  eventType: string;
  eventTimestamp: Date;
  performedBy: string;
  documentId: string;
  details?: Record<string, any>;
  confidence?: number;
};

export type ProcessingNodeData = {
  entityId: string;
  stageName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  processorName?: string;
  processorVersion?: string;
  progress: number;
  documentId: string;
  result?: Record<string, any>;
};

export type DocumentLineageNode = {
  id: string;
  type: DocumentLineageNodeType;
  label: string;
  data: DocumentNodeData | EventNodeData | ProcessingNodeData;
};

export type DocumentLineageEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  data?: Record<string, any>;
};

export type DocumentLineageGraph = {
  nodes: DocumentLineageNode[];
  edges: DocumentLineageEdge[];
  metadata: {
    generatedAt: Date;
    rootDocumentId?: string;
    depth?: number;
    documentCount?: number;
  };
};