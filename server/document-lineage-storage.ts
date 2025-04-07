import { v4 as uuid } from "uuid";
import { 
  DocumentEntity, 
  DocumentLineageEvent, 
  DocumentRelationship, 
  DocumentProcessingStage,
  DocumentLineageGraph,
  DocumentLineageNode,
  DocumentLineageEdge,
  InsertDocumentEntity,
  InsertDocumentLineageEvent,
  InsertDocumentRelationship,
  InsertDocumentProcessingStage
} from "../shared/document-lineage-schema";

/**
 * Interface defining document lineage storage operations
 */
export interface IDocumentLineageStorage {
  // Document Entity Operations
  createDocument(data: InsertDocumentEntity): Promise<DocumentEntity>;
  getDocumentById(id: string): Promise<DocumentEntity | null>;
  updateDocument(id: string, data: Partial<InsertDocumentEntity>): Promise<DocumentEntity | null>;
  listDocuments(filters?: Partial<DocumentEntity>): Promise<DocumentEntity[]>;
  
  // Document Lineage Event Operations
  createLineageEvent(data: InsertDocumentLineageEvent): Promise<DocumentLineageEvent>;
  getLineageEventsForDocument(documentId: string): Promise<DocumentLineageEvent[]>;
  
  // Document Relationship Operations
  createRelationship(data: InsertDocumentRelationship): Promise<DocumentRelationship>;
  getRelationshipsForDocument(documentId: string, relationshipType?: string): Promise<DocumentRelationship[]>;
  
  // Document Processing Stage Operations
  createProcessingStage(data: InsertDocumentProcessingStage): Promise<DocumentProcessingStage>;
  getProcessingStagesForDocument(documentId: string): Promise<DocumentProcessingStage[]>;
  updateProcessingStage(id: string, data: Partial<InsertDocumentProcessingStage>): Promise<DocumentProcessingStage | null>;
  
  // Lineage Graph Generation
  getDocumentLineage(documentId: string, depth?: number): Promise<DocumentLineageGraph>;
  getDocumentProvenance(documentId: string, depth?: number): Promise<DocumentLineageGraph>;
  getCompleteDocumentGraph(documentIds: string[]): Promise<DocumentLineageGraph>;
}

/**
 * In-memory implementation of document lineage storage
 */
export class MemDocumentLineageStorage implements IDocumentLineageStorage {
  private documents: Record<string, DocumentEntity> = {};
  private lineageEvents: Record<string, DocumentLineageEvent> = {};
  private relationships: Record<string, DocumentRelationship> = {};
  private processingStages: Record<string, DocumentProcessingStage> = {};

  // Document Entity Operations
  async createDocument(data: InsertDocumentEntity): Promise<DocumentEntity> {
    const id = uuid();
    // Ensure all required fields have values and handle optional fields based on the schema
    const document: DocumentEntity = {
      id,
      documentName: data.documentName,
      documentType: data.documentType,
      uploadedAt: data.uploadedAt,
      uploadedBy: data.uploadedBy,
      status: data.status || "active",
      fileHash: data.fileHash || null,
      fileFormat: data.fileFormat || null,
      parcelId: data.parcelId || null,
      metadata: data.metadata || {}
    };
    
    this.documents[id] = document;
    return document;
  }

  async getDocumentById(id: string): Promise<DocumentEntity | null> {
    return this.documents[id] || null;
  }

  async updateDocument(id: string, data: Partial<InsertDocumentEntity>): Promise<DocumentEntity | null> {
    const document = this.documents[id];
    if (!document) return null;

    const updatedDocument = {
      ...document,
      ...data,
    };
    this.documents[id] = updatedDocument;
    return updatedDocument;
  }

  async listDocuments(filters?: Partial<DocumentEntity>): Promise<DocumentEntity[]> {
    let documents = Object.values(this.documents);
    
    if (filters) {
      documents = documents.filter(doc => {
        return Object.entries(filters).every(([key, value]) => {
          return doc[key as keyof DocumentEntity] === value;
        });
      });
    }
    
    return documents;
  }

  // Document Lineage Event Operations
  async createLineageEvent(data: InsertDocumentLineageEvent): Promise<DocumentLineageEvent> {
    const id = uuid();
    // Ensure all required fields have values and handle optional fields
    const event: DocumentLineageEvent = {
      id,
      documentId: data.documentId,
      eventType: data.eventType,
      eventTimestamp: data.eventTimestamp,
      performedBy: data.performedBy,
      details: data.details || {},
      previousVersionId: data.previousVersionId || null,
      relatedEntityId: data.relatedEntityId || null,
      relatedEntityType: data.relatedEntityType || null,
      // Ensure confidence is either a number or null, never undefined
      confidence: typeof data.confidence === 'number' ? data.confidence : null
    };
    this.lineageEvents[id] = event;
    return event;
  }

