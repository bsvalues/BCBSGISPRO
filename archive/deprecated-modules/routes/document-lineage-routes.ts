import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { ApiError, asyncHandler } from '../error-handler';
import { z } from 'zod';
import { insertDocumentEntitySchema, insertDocumentLineageEventSchema, insertDocumentRelationshipSchema, insertDocumentProcessingStageSchema } from '../../shared/document-lineage-schema';

const router = Router();

/**
 * Get all documents
 * GET /api/document-lineage/documents
 */
router.get('/documents', asyncHandler(async (req: Request, res: Response) => {
  const documents = await storage.listDocuments();
  res.json(documents);
}));

/**
 * Get document by ID
 * GET /api/document-lineage/documents/:id
 */
router.get('/documents/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const document = await storage.getDocumentById(id);
  
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  
  res.json(document);
}));

/**
 * Create a document
 * POST /api/document-lineage/documents
 */
router.post('/documents', asyncHandler(async (req: Request, res: Response) => {
  const parsed = insertDocumentEntitySchema.safeParse(req.body);
  
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid document data', parsed.error.format());
  }
  
  const document = await storage.createDocument(parsed.data);
  res.status(201).json(document);
}));

/**
 * Update a document
 * PATCH /api/document-lineage/documents/:id
 */
router.patch('/documents/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const document = await storage.getDocumentById(id);
  
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  
  const parsed = z.object({
    documentName: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'archived', 'deleted']).optional(),
    parcelId: z.string().optional(),
  }).safeParse(req.body);
  
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid document data', parsed.error.format());
  }
  
  const updatedDocument = await storage.updateDocument(id, parsed.data);
  res.json(updatedDocument);
}));

/**
 * Get events for a document
 * GET /api/document-lineage/events/:documentId
 */
router.get('/events/:documentId', asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const events = await storage.getDocumentEvents(documentId);
  res.json(events);
}));

/**
 * Create an event for a document
 * POST /api/document-lineage/events
 */
router.post('/events', asyncHandler(async (req: Request, res: Response) => {
  const parsed = insertDocumentLineageEventSchema.safeParse(req.body);
  
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid event data', parsed.error.format());
  }
  
  // Verify the document exists
  const document = await storage.getDocumentById(parsed.data.documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  
  const event = await storage.createDocumentEvent(parsed.data);
  res.status(201).json(event);
}));

/**
 * Get relationships for a document
 * GET /api/document-lineage/relationships/:documentId
 */
router.get('/relationships/:documentId', asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const relationships = await storage.getDocumentRelationships(documentId);
  res.json(relationships);
}));

/**
 * Create a relationship between documents
 * POST /api/document-lineage/relationships
 */
router.post('/relationships', asyncHandler(async (req: Request, res: Response) => {
  const parsed = insertDocumentRelationshipSchema.safeParse(req.body);
  
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid relationship data', parsed.error.format());
  }
  
  // Verify both documents exist
  const sourceDocument = await storage.getDocumentById(parsed.data.sourceDocumentId);
  if (!sourceDocument) {
    throw new ApiError(404, 'Source document not found');
  }
  
  const targetDocument = await storage.getDocumentById(parsed.data.targetDocumentId);
  if (!targetDocument) {
    throw new ApiError(404, 'Target document not found');
  }
  
  const relationship = await storage.createDocumentRelationship(parsed.data);
  res.status(201).json(relationship);
}));

/**
 * Get processing stages for a document
 * GET /api/document-lineage/stages/:documentId
 */
router.get('/stages/:documentId', asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const stages = await storage.getDocumentProcessingStages(documentId);
  res.json(stages);
}));

/**
 * Create a processing stage for a document
 * POST /api/document-lineage/stages
 */
router.post('/stages', asyncHandler(async (req: Request, res: Response) => {
  const parsed = insertDocumentProcessingStageSchema.safeParse(req.body);
  
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid processing stage data', parsed.error.format());
  }
  
  // Verify the document exists
  const document = await storage.getDocumentById(parsed.data.documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  
  const stage = await storage.createProcessingStage(parsed.data);
  res.status(201).json(stage);
}));

/**
 * Update a processing stage
 * PATCH /api/document-lineage/stages/:id
 */
