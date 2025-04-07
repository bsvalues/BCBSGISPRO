import { v4 as uuidv4 } from 'uuid';
import {
  DocumentEntity,
  InsertDocumentEntity,
  DocumentLineageEvent,
  InsertDocumentLineageEvent,
  DocumentRelationship,
  InsertDocumentRelationship,
  DocumentProcessingStage,
  InsertDocumentProcessingStage,
  DocumentLineageGraph,
  DocumentLineageNode,
  DocumentLineageEdge
} from '../shared/document-lineage-schema';

/**
 * Interface defining document lineage storage operations
 */
export interface IDocumentLineageStorage {
  // Document Entity Operations
  createDocument(data: InsertDocumentEntity): Promise<DocumentEntity>;
  getDocumentById(id: string): Promise<DocumentEntity | undefined>;
  updateDocument(id: string, data: Partial<InsertDocumentEntity>): Promise<DocumentEntity | undefined>;
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
  updateProcessingStage(id: string, data: Partial<InsertDocumentProcessingStage>): Promise<DocumentProcessingStage | undefined>;
  
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

  /**
   * Creates a new document entity
   */
  async createDocument(data: InsertDocumentEntity): Promise<DocumentEntity> {
    const document: DocumentEntity = {
      id: uuidv4(),
      createdAt: new Date(),
      status: 'active',
      ...data
    };
    
    this.documents[document.id] = document;
    return document;
  }

  /**
   * Retrieves a document by its ID
   */
  async getDocumentById(id: string): Promise<DocumentEntity | undefined> {
    return this.documents[id];
  }

  /**
   * Updates an existing document
   */
  async updateDocument(id: string, data: Partial<InsertDocumentEntity>): Promise<DocumentEntity | undefined> {
    const document = this.documents[id];
    
    if (!document) {
      return undefined;
    }
    
    const updatedDocument: DocumentEntity = {
      ...document,
      ...data
    };
    
    this.documents[id] = updatedDocument;
    return updatedDocument;
  }

  /**
   * Lists documents matching optional filters
   */
  async listDocuments(filters?: Partial<DocumentEntity>): Promise<DocumentEntity[]> {
    const documents = Object.values(this.documents);
    
    if (!filters) {
      return documents;
    }
    
    return documents.filter(document => {
      // Check each filter property
      for (const [key, value] of Object.entries(filters)) {
        if (document[key as keyof DocumentEntity] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Creates a new lineage event
   */
  async createLineageEvent(data: InsertDocumentLineageEvent): Promise<DocumentLineageEvent> {
    const event: DocumentLineageEvent = {
      id: uuidv4(),
      eventTimestamp: new Date(),
      ...data
    };
    
    this.lineageEvents[event.id] = event;
    return event;
  }

  /**
   * Gets lineage events for a document
   */
  async getLineageEventsForDocument(documentId: string): Promise<DocumentLineageEvent[]> {
    return Object.values(this.lineageEvents)
      .filter(event => event.documentId === documentId)
      .sort((a, b) => a.eventTimestamp.getTime() - b.eventTimestamp.getTime());
  }

  /**
   * Creates a new document relationship
   */
  async createRelationship(data: InsertDocumentRelationship): Promise<DocumentRelationship> {
    const relationship: DocumentRelationship = {
      id: uuidv4(),
      createdAt: new Date(),
      ...data
    };
    
    this.relationships[relationship.id] = relationship;
    return relationship;
  }

  /**
   * Gets relationships for a document
   * @param documentId - The document ID
   * @param relationshipType - Optional relationship type filter
   */
  async getRelationshipsForDocument(documentId: string, relationshipType?: string): Promise<DocumentRelationship[]> {
    return Object.values(this.relationships)
      .filter(rel => 
        (rel.sourceDocumentId === documentId || rel.targetDocumentId === documentId) &&
        (!relationshipType || rel.relationshipType === relationshipType)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Creates a new document processing stage
   */
  async createProcessingStage(data: InsertDocumentProcessingStage): Promise<DocumentProcessingStage> {
    const stage: DocumentProcessingStage = {
      id: uuidv4(),
      status: 'pending',
      startedAt: new Date(),
      progress: 0,
      ...data
    };
    
    this.processingStages[stage.id] = stage;
    return stage;
  }

  /**
   * Gets processing stages for a document
   */
  async getProcessingStagesForDocument(documentId: string): Promise<DocumentProcessingStage[]> {
    return Object.values(this.processingStages)
      .filter(stage => stage.documentId === documentId)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  }

  /**
   * Updates an existing processing stage
   */
  async updateProcessingStage(id: string, data: Partial<InsertDocumentProcessingStage>): Promise<DocumentProcessingStage | undefined> {
    const stage = this.processingStages[id];
    
    if (!stage) {
      return undefined;
    }
    
    const updatedStage: DocumentProcessingStage = {
      ...stage,
      ...data
    };
    
    this.processingStages[id] = updatedStage;
    return updatedStage;
  }

  /**
   * Generates a document lineage graph
   * Shows documents that were derived from the specified document
   */
  async getDocumentLineage(documentId: string, depth: number = 2): Promise<DocumentLineageGraph> {
    const document = await this.getDocumentById(documentId);
    
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    const graph: DocumentLineageGraph = {
      nodes: [],
      edges: [],
      metadata: {
        generatedAt: new Date(),
        depth,
        rootDocumentId: documentId
      }
    };
    
    // Start building the graph from the root document
    await this.buildLineageGraph(
      document,
      graph,
      depth,
      'forward',
      new Set<string>(),
      {x: 0, y: 0}
    );
    
    return graph;
  }

  /**
   * Generates a document provenance graph
   * Shows documents that the specified document was derived from
   */
  async getDocumentProvenance(documentId: string, depth: number = 2): Promise<DocumentLineageGraph> {
    const document = await this.getDocumentById(documentId);
    
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    const graph: DocumentLineageGraph = {
      nodes: [],
      edges: [],
      metadata: {
        generatedAt: new Date(),
        depth,
        rootDocumentId: documentId
      }
    };
    
    // Start building the graph from the root document
    await this.buildLineageGraph(
      document,
      graph,
      depth,
      'backward',
      new Set<string>(),
      {x: 0, y: 0}
    );
    
    return graph;
  }

  /**
   * Generates a complete document graph for multiple documents
   */
  async getCompleteDocumentGraph(documentIds: string[]): Promise<DocumentLineageGraph> {
    const graph: DocumentLineageGraph = {
      nodes: [],
      edges: [],
      metadata: {
        generatedAt: new Date()
      }
    };
    
    const processedDocuments = new Set<string>();
    const initialPositions = [
      {x: 0, y: 0},
      {x: 300, y: 0},
      {x: 0, y: 300},
      {x: 300, y: 300},
      {x: 150, y: 150}
    ];
    
    // Process each document
    for (let i = 0; i < documentIds.length; i++) {
      const documentId = documentIds[i];
      const document = await this.getDocumentById(documentId);
      
      if (!document) {
        continue;
      }
      
      // Use one of the predefined positions or a default
      const position = initialPositions[i] || {x: i * 100, y: i * 100};
      
      // Add the document and its connections to the graph
      await this.buildLineageGraph(
        document,
        graph,
        1, // Minimal depth
        'both',
        processedDocuments,
        position
      );
    }
    
    return graph;
  }

  /**
   * Helper method to recursively build lineage graphs
   */
  private async buildLineageGraph(
    document: DocumentEntity,
    graph: DocumentLineageGraph,
    depth: number,
    direction: 'forward' | 'backward' | 'both',
    processedDocuments: Set<string>,
    position: {x: number, y: number}
  ): Promise<void> {
    // If we've already processed this document or reached max depth, return
    if (processedDocuments.has(document.id) || depth < 0) {
      return;
    }
    
    processedDocuments.add(document.id);
    
    // Create a node for the document
    const documentNode: DocumentLineageNode = {
      id: `doc_${document.id}`,
      type: 'document',
      label: document.documentName,
      data: {
        ...document,
        entityId: document.id,
        position
      }
    };
    
    graph.nodes.push(documentNode);
    
    // Add events for this document
    const events = await this.getLineageEventsForDocument(document.id);
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      const eventNode: DocumentLineageNode = {
        id: `event_${event.id}`,
        type: 'event',
        label: event.eventType,
        data: {
          ...event,
          entityId: event.id,
          position: {
            x: position.x + 150,
            y: position.y + (i * 80) - ((events.length - 1) * 40)
          }
        }
      };
      
      const eventEdge: DocumentLineageEdge = {
        id: `doc_to_event_${document.id}_${event.id}`,
        source: documentNode.id,
        target: eventNode.id,
        type: 'document_event'
      };
      
      graph.nodes.push(eventNode);
      graph.edges.push(eventEdge);
    }
    
    // Add processing stages for this document
    const stages = await this.getProcessingStagesForDocument(document.id);
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      const stageNode: DocumentLineageNode = {
        id: `stage_${stage.id}`,
        type: 'stage',
        label: stage.stageName,
        data: {
          ...stage,
          entityId: stage.id,
          position: {
            x: position.x - 150,
            y: position.y + (i * 80) - ((stages.length - 1) * 40)
          }
        }
      };
      
      const stageEdge: DocumentLineageEdge = {
        id: `doc_to_stage_${document.id}_${stage.id}`,
        source: documentNode.id,
        target: stageNode.id,
        type: 'document_stage'
      };
      
      graph.nodes.push(stageNode);
      graph.edges.push(stageEdge);
    }
    
    // Get relationships and follow them based on direction
    if (direction === 'forward' || direction === 'both') {
      // Find documents derived from this one
      const relationships = await this.getRelationshipsForDocument(document.id);
      
      for (const relationship of relationships) {
        // Only follow relationships where this document is the source
        if (relationship.sourceDocumentId === document.id) {
          const targetDocument = await this.getDocumentById(relationship.targetDocumentId);
          
          if (targetDocument) {
            // Recursively process the target document
            await this.buildLineageGraph(
              targetDocument,
              graph,
              depth - 1,
              direction,
              processedDocuments,
              {
                x: position.x + 300,
                y: position.y + Math.random() * 200 - 100
              }
            );
            
            // Add an edge between the documents
            const edge: DocumentLineageEdge = {
              id: `rel_${relationship.id}`,
              source: `doc_${document.id}`,
              target: `doc_${targetDocument.id}`,
              type: relationship.relationshipType,
              label: relationship.relationshipType
            };
            
            graph.edges.push(edge);
          }
        }
      }
    }
    
    if (direction === 'backward' || direction === 'both') {
      // Find documents this document was derived from
      const relationships = await this.getRelationshipsForDocument(document.id);
      
      for (const relationship of relationships) {
        // Only follow relationships where this document is the target
        if (relationship.targetDocumentId === document.id) {
          const sourceDocument = await this.getDocumentById(relationship.sourceDocumentId);
          
          if (sourceDocument) {
            // Recursively process the source document
            await this.buildLineageGraph(
              sourceDocument,
              graph,
              depth - 1,
              direction,
              processedDocuments,
              {
                x: position.x - 300,
                y: position.y + Math.random() * 200 - 100
              }
            );
            
            // Add an edge between the documents
            const edge: DocumentLineageEdge = {
              id: `rel_${relationship.id}`,
              source: `doc_${sourceDocument.id}`,
              target: `doc_${document.id}`,
              type: relationship.relationshipType,
              label: relationship.relationshipType
            };
            
            graph.edges.push(edge);
          }
        }
      }
    }
  }
}

// Create a singleton instance for use throughout the application
export const documentLineageStorage = new MemDocumentLineageStorage();