  async getLineageEventsForDocument(documentId: string): Promise<DocumentLineageEvent[]> {
    return Object.values(this.lineageEvents).filter(
      event => event.documentId === documentId
    );
  }

  // Document Relationship Operations
  async createRelationship(data: InsertDocumentRelationship): Promise<DocumentRelationship> {
    const id = uuid();
    // Ensure all required fields have values and handle optional fields
    const relationship: DocumentRelationship = {
      id,
      sourceDocumentId: data.sourceDocumentId,
      targetDocumentId: data.targetDocumentId,
      relationshipType: data.relationshipType,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      metadata: data.metadata || {},
      // Ensure confidence is either a number or null, never undefined
      confidence: typeof data.confidence === 'number' ? data.confidence : null,
      isActive: data.isActive !== undefined ? data.isActive : true
    };
    this.relationships[id] = relationship;
    return relationship;
  }

  async getRelationshipsForDocument(documentId: string, relationshipType?: string): Promise<DocumentRelationship[]> {
    return Object.values(this.relationships).filter(
      rel => 
        (rel.sourceDocumentId === documentId || rel.targetDocumentId === documentId) &&
        (!relationshipType || rel.relationshipType === relationshipType) &&
        rel.isActive
    );
  }

  // Document Processing Stage Operations
  async createProcessingStage(data: InsertDocumentProcessingStage): Promise<DocumentProcessingStage> {
    const id = uuid();
    // Ensure all required fields have values and handle optional fields
    const stage: DocumentProcessingStage = {
      id,
      documentId: data.documentId,
      stageName: data.stageName,
      stageOrder: data.stageOrder,
      status: data.status,
      startTime: data.startTime || null,
      completionTime: data.completionTime || null,
      processorId: data.processorId || null,
      processorType: data.processorType || null,
      result: data.result || {},
      // Ensure confidence is either a number or null, never undefined
      confidence: typeof data.confidence === 'number' ? data.confidence : null,
      nextStageIds: data.nextStageIds || []
    };
    this.processingStages[id] = stage;
    return stage;
  }

  async getProcessingStagesForDocument(documentId: string): Promise<DocumentProcessingStage[]> {
    return Object.values(this.processingStages)
      .filter(stage => stage.documentId === documentId)
      .sort((a, b) => (a.stageOrder || 0) - (b.stageOrder || 0));
  }

  async updateProcessingStage(id: string, data: Partial<InsertDocumentProcessingStage>): Promise<DocumentProcessingStage | null> {
    const stage = this.processingStages[id];
    if (!stage) return null;

    const updatedStage = {
      ...stage,
      ...data,
    };
    this.processingStages[id] = updatedStage;
    return updatedStage;
  }

  // Lineage Graph Generation
  async getDocumentLineage(documentId: string, depth: number = 2): Promise<DocumentLineageGraph> {
    const nodes: DocumentLineageNode[] = [];
    const edges: DocumentLineageEdge[] = [];
    const processedNodes = new Set<string>();

    // Get the starting document
    const document = await this.getDocumentById(documentId);
    if (!document) {
      return { nodes, edges };
    }

    // Add the document as the first node
    nodes.push({
      id: document.id,
      type: "document",
      label: document.documentName,
      data: document
    });
    processedNodes.add(document.id);

    // Function to recursively build the lineage graph (downstream)
    const buildLineageGraph = async (docId: string, currentDepth: number) => {
      if (currentDepth <= 0) return;

      // Get all relationships where this document is the source
      const relationships = await this.getRelationshipsForDocument(docId);
      
      for (const relationship of relationships) {
        if (relationship.targetDocumentId !== docId) {
          // Add target document if not already processed
          if (!processedNodes.has(relationship.targetDocumentId)) {
            const targetDoc = await this.getDocumentById(relationship.targetDocumentId);
            if (targetDoc) {
              nodes.push({
                id: targetDoc.id,
                type: "document",
                label: targetDoc.documentName,
                data: targetDoc
              });
              processedNodes.add(targetDoc.id);
            }
          }

          // Add the relationship edge
          edges.push({
            id: relationship.id,
            source: docId,
            target: relationship.targetDocumentId,
            type: relationship.relationshipType,
            data: relationship
          });

          // Recursively process the target document
          await buildLineageGraph(relationship.targetDocumentId, currentDepth - 1);
        }
      }

      // Get processing stages for this document
      const stages = await this.getProcessingStagesForDocument(docId);
      
      for (const stage of stages) {
        if (!processedNodes.has(stage.id)) {
          // Add stage node
          nodes.push({
            id: stage.id,
            type: "stage",
            label: stage.stageName,
            data: stage
          });
          processedNodes.add(stage.id);

          // Add edge from document to stage
          edges.push({
            id: `${docId}_${stage.id}`,
            source: docId,
            target: stage.id,
            type: "processed-by",
            data: null
          });
        }
      }
    };

    // Start building the graph
    await buildLineageGraph(documentId, depth);

    return { nodes, edges };
  }