router.patch('/stages/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const stage = await storage.getProcessingStageById(id);
  
  if (!stage) {
    throw new ApiError(404, 'Processing stage not found');
  }
  
  const parsed = z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
    progress: z.number().min(0).max(100).optional(),
    completedAt: z.date().optional(),
    result: z.record(z.any()).optional(),
  }).safeParse(req.body);
  
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid processing stage data', parsed.error.format());
  }
  
  const updatedStage = await storage.updateProcessingStage(id, parsed.data);
  res.json(updatedStage);
}));

/**
 * Get document lineage graph for a document
 * GET /api/document-lineage/graph/:documentId
 */
router.get('/graph/:documentId', asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const depthStr = req.query.depth as string;
  const depth = depthStr ? parseInt(depthStr, 10) : 1;
  
  const document = await storage.getDocumentById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  
  const graph = await storage.getDocumentLineageGraph(documentId, depth);
  res.json(graph);
}));

/**
 * Get document provenance (documents this one was derived from)
 * GET /api/document-lineage/provenance/:documentId
 */
router.get('/provenance/:documentId', asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const document = await storage.getDocumentById(documentId);
  
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  
  const provenance = await storage.getDocumentProvenance(documentId);
  res.json(provenance);
}));

/**
 * Get complete graph for multiple documents
 * POST /api/document-lineage/complete-graph
 */
router.post('/complete-graph', asyncHandler(async (req: Request, res: Response) => {
  const parsed = z.object({
    documentIds: z.array(z.string()),
    depth: z.number().optional(),
  }).safeParse(req.body);
  
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid request data', parsed.error.format());
  }
  
  // Verify all documents exist
  for (const documentId of parsed.data.documentIds) {
    const document = await storage.getDocumentById(documentId);
    if (!document) {
      throw new ApiError(404, `Document not found: ${documentId}`);
    }
  }
  
  const graph = await storage.getCompleteLineageGraph(
    parsed.data.documentIds, 
    parsed.data.depth
  );
  
  res.json(graph);
}));

/**
 * Get document lineage metadata (available types, codes, etc.)
 * GET /api/document-lineage/metadata
 */
router.get('/metadata', asyncHandler(async (req: Request, res: Response) => {
  const metadata = {
    documentTypes: [
      { code: 'deed', label: 'Deed' },
      { code: 'survey', label: 'Survey' },
      { code: 'plat', label: 'Plat' },
      { code: 'legal_description', label: 'Legal Description' },
      { code: 'tax_record', label: 'Tax Record' },
      { code: 'permit', label: 'Permit' },
      { code: 'image', label: 'Image' },
      { code: 'other', label: 'Other' }
    ],
    eventTypes: [
      { code: 'created', label: 'Created' },
      { code: 'uploaded', label: 'Uploaded' },
      { code: 'reviewed', label: 'Reviewed' },
      { code: 'classified', label: 'Classified' },
      { code: 'approved', label: 'Approved' },
      { code: 'rejected', label: 'Rejected' },
      { code: 'processed', label: 'Processed' },
      { code: 'archived', label: 'Archived' }
    ],
    relationshipTypes: [
      { code: 'derived_from', label: 'Derived From' },
      { code: 'supersedes', label: 'Supersedes' },
      { code: 'related_to', label: 'Related To' },
      { code: 'contains', label: 'Contains' },
      { code: 'references', label: 'References' },
      { code: 'amends', label: 'Amends' }
    ],
    processingStageTypes: [
      { code: 'ocr', label: 'Optical Character Recognition' },
      { code: 'classification', label: 'Document Classification' },
      { code: 'extraction', label: 'Data Extraction' },
      { code: 'validation', label: 'Data Validation' },
      { code: 'georeferencing', label: 'Georeferencing' },
      { code: 'vectorization', label: 'Vectorization' }
    ],
    statusTypes: [
      { code: 'active', label: 'Active', color: 'green' },
      { code: 'archived', label: 'Archived', color: 'amber' },
      { code: 'deleted', label: 'Deleted', color: 'red' }
    ],
    processingStatusTypes: [
      { code: 'pending', label: 'Pending', color: 'blue' },
      { code: 'in_progress', label: 'In Progress', color: 'amber' },
      { code: 'completed', label: 'Completed', color: 'green' },
      { code: 'failed', label: 'Failed', color: 'red' }
    ]
  };
  
  res.json(metadata);
}));

export default router;