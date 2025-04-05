/**
 * Document type definitions for the Benton County GIS application
 */

/**
 * Document classification types for parcel-related documents
 */
export type DocumentClassification = 
  | 'Deed' 
  | 'Plat' 
  | 'Survey' 
  | 'TaxRecord' 
  | 'Permit' 
  | 'Easement' 
  | 'Photos' 
  | 'Other';

/**
 * Processing status of a document
 */
export type DocumentStatus = 'pending' | 'processed' | 'error';

/**
 * Metadata for a document stored in the system
 */
export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  dateUploaded: string;
  status: DocumentStatus;
  classification?: DocumentClassification;
  contentType: string;
  parcelId?: string;
  creator?: string;
  lastModified: string;
  version?: string;
}

/**
 * Get human-readable label for a document classification
 */
export function getDocumentTypeLabel(classification: DocumentClassification): string {
  switch (classification) {
    case 'Deed':
      return 'Deed';
    case 'Plat':
      return 'Plat Map';
    case 'Survey':
      return 'Survey';
    case 'TaxRecord':
      return 'Tax Record';
    case 'Permit':
      return 'Permit';
    case 'Easement':
      return 'Easement';
    case 'Photos':
      return 'Photographs';
    case 'Other':
      return 'Other Document';
    default:
      return 'Unknown';
  }
}

/**
 * Document version information
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: string;
  dateCreated: string;
  createdBy: string;
  changes?: string;
  size: number;
  path: string;
}

/**
 * A link between a document and a parcel
 */
export interface DocumentParcelLink {
  id: string;
  documentId: string;
  parcelId: string;
  linkType?: 'primary' | 'reference';
  dateLinked: string;
  linkedBy: string;
}

/**
 * A simplified parcel record for document associations
 */
export interface ParcelReference {
  id: string;
  parcelNumber: string;
  address?: string;
  owner?: string;
  legalDescription?: string;
}

/**
 * Document upload request parameters
 */
export interface DocumentUploadRequest {
  file: File;
  parcelId?: string;
  classification?: DocumentClassification;
  metadata?: Record<string, string>;
}

/**
 * Document search parameters
 */
export interface DocumentSearchParams {
  query?: string;
  parcelId?: string;
  classification?: DocumentClassification;
  dateFrom?: string;
  dateTo?: string;
  status?: DocumentStatus;
  creator?: string;
  limit?: number;
  offset?: number;
}

/**
 * Result of document classification operation
 */
export interface ClassificationResult {
  classification: DocumentClassification;
  confidence: number;
  detectedParcelId?: string;
  alternativeClassifications?: Array<{
    classification: DocumentClassification;
    confidence: number;
  }>;
}

/**
 * Document processing operation result
 */
export interface ProcessingResult {
  success: boolean;
  documentId: string;
  status: DocumentStatus;
  message?: string;
  classification?: ClassificationResult;
  extractedMetadata?: Record<string, any>;
}