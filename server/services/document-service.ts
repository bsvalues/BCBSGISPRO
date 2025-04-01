import { createHash } from 'crypto';
import { InsertDocument, InsertDocumentVersion, documentTypeEnum } from '@shared/schema';
import { DocumentType } from '@shared/document-types';
import { classifyDocument, ClassificationResult } from './document-classifier';
import { storage } from '../storage';

/**
 * Service for handling document operations
 */
class DocumentService {
  /**
   * Creates a new document in the system with automatic classification
   * @param params Document creation parameters
   * @returns Created document with classification details
   */
  async createDocument(params: {
    workflowId?: number;
    name: string;
    contentType: string;
    content: string; // Base64 encoded content
  }) {
    // Generate content hash for integrity verification
    const contentHash = this.generateContentHash(params.content);
    const storageKey = this.generateStorageKey(params.name, contentHash);
    
    // Extract text from document for classification (in production, this would use OCR or text extraction)
    // For now, we'll use a simple approach with the base64 data
    const textContent = this.extractText(params.content, params.contentType);
    
    // Classify the document based on its text content
    const classification = classifyDocument(textContent);
    
    // Create the document record
    const document = await storage.addDocument({
      workflowId: params.workflowId,
      name: params.name,
      type: classification.documentType,
      contentType: params.contentType,
      contentHash,
      storageKey,
      classification: {
        documentType: classification.documentType,
        confidence: classification.confidence,
        wasManuallyClassified: false,
        classifiedAt: new Date().toISOString()
      },
      content: params.content // This will be stored appropriately by the storage layer
    });
    
    // Create initial document version
    await this.createDocumentVersion({
      documentId: document.id,
      versionNumber: 1,
      content: params.content
    });
    
    return document;
  }
  
  /**
   * Creates a new version of an existing document
   * @param params Version creation parameters
   * @returns Created document version
   */
  async createDocumentVersion(params: {
    documentId: number;
    versionNumber: number;
    content: string; // Base64 encoded content
    notes?: string;
  }) {
    const contentHash = this.generateContentHash(params.content);
    const document = await storage.getDocument(params.documentId);
    if (!document) {
      throw new Error(`Document with ID ${params.documentId} not found`);
    }
    
    const storageKey = this.generateStorageKey(document.name, contentHash, params.versionNumber);
    
    return await storage.addDocumentVersion({
      documentId: params.documentId,
      versionNumber: params.versionNumber,
      contentHash,
      storageKey,
      notes: params.notes,
      content: params.content
    });
  }
  
  /**
   * Updates the document classification manually
   * @param documentId Document ID
   * @param documentType New document type
   * @returns Updated document
   */
  async updateDocumentClassification(documentId: number, documentType: DocumentType) {
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    return await storage.updateDocumentClassification(documentId, {
      documentType,
      confidence: 1.0, // 100% confidence for manual classification
      wasManuallyClassified: true,
      classifiedAt: new Date().toISOString()
    });
  }
  
  /**
   * Generates a cryptographic hash for content integrity verification
   * @param content Base64 encoded document content
   * @returns SHA-256 hash of the content
   */
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Generates a storage key for the document content
   * @param name Original document name
   * @param hash Content hash
   * @param version Optional version number
   * @returns Storage key
   */
  private generateStorageKey(name: string, hash: string, version?: number): string {
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const versionSuffix = version ? `_v${version}` : '';
    return `documents/${hash.substring(0, 8)}/${sanitizedName}${versionSuffix}`;
  }
  
  /**
   * Extracts text from document content for classification
   * In a production system, this would use proper OCR or text extraction services
   * @param content Base64 encoded document content
   * @param contentType MIME type of the document
   * @returns Extracted text
   */
  public extractText(content: string, contentType: string): string {
    // Simple extraction of readable text from base64 content
    // In production, use proper text extraction based on content type (PDF, image, etc.)
    try {
      const buffer = Buffer.from(content, 'base64');
      // For text-based files, try to extract as UTF-8
      if (contentType.startsWith('text/') || 
          contentType.includes('json') || 
          contentType.includes('xml')) {
        return buffer.toString('utf-8');
      }
      
      // For other files, just return a partial extraction of readable ASCII characters
      // This is a very simplified approach just for demo purposes
      return buffer.toString('ascii')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      console.error('Error extracting text from document:', error);
      return ''; // Return empty string if extraction fails
    }
  }
  
  /**
   * Gets all documents for a workflow
   * @param workflowId Workflow ID
   * @returns Array of documents
   */
  async getDocumentsForWorkflow(workflowId: number) {
    return await storage.getDocuments(workflowId);
  }
  
  /**
   * Gets all document versions for a document
   * @param documentId Document ID
   * @returns Array of document versions
   */
  async getDocumentVersions(documentId: number) {
    return await storage.getDocumentVersions(documentId);
  }
}

// Export a singleton instance
export const documentService = new DocumentService();