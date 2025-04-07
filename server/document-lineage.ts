import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError, asyncHandler } from './error-handler';
import { 
  documentEntitySchema, 
  documentLineageEventSchema, 
  documentRelationshipSchema, 
  documentProcessingStageSchema,
  DocumentEntity,
  DocumentLineageEvent,
  DocumentRelationship,
  DocumentProcessingStage,
  DocumentLineageGraph,
  DOCUMENT_TYPES,
  EVENT_TYPES,
  RELATIONSHIP_TYPES,
  PROCESSING_STAGE_TYPES
} from '../shared/document-lineage-schema';
import { IDocumentLineageStorage, documentLineageStorage } from './document-lineage-storage';

/**
 * Register document lineage routes
 * @param app Express application
 */
export function registerDocumentLineageRoutes(app: Express): void {
  /**
   * Get all documents
   */
  app.get('/api/document-lineage/documents', asyncHandler(async (req: Request, res: Response) => {
    const documents = await documentLineageStorage.listDocuments();
    return res.json(documents);
  }));
  
  /**
   * Get document by ID
   */
  app.get('/api/document-lineage/documents/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const document = await documentLineageStorage.getDocumentById(id);
    
    if (!document) {
      throw ApiError.notFound(`Document with ID ${id} not found`);
    }
    
    return res.json(document);
  }));
  
  /**
   * Create a document
   */
  app.post('/api/document-lineage/documents', asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = documentEntitySchema.omit({ 
      id: true, 
      createdAt: true,
      status: true
    }).safeParse(req.body);
    
    if (!validationResult.success) {
      throw ApiError.badRequest(
        'Invalid document data',
        'VALIDATION_ERROR',
        validationResult.error.format()
      );
    }
    
    const document = await documentLineageStorage.createDocument(validationResult.data);
    
    // Create an upload event for this document
    await documentLineageStorage.createLineageEvent({
      documentId: document.id,
      eventType: 'UPLOAD',
      performedBy: req.body.uploadedBy || 'system',
      details: {
        method: 'API',
        fileSize: document.fileSize,
        fileHash: document.fileHash
      }
    });
    
    return res.status(201).json(document);
  }));
  
  /**
   * Update a document
   */
  app.patch('/api/document-lineage/documents/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Validate request body
    const validationResult = documentEntitySchema.omit({
      id: true,
      createdAt: true
    }).partial().safeParse(req.body);
    
    if (!validationResult.success) {
      throw ApiError.badRequest(
        'Invalid document data',
        'VALIDATION_ERROR',
        validationResult.error.format()
      );
    }
    
    const updatedDocument = await documentLineageStorage.updateDocument(id, validationResult.data);
    
    if (!updatedDocument) {
      throw ApiError.notFound(`Document with ID ${id} not found`);
    }
    
    return res.json(updatedDocument);
  }));
  
  /**
   * Get document lineage events
   */
  app.get('/api/document-lineage/events/:documentId', asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    
    const events = await documentLineageStorage.getLineageEventsForDocument(documentId);
    
    return res.json(events);
  }));
  
  /**
   * Create document lineage event
   */
  app.post('/api/document-lineage/events', asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = documentLineageEventSchema.omit({
      id: true,
      eventTimestamp: true
    }).safeParse(req.body);
    
    if (!validationResult.success) {
      throw ApiError.badRequest(
        'Invalid event data',
        'VALIDATION_ERROR',
        validationResult.error.format()
      );
    }
    
    // Check if document exists
    const document = await documentLineageStorage.getDocumentById(req.body.documentId);
    
    if (!document) {
      throw ApiError.notFound(`Document with ID ${req.body.documentId} not found`);
    }
    
    const event = await documentLineageStorage.createLineageEvent(validationResult.data);
    
    return res.status(201).json(event);
  }));
  
  /**
   * Get document relationships
   */
  app.get('/api/document-lineage/relationships/:documentId', asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const { type } = req.query;
    
    const relationshipType = type as string | undefined;
    
    const relationships = await documentLineageStorage.getRelationshipsForDocument(
      documentId,
      relationshipType
    );
    
    return res.json(relationships);
  }));
  
  /**
   * Create document relationship
   */
  app.post('/api/document-lineage/relationships', asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = documentRelationshipSchema.omit({
      id: true,
      createdAt: true
    }).safeParse(req.body);
    
    if (!validationResult.success) {
      throw ApiError.badRequest(
        'Invalid relationship data',
        'VALIDATION_ERROR',
        validationResult.error.format()
      );
    }
    
    // Check if documents exist
    const sourceDocument = await documentLineageStorage.getDocumentById(req.body.sourceDocumentId);
    const targetDocument = await documentLineageStorage.getDocumentById(req.body.targetDocumentId);
    
    if (!sourceDocument) {
      throw ApiError.notFound(`Source document with ID ${req.body.sourceDocumentId} not found`);
    }
    
    if (!targetDocument) {
      throw ApiError.notFound(`Target document with ID ${req.body.targetDocumentId} not found`);
    }
    
    const relationship = await documentLineageStorage.createRelationship(validationResult.data);
    
    return res.status(201).json(relationship);
  }));
  
  /**
   * Get document processing stages
   */
  app.get('/api/document-lineage/stages/:documentId', asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    
    const stages = await documentLineageStorage.getProcessingStagesForDocument(documentId);
    
    return res.json(stages);
  }));
  
  /**
   * Create document processing stage
   */
  app.post('/api/document-lineage/stages', asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = documentProcessingStageSchema.omit({
      id: true,
      status: true,
      startedAt: true,
      progress: true
    }).safeParse(req.body);
    
    if (!validationResult.success) {
      throw ApiError.badRequest(
        'Invalid processing stage data',
        'VALIDATION_ERROR',
        validationResult.error.format()
      );
    }
    
    // Check if document exists
    const document = await documentLineageStorage.getDocumentById(req.body.documentId);
    
    if (!document) {
      throw ApiError.notFound(`Document with ID ${req.body.documentId} not found`);
    }
    
    const stage = await documentLineageStorage.createProcessingStage(validationResult.data);
    
    return res.status(201).json(stage);
  }));
  
  /**
   * Update document processing stage
   */
  app.patch('/api/document-lineage/stages/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Validate request body
    const validationResult = documentProcessingStageSchema.omit({
      id: true,
      documentId: true,
      stageName: true
    }).partial().safeParse(req.body);
    
    if (!validationResult.success) {
      throw ApiError.badRequest(
        'Invalid processing stage data',
        'VALIDATION_ERROR',
        validationResult.error.format()
      );
    }
    
    const updatedStage = await documentLineageStorage.updateProcessingStage(id, validationResult.data);
    
    if (!updatedStage) {
      throw ApiError.notFound(`Processing stage with ID ${id} not found`);
    }
    
    return res.json(updatedStage);
  }));
  
  /**
   * Get document lineage graph (shows documents derived from this one)
   */
  app.get('/api/document-lineage/:documentId', asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const depthParam = req.query.depth as string | undefined;
    
    // Parse depth parameter
    const depth = depthParam ? parseInt(depthParam, 10) : undefined;
    
    if (depthParam && isNaN(depth!)) {
      throw ApiError.badRequest('Invalid depth parameter, must be a number');
    }
    
    try {
      const graph = await documentLineageStorage.getDocumentLineage(documentId, depth);
      return res.json(graph);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw ApiError.notFound(error.message);
      }
      throw error;
    }
  }));
  
  /**
   * Get document provenance graph (shows where this document came from)
   */
  app.get('/api/document-provenance/:documentId', asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const depthParam = req.query.depth as string | undefined;
    
    // Parse depth parameter
    const depth = depthParam ? parseInt(depthParam, 10) : undefined;
    
    if (depthParam && isNaN(depth!)) {
      throw ApiError.badRequest('Invalid depth parameter, must be a number');
    }
    
    try {
      const graph = await documentLineageStorage.getDocumentProvenance(documentId, depth);
      return res.json(graph);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw ApiError.notFound(error.message);
      }
      throw error;
    }
  }));
  
  /**
   * Get complete graph for multiple documents
   */
  app.post('/api/document-lineage-graph', asyncHandler(async (req: Request, res: Response) => {
    const documentIds = req.body.documentIds;
    
    if (!Array.isArray(documentIds)) {
      throw ApiError.badRequest('documentIds must be an array of document IDs');
    }
    
    const graph = await documentLineageStorage.getCompleteDocumentGraph(documentIds);
    
    return res.json(graph);
  }));
  
  /**
   * Get metadata about document lineage (available types, etc)
   */
  app.get('/api/document-lineage/metadata', asyncHandler(async (req: Request, res: Response) => {
    return res.json({
      documentTypes: DOCUMENT_TYPES,
      eventTypes: EVENT_TYPES,
      relationshipTypes: RELATIONSHIP_TYPES,
      processingStageTypes: PROCESSING_STAGE_TYPES
    });
  }));
}

