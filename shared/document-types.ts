/**
 * Document Types for Benton County GIS System
 * This file defines the document types and related interfaces used throughout the application
 */

/**
 * Enum representing the various document types in the system
 */
export enum DocumentType {
  DEED = 'DEED',
  SURVEY = 'SURVEY',
  PLAT = 'PLAT',
  TAX_RECORD = 'TAX_RECORD',
  PROPERTY_RECORD = 'PROPERTY_RECORD',
  BOUNDARY_ADJUSTMENT = 'BOUNDARY_ADJUSTMENT',
  EASEMENT = 'EASEMENT',
  PERMIT = 'PERMIT',
  ZONING_DOCUMENT = 'ZONING_DOCUMENT',
  ENVIRONMENTAL_RECORD = 'ENVIRONMENTAL_RECORD',
  OTHER = 'OTHER'
}

/**
 * Document classification result
 */
export interface DocumentClassification {
  documentType: DocumentType;
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * Parsed legal description interface
 */
export interface ParsedLegalDescription {
  township: string;
  range: string;
  section: string;
  description: string;
  parcelNumbers?: string[];
  quarter?: string;
}

/**
 * Document version interface
 */
export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  path: string;
  createdBy: number;
  createdAt: Date;
  changes: string | null;
  isActive: boolean;
}

/**
 * Document to parcel link interface
 */
export interface DocumentParcelLink {
  id: number;
  documentId: number;
  parcelId: number;
  linkType: string;
  createdAt: Date;
  createdBy: number | null;
}

/**
 * Gets a human-readable label for a document type
 */
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    [DocumentType.DEED]: 'Deed',
    [DocumentType.SURVEY]: 'Survey',
    [DocumentType.PLAT]: 'Plat',
    [DocumentType.TAX_RECORD]: 'Tax Record',
    [DocumentType.PROPERTY_RECORD]: 'Property Record',
    [DocumentType.BOUNDARY_ADJUSTMENT]: 'Boundary Adjustment',
    [DocumentType.EASEMENT]: 'Easement',
    [DocumentType.PERMIT]: 'Permit',
    [DocumentType.ZONING_DOCUMENT]: 'Zoning Document',
    [DocumentType.ENVIRONMENTAL_RECORD]: 'Environmental Record',
    [DocumentType.OTHER]: 'Other'
  };
  
  return labels[type] || 'Unknown';
}

/**
 * Gets the description for a document type
 */
export function getDocumentTypeDescription(type: DocumentType): string {
  const descriptions: Record<DocumentType, string> = {
    [DocumentType.DEED]: 'Legal document that transfers property ownership',
    [DocumentType.SURVEY]: 'Detailed measurement of land boundaries and features',
    [DocumentType.PLAT]: 'Map showing divisions of a piece of land',
    [DocumentType.TAX_RECORD]: 'Records related to property taxation',
    [DocumentType.PROPERTY_RECORD]: 'Official records related to property',
    [DocumentType.BOUNDARY_ADJUSTMENT]: 'Documents showing changes to property boundaries',
    [DocumentType.EASEMENT]: 'Right to cross or use someone else\'s land',
    [DocumentType.PERMIT]: 'Official permission for land use or development',
    [DocumentType.ZONING_DOCUMENT]: 'Documents related to property zoning regulations',
    [DocumentType.ENVIRONMENTAL_RECORD]: 'Environmental assessments and documentation',
    [DocumentType.OTHER]: 'Other document types'
  };
  
  return descriptions[type] || 'No description available';
}