  async getDocumentProvenance(documentId: string, depth: number = 2): Promise<DocumentLineageGraph> {
    const nodes: DocumentLineageNode[] = [];
    const edges: DocumentLineageEdge[] = [];
    const processedNodes = new Set<string>();

    // Get the starting document
    const document = await this.getDocumentById(documentId);
    if (!document) {
      return { nodes, edges };
    }

    // Add the document as the first node
    nodes.push({
      id: document.id,
      type: "document",
      label: document.documentName,
      data: document
    });
    processedNodes.add(document.id);

    // Function to recursively build the provenance graph (upstream)
    const buildProvenanceGraph = async (docId: string, currentDepth: number) => {
      if (currentDepth <= 0) return;

      // Get all relationships where this document is the target
      const relationships = await this.getRelationshipsForDocument(docId);
      
      for (const relationship of relationships) {
        if (relationship.sourceDocumentId !== docId) {
          // Add source document if not already processed
          if (!processedNodes.has(relationship.sourceDocumentId)) {
            const sourceDoc = await this.getDocumentById(relationship.sourceDocumentId);
            if (sourceDoc) {
              nodes.push({
                id: sourceDoc.id,
                type: "document",
                label: sourceDoc.documentName,
                data: sourceDoc
              });
              processedNodes.add(sourceDoc.id);
            }
          }

          // Add the relationship edge
          edges.push({
            id: relationship.id,
            source: relationship.sourceDocumentId,
            target: docId,
            type: relationship.relationshipType,
            data: relationship
          });

          // Recursively process the source document
          await buildProvenanceGraph(relationship.sourceDocumentId, currentDepth - 1);
        }
      }

      // Get lineage events for this document
      const events = await this.getLineageEventsForDocument(docId);
      
      for (const event of events) {
        if (!processedNodes.has(event.id)) {
          // Add event node
          nodes.push({
            id: event.id,
            type: "event",
            label: event.eventType,
            data: event
          });
          processedNodes.add(event.id);

          // Add edge from event to document
          edges.push({
            id: `${event.id}_${docId}`,
            source: event.id,
            target: docId,
            type: "event",
            data: null
          });

          // If there's a previous version, add it
          if (event.previousVersionId) {
            if (!processedNodes.has(event.previousVersionId)) {
              const prevDoc = await this.getDocumentById(event.previousVersionId);
              if (prevDoc) {
                nodes.push({
                  id: prevDoc.id,
                  type: "document",
                  label: prevDoc.documentName,
                  data: prevDoc
                });
                processedNodes.add(prevDoc.id);
              }
            }

            // Add edge from previous version to event
            edges.push({
              id: `${event.previousVersionId}_${event.id}`,
              source: event.previousVersionId,
              target: event.id,
              type: "previous-version",
              data: null
            });

            // Recursively process the previous version
            await buildProvenanceGraph(event.previousVersionId, currentDepth - 1);
          }
        }
      }
    };

    // Start building the graph
    await buildProvenanceGraph(documentId, depth);

    return { nodes, edges };
  }

  async getCompleteDocumentGraph(documentIds: string[]): Promise<DocumentLineageGraph> {
    const nodes: DocumentLineageNode[] = [];
    const edges: DocumentLineageEdge[] = [];
    const processedNodes = new Set<string>();

    // Process each document
    for (const docId of documentIds) {
      // Get lineage and provenance graphs
      const lineageGraph = await this.getDocumentLineage(docId);
      const provenanceGraph = await this.getDocumentProvenance(docId);

      // Merge nodes
      for (const node of [...lineageGraph.nodes, ...provenanceGraph.nodes]) {
        if (!processedNodes.has(node.id)) {
          nodes.push(node);
          processedNodes.add(node.id);
        }
      }

      // Merge edges (no need to deduplicate as edges have unique IDs)
      edges.push(...lineageGraph.edges, ...provenanceGraph.edges);
    }

    return { nodes, edges };
  }
}