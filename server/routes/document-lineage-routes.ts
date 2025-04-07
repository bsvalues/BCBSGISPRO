import { Express } from "express";
import { asyncHandler } from "../error-handler";
import { ApiError } from "../error-handler";
import { z } from "zod";
import { 
  insertDocumentEntitySchema,
  insertDocumentLineageEventSchema,
  insertDocumentRelationshipSchema,
  insertDocumentProcessingStageSchema
} from "../../shared/document-lineage-schema";
import documentLineageStorage from "../document-lineage";

/**
 * Register document lineage API routes
 * 
 * @param app Express application instance
 */
export function registerDocumentLineageRoutes(app: Express): void {
  // Get document lineage graph
  app.get("/api/document-lineage/:documentId", asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const depth = req.query.depth ? parseInt(req.query.depth as string) : 2;
    
    if (!documentId) {
      throw ApiError.badRequest("Document ID is required");
    }
    
    const lineage = await documentLineageStorage.getDocumentLineage(documentId, depth);
    return res.json(lineage);
  }));
  
  // Get document provenance graph
  app.get("/api/document-provenance/:documentId", asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const depth = req.query.depth ? parseInt(req.query.depth as string) : 2;
    
    if (!documentId) {
      throw ApiError.badRequest("Document ID is required");
    }
    
    const provenance = await documentLineageStorage.getDocumentProvenance(documentId, depth);
    return res.json(provenance);
  }));
  
  // Get complete document graph
  app.post("/api/document-lineage-graph", asyncHandler(async (req, res) => {
    const { documentIds } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      throw ApiError.badRequest("Document IDs array is required");
    }
    
    const graph = await documentLineageStorage.getCompleteDocumentGraph(documentIds);
    return res.json(graph);
  }));
  
  // Document entity CRUD operations
  app.post("/api/document-entities", asyncHandler(async (req, res) => {
    const validatedData = insertDocumentEntitySchema.parse(req.body);
    const document = await documentLineageStorage.createDocument(validatedData);
    return res.status(201).json(document);
  }));
  
  app.get("/api/document-entities/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      throw ApiError.badRequest("Document ID is required");
    }
    
    const document = await documentLineageStorage.getDocumentById(id);
    
    if (!document) {
      throw ApiError.notFound("Document not found");
    }
    
    return res.json(document);
  }));
  
  app.get("/api/document-entities", asyncHandler(async (req, res) => {
    // Convert query parameters to filters
    const filters: any = {};
    const allowedFilters = ["documentType", "status", "uploadedBy", "parcelId"];
    
    for (const filter of allowedFilters) {
      if (req.query[filter]) {
        filters[filter] = req.query[filter];
      }
    }
    
    const documents = await documentLineageStorage.listDocuments(filters);
    return res.json(documents);
  }));
  
  app.patch("/api/document-entities/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      throw ApiError.badRequest("Document ID is required");
    }
    
    // Validate the update data (partial validation)
    const updateSchema = insertDocumentEntitySchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    const updatedDocument = await documentLineageStorage.updateDocument(id, validatedData);
    
    if (!updatedDocument) {
      throw ApiError.notFound("Document not found");
    }
    
    return res.json(updatedDocument);
  }));
  
  // Document lineage event operations
  app.post("/api/document-lineage-events", asyncHandler(async (req, res) => {
    const validatedData = insertDocumentLineageEventSchema.parse(req.body);
    const event = await documentLineageStorage.createLineageEvent(validatedData);
    return res.status(201).json(event);
  }));
  
  app.get("/api/document-lineage-events/:documentId", asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    
    if (!documentId) {
      throw ApiError.badRequest("Document ID is required");
    }
    
    const events = await documentLineageStorage.getLineageEventsForDocument(documentId);
    return res.json(events);
  }));
  
  // Document relationship operations
  app.post("/api/document-relationships", asyncHandler(async (req, res) => {
    const validatedData = insertDocumentRelationshipSchema.parse(req.body);
    const relationship = await documentLineageStorage.createRelationship(validatedData);
    return res.status(201).json(relationship);
  }));
  
  app.get("/api/document-relationships/:documentId", asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const { type } = req.query;
    
    if (!documentId) {
      throw ApiError.badRequest("Document ID is required");
    }
    
    const relationships = await documentLineageStorage.getRelationshipsForDocument(
      documentId, 
      type as string | undefined
    );
    
    return res.json(relationships);
  }));
  
  // Document processing stage operations
  app.post("/api/document-processing-stages", asyncHandler(async (req, res) => {
    const validatedData = insertDocumentProcessingStageSchema.parse(req.body);
    const stage = await documentLineageStorage.createProcessingStage(validatedData);
    return res.status(201).json(stage);
  }));
  
  app.get("/api/document-processing-stages/:documentId", asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    
    if (!documentId) {
      throw ApiError.badRequest("Document ID is required");
    }
    
    const stages = await documentLineageStorage.getProcessingStagesForDocument(documentId);
    return res.json(stages);
  }));
  
  app.patch("/api/document-processing-stages/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      throw ApiError.badRequest("Processing stage ID is required");
    }
    
    // Validate the update data (partial validation)
    const updateSchema = insertDocumentProcessingStageSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    const updatedStage = await documentLineageStorage.updateProcessingStage(id, validatedData);
    
    if (!updatedStage) {
      throw ApiError.notFound("Processing stage not found");
    }
    
    return res.json(updatedStage);
  }));
}