/**
 * Populates sample data for demonstration purposes
 * This is just for initial testing and would be removed in production
 */
async function populateSampleData(): Promise<void> {
  // Create some sample documents
  const deed = await documentLineageStorage.createDocument({
    documentName: 'Deed for Parcel 12345',
    documentType: 'DEED',
    fileSize: 1024 * 1024,
    fileHash: 'abcdef123456',
    uploadedBy: 'john.doe',
    parcelId: '12345',
    description: 'Original deed for parcel 12345'
  });
  
  const survey = await documentLineageStorage.createDocument({
    documentName: 'Survey Report 2023',
    documentType: 'SURVEY',
    fileSize: 2048 * 1024,
    fileHash: '789012ghijkl',
    uploadedBy: 'jane.smith',
    parcelId: '12345',
    description: 'Official survey from 2023'
  });
  
  const taxRecord = await documentLineageStorage.createDocument({
    documentName: 'Tax Assessment 2023',
    documentType: 'TAX_RECORD',
    fileSize: 512 * 1024,
    fileHash: 'mnopqr456789',
    uploadedBy: 'system',
    parcelId: '12345',
    description: 'Annual tax assessment'
  });
  
  const amendedDeed = await documentLineageStorage.createDocument({
    documentName: 'Amended Deed for Parcel 12345',
    documentType: 'DEED',
    fileSize: 768 * 1024,
    fileHash: 'stuvwx987654',
    uploadedBy: 'john.doe',
    parcelId: '12345',
    description: 'Amended deed after property line adjustment'
  });
  
  const legalDescription = await documentLineageStorage.createDocument({
    documentName: 'Legal Description',
    documentType: 'LEGAL_DESCRIPTION',
    fileSize: 256 * 1024,
    fileHash: 'yzabcd321654',
    uploadedBy: 'system',
    parcelId: '12345',
    description: 'Extracted legal description'
  });
  
  // Create events for the documents
  await documentLineageStorage.createLineageEvent({
    documentId: deed.id,
    eventType: 'UPLOAD',
    performedBy: 'john.doe',
    details: {
      source: 'frontend-upload'
    }
  });
  
  await documentLineageStorage.createLineageEvent({
    documentId: survey.id,
    eventType: 'UPLOAD',
    performedBy: 'jane.smith',
    details: {
      source: 'api-upload'
    }
  });
  
  await documentLineageStorage.createLineageEvent({
    documentId: taxRecord.id,
    eventType: 'CLASSIFICATION',
    performedBy: 'ai-system',
    details: {
      validationStatus: 'confirmed'
    },
    confidence: 0.95
  });
  
  await documentLineageStorage.createLineageEvent({
    documentId: amendedDeed.id,
    eventType: 'UPLOAD',
    performedBy: 'john.doe',
    details: {}
  });
  
  await documentLineageStorage.createLineageEvent({
    documentId: legalDescription.id,
    eventType: 'EXTRACTION',
    performedBy: 'ai-system',
    details: {},
    confidence: 0.87
  });
  
  await documentLineageStorage.createLineageEvent({
    documentId: legalDescription.id,
    eventType: 'VALIDATION',
    performedBy: 'sarah.johnson',
    details: {
      comments: 'Legal description verified against county records'
    }
  });
  
  // Create relationships between documents
  await documentLineageStorage.createRelationship({
    sourceDocumentId: deed.id,
    targetDocumentId: amendedDeed.id,
    relationshipType: 'PREVIOUS_VERSION',
    description: 'Original deed superseded by amended deed'
  });
  
  await documentLineageStorage.createRelationship({
    sourceDocumentId: deed.id,
    targetDocumentId: legalDescription.id,
    relationshipType: 'DERIVED_FROM',
    description: 'Legal description extracted from deed'
  });
  
  await documentLineageStorage.createRelationship({
    sourceDocumentId: survey.id,
    targetDocumentId: amendedDeed.id,
    relationshipType: 'REFERENCES',
    description: 'Amended deed references survey findings'
  });
  
  // Create processing stages
  await documentLineageStorage.createProcessingStage({
    documentId: deed.id,
    stageName: 'CLASSIFICATION',
    completedAt: new Date(Date.now() - 86000000),
    processorName: 'DocumentClassifier',
    processorVersion: '1.0.0',
    result: {
      confidence: 0.98,
      documentType: 'DEED'
    }
  });
  
  await documentLineageStorage.createProcessingStage({
    documentId: deed.id,
    stageName: 'ENTITY_EXTRACTION',
    completedAt: new Date(Date.now() - 84000000),
    processorName: 'EntityExtractor',
    processorVersion: '1.2.1',
    result: {
      entities: [
        { type: 'OWNER', value: 'John Smith', confidence: 0.95 },
        { type: 'ADDRESS', value: '123 Main St', confidence: 0.92 },
        { type: 'PARCEL_ID', value: '12345', confidence: 0.99 }
      ]
    }
  });
  
  await documentLineageStorage.createProcessingStage({
    documentId: deed.id,
    stageName: 'QUALITY_CHECK',
    completedAt: new Date(Date.now() - 80000000),
    processorName: 'QualityChecker',
    processorVersion: '1.0.5',
    result: {
      score: 0.96,
      issues: []
    }
  });
  
  await documentLineageStorage.createProcessingStage({
    documentId: legalDescription.id,
    stageName: 'ENTITY_EXTRACTION',
    completedAt: new Date(Date.now() - 44000000),
    processorName: 'EntityExtractor',
    processorVersion: '1.2.1',
    result: {
      entities: [
        { type: 'SECTION', value: '12', confidence: 0.97 },
        { type: 'TOWNSHIP', value: '2N', confidence: 0.93 },
        { type: 'RANGE', value: '3W', confidence: 0.98 }
      ]
    }
  });
  
  await documentLineageStorage.createProcessingStage({
    documentId: taxRecord.id,
    stageName: 'ENTITY_EXTRACTION',
    processorName: 'EntityExtractor',
    processorVersion: '1.2.1'
  });
}