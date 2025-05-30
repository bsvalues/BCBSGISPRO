import {
  type DocumentEntity,
  type DocumentLineageEvent,
  type DocumentRelationship,
  type DocumentProcessingStage,
  type InsertDocumentEntity,
  type InsertDocumentLineageEvent,
  type InsertDocumentRelationship,
  type InsertDocumentProcessingStage
} from '../shared/schema';

// These types are still needed from document-lineage-schema
import {
  DocumentLineageGraph,
  DocumentLineageNode,
  DocumentLineageEdge,
  DocumentNodeData,
  EventNodeData,
  ProcessingNodeData
} from '../shared/document-lineage-schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Document lineage storage
 */
export class DocumentLineageMemStorage {
  private documentEntities: Map<string, DocumentEntity>;
  private documentLineageEvents: Map<string, DocumentLineageEvent>;
  private documentRelationships: Map<string, DocumentRelationship>;
  private documentProcessingStages: Map<string, DocumentProcessingStage>;

  constructor() {
    this.documentEntities = new Map();
    this.documentLineageEvents = new Map();
    this.documentRelationships = new Map();
    this.documentProcessingStages = new Map();
  }

  // Document entity operations
  async createDocument(document: InsertDocumentEntity): Promise<DocumentEntity> {
    const id = uuidv4();
    const newDocument: DocumentEntity = {
      ...document,
      id,
      createdAt: new Date(),
      status: 'active'
    };
    this.documentEntities.set(id, newDocument);
    return newDocument;
  }

  async getDocumentById(id: string): Promise<DocumentEntity | undefined> {
    return this.documentEntities.get(id);
  }

  async updateDocument(id: string, updates: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const document = this.documentEntities.get(id);
    if (!document) {
      throw new Error(`Document not found with ID: ${id}`);
    }
    
    const updatedDocument: DocumentEntity = {
      ...document,
      ...updates
    };
    
    this.documentEntities.set(id, updatedDocument);
    return updatedDocument;
  }

  async listDocuments(filter?: { 
    documentType?: string;
    parcelId?: string;
    status?: 'active' | 'archived' | 'deleted';
  }): Promise<DocumentEntity[]> {
    let documents = Array.from(this.documentEntities.values());
    
    if (filter) {
      if (filter.documentType) {
        documents = documents.filter(doc => doc.documentType === filter.documentType);
      }
      
      if (filter.parcelId) {
        documents = documents.filter(doc => doc.parcelId === filter.parcelId);
      }
      
      if (filter.status) {
        documents = documents.filter(doc => doc.status === filter.status);
      }
    }
    
    return documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Document event operations
  async createDocumentEvent(event: InsertDocumentLineageEvent): Promise<DocumentLineageEvent> {
    const id = uuidv4();
    const newEvent: DocumentLineageEvent = {
      ...event,
      id,
      eventTimestamp: new Date()
    };
    this.documentLineageEvents.set(id, newEvent);
    return newEvent;
  }

  async getDocumentEvents(documentId: string): Promise<DocumentLineageEvent[]> {
    return Array.from(this.documentLineageEvents.values())
      .filter(event => event.documentId === documentId)
      .sort((a, b) => b.eventTimestamp.getTime() - a.eventTimestamp.getTime());
  }

  // Document relationship operations
  async createDocumentRelationship(relationship: InsertDocumentRelationship): Promise<DocumentRelationship> {
    const id = uuidv4();
    const newRelationship: DocumentRelationship = {
      ...relationship,
      id,
      createdAt: new Date()
    };
    this.documentRelationships.set(id, newRelationship);
    return newRelationship;
  }

  async getDocumentRelationships(documentId: string): Promise<DocumentRelationship[]> {
    return Array.from(this.documentRelationships.values())
      .filter(rel => rel.sourceDocumentId === documentId || rel.targetDocumentId === documentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Document processing stage operations
  async createProcessingStage(stage: InsertDocumentProcessingStage): Promise<DocumentProcessingStage> {
    const id = uuidv4();
    const newStage: DocumentProcessingStage = {
      ...stage,
      id,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      completedAt: null
    };
    this.documentProcessingStages.set(id, newStage);
    return newStage;
  }

  async updateProcessingStage(id: string, updates: Partial<DocumentProcessingStage>): Promise<DocumentProcessingStage> {
    const stage = this.documentProcessingStages.get(id);
    if (!stage) {
      throw new Error(`Processing stage not found with ID: ${id}`);
    }
    
    const updatedStage: DocumentProcessingStage = {
      ...stage,
      ...updates
    };
    
    this.documentProcessingStages.set(id, updatedStage);
    return updatedStage;
  }

  async getProcessingStageById(id: string): Promise<DocumentProcessingStage | undefined> {
    return this.documentProcessingStages.get(id);
  }

  async getDocumentProcessingStages(documentId: string): Promise<DocumentProcessingStage[]> {
    return Array.from(this.documentProcessingStages.values())
      .filter(stage => stage.documentId === documentId)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  }

  // Document graph operations
  async getDocumentLineageGraph(documentId: string, depth: number = 1): Promise<DocumentLineageGraph> {
    const nodes: DocumentLineageNode[] = [];
    const edges: DocumentLineageEdge[] = [];
    const visited = new Set<string>();
    
    // Helper function to build the graph
    const buildGraph = async (docId: string, currentDepth: number) => {
      if (visited.has(docId) || currentDepth > depth) {
        return;
      }
      
      visited.add(docId);
      
      // Add document node
      const document = await this.getDocumentById(docId);
      if (!document) {
        return;
      }
      
      const docNodeId = `doc_${document.id}`;
      nodes.push({
        id: docNodeId,
        type: 'document',
        label: document.documentName,
        data: {
          entityId: document.id,
          documentName: document.documentName,
          documentType: document.documentType,
          createdAt: document.createdAt,
          uploadedBy: document.uploadedBy,
          parcelId: document.parcelId,
          status: document.status,
          description: document.description,
          fileSize: document.fileSize,
          fileHash: document.fileHash
        } as DocumentNodeData
      });
      
      // Add events
      const events = await this.getDocumentEvents(docId);
      for (const event of events) {
        const eventNodeId = `event_${event.id}`;
        nodes.push({
          id: eventNodeId,
          type: 'event',
          label: event.eventType,
          data: {
            entityId: event.id,
            eventType: event.eventType,
            eventTimestamp: event.eventTimestamp,
            performedBy: event.performedBy,
            documentId: event.documentId,
            details: event.details,
            confidence: event.confidence
          } as EventNodeData
        });
        
        edges.push({
          id: `edge_${docNodeId}_${eventNodeId}`,
          source: docNodeId,
          target: eventNodeId,
          type: 'has_event',
          label: 'Has Event'
        });
      }
      
      // Add processing stages
      const stages = await this.getDocumentProcessingStages(docId);
      for (const stage of stages) {
        const stageNodeId = `stage_${stage.id}`;
        nodes.push({
          id: stageNodeId,
          type: 'processing',
          label: stage.stageName,
          data: {
            entityId: stage.id,
            stageName: stage.stageName,
            status: stage.status,
            progress: stage.progress,
            startedAt: stage.startedAt,
            completedAt: stage.completedAt,
            processorName: stage.processorName,
            processorVersion: stage.processorVersion,
            documentId: stage.documentId,
            result: stage.result
          } as ProcessingNodeData
        });
        
        edges.push({
          id: `edge_${docNodeId}_${stageNodeId}`,
          source: docNodeId,
          target: stageNodeId,
          type: 'has_processing',
          label: 'Processed By'
        });
      }
      
      if (currentDepth < depth) {
        // Add relationships
        const relationships = await this.getDocumentRelationships(docId);
        for (const rel of relationships) {
          const otherDocId = rel.sourceDocumentId === docId ? rel.targetDocumentId : rel.sourceDocumentId;
          const otherDoc = await this.getDocumentById(otherDocId);
          
          if (otherDoc) {
            // Recursively build the graph for related documents
            await buildGraph(otherDocId, currentDepth + 1);
            
            const sourceNodeId = `doc_${rel.sourceDocumentId}`;
            const targetNodeId = `doc_${rel.targetDocumentId}`;
            
            edges.push({
              id: `rel_${rel.id}`,
              source: sourceNodeId,
              target: targetNodeId,
              type: rel.relationshipType,
              label: rel.relationshipType,
              data: rel.metadata
            });
          }
        }
      }
    };
    
    // Start building the graph from the root document
    await buildGraph(documentId, 0);
    
    return {
      nodes,
      edges,
      metadata: {
        generatedAt: new Date(),
        rootDocumentId: documentId,
        depth,
        documentCount: nodes.filter(n => n.type === 'document').length
      }
    };
  }

  async getDocumentProvenance(documentId: string): Promise<DocumentEntity[]> {
    const visited = new Set<string>();
    const result: DocumentEntity[] = [];
    
    const findProvenance = async (docId: string) => {
      if (visited.has(docId)) {
        return;
      }
      
      visited.add(docId);
      
      // Find all relationships where this document is the target
      const relationships = Array.from(this.documentRelationships.values())
        .filter(rel => rel.targetDocumentId === docId);
      
      for (const rel of relationships) {
        const sourceDoc = await this.getDocumentById(rel.sourceDocumentId);
        if (sourceDoc) {
          result.push(sourceDoc);
          // Recursively find the provenance of the source document
          await findProvenance(rel.sourceDocumentId);
        }
      }
    };
    
    await findProvenance(documentId);
    return result;
  }

  async getCompleteLineageGraph(documentIds: string[], depth: number = 2): Promise<DocumentLineageGraph> {
    const mergedGraph: DocumentLineageGraph = {
      nodes: [],
      edges: [],
      metadata: {
        generatedAt: new Date(),
        documentCount: 0,
        depth
      }
    };
    
    const nodeMap = new Map<string, DocumentLineageNode>();
    const edgeMap = new Map<string, DocumentLineageEdge>();
    
    for (const docId of documentIds) {
      const subgraph = await this.getDocumentLineageGraph(docId, depth);
      
      // Merge nodes (avoid duplicates)
      for (const node of subgraph.nodes) {
        if (!nodeMap.has(node.id)) {
          nodeMap.set(node.id, node);
        }
      }
      
      // Merge edges (avoid duplicates)
      for (const edge of subgraph.edges) {
        if (!edgeMap.has(edge.id)) {
          edgeMap.set(edge.id, edge);
        }
      }
    }
    
    mergedGraph.nodes = Array.from(nodeMap.values());
    mergedGraph.edges = Array.from(edgeMap.values());
    mergedGraph.metadata.documentCount = mergedGraph.nodes.filter(n => n.type === 'document').length;
    
    return mergedGraph;
  }
}

export const documentLineageStorage = new DocumentLineageMemStorage();