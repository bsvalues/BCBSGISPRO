/**
 * Document Types and Classification
 * 
 * This file defines the document types and classification structures used
 * throughout the Benton County GIS application.
 */

// Document type enum - represents all possible document types in the system
export enum DocumentType {
  // Property documents
  DEED = 'DEED',
  TITLE = 'TITLE',
  ASSESSMENT = 'ASSESSMENT',
  TAX_RECORD = 'TAX_RECORD',
  
  // Survey documents
  SURVEY = 'SURVEY',
  PLAT = 'PLAT',
  LEGAL_DESCRIPTION = 'LEGAL_DESCRIPTION',
  BOUNDARY_ADJUSTMENT = 'BOUNDARY_ADJUSTMENT',
  
  // Permits and applications
  BUILDING_PERMIT = 'BUILDING_PERMIT',
  ZONING_PERMIT = 'ZONING_PERMIT',
  VARIANCE_APPLICATION = 'VARIANCE_APPLICATION',
  LAND_USE_APPLICATION = 'LAND_USE_APPLICATION',
  
  // Administrative documents
  CORRESPONDENCE = 'CORRESPONDENCE',
  MEETING_MINUTES = 'MEETING_MINUTES',
  STAFF_REPORT = 'STAFF_REPORT',
  NOTIFICATION = 'NOTIFICATION',
  
  // Maps and imagery
  MAP = 'MAP',
  AERIAL_PHOTO = 'AERIAL_PHOTO',
  SITE_PLAN = 'SITE_PLAN',
  ELEVATION_DRAWING = 'ELEVATION_DRAWING',
  
  // Miscellaneous
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN'
}

// Document category groupings
export enum DocumentCategory {
  PROPERTY = 'Property',
  SURVEY = 'Survey',
  PERMITS = 'Permits',
  ADMINISTRATIVE = 'Administrative',
  MAPS_IMAGERY = 'Maps & Imagery',
  MISCELLANEOUS = 'Miscellaneous'
}

// Maps document types to their categories
export const documentTypeToCategory: Record<DocumentType, DocumentCategory> = {
  [DocumentType.DEED]: DocumentCategory.PROPERTY,
  [DocumentType.TITLE]: DocumentCategory.PROPERTY,
  [DocumentType.ASSESSMENT]: DocumentCategory.PROPERTY,
  [DocumentType.TAX_RECORD]: DocumentCategory.PROPERTY,
  
  [DocumentType.SURVEY]: DocumentCategory.SURVEY,
  [DocumentType.PLAT]: DocumentCategory.SURVEY,
  [DocumentType.LEGAL_DESCRIPTION]: DocumentCategory.SURVEY,
  [DocumentType.BOUNDARY_ADJUSTMENT]: DocumentCategory.SURVEY,
  
  [DocumentType.BUILDING_PERMIT]: DocumentCategory.PERMITS,
  [DocumentType.ZONING_PERMIT]: DocumentCategory.PERMITS,
  [DocumentType.VARIANCE_APPLICATION]: DocumentCategory.PERMITS,
  [DocumentType.LAND_USE_APPLICATION]: DocumentCategory.PERMITS,
  
  [DocumentType.CORRESPONDENCE]: DocumentCategory.ADMINISTRATIVE,
  [DocumentType.MEETING_MINUTES]: DocumentCategory.ADMINISTRATIVE,
  [DocumentType.STAFF_REPORT]: DocumentCategory.ADMINISTRATIVE,
  [DocumentType.NOTIFICATION]: DocumentCategory.ADMINISTRATIVE,
  
  [DocumentType.MAP]: DocumentCategory.MAPS_IMAGERY,
  [DocumentType.AERIAL_PHOTO]: DocumentCategory.MAPS_IMAGERY,
  [DocumentType.SITE_PLAN]: DocumentCategory.MAPS_IMAGERY,
  [DocumentType.ELEVATION_DRAWING]: DocumentCategory.MAPS_IMAGERY,
  
  [DocumentType.OTHER]: DocumentCategory.MISCELLANEOUS,
  [DocumentType.UNKNOWN]: DocumentCategory.MISCELLANEOUS
};

// Document classification result structure
export interface DocumentClassification {
  documentType: DocumentType;
  confidence: number;   // 0-1 value representing confidence in classification
  alternateTypes?: {    // Optional alternate classifications
    documentType: DocumentType;
    confidence: number;
  }[];
  keywords?: string[];  // Keywords that helped determine the classification
}

// Document file format types
export enum DocumentFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  DOC = 'doc',
  XLS = 'xls',
  XLSX = 'xlsx',
  JPG = 'jpg',
  JPEG = 'jpeg',
  PNG = 'png',
  TIF = 'tif',
  TIFF = 'tiff',
  DWG = 'dwg',
  DXF = 'dxf',
  SHP = 'shp',
  KML = 'kml',
  GEOJSON = 'geojson',
  OTHER = 'other'
}

// Document status in workflow
export enum DocumentStatus {
  DRAFT = 'DRAFT',           // Document is in draft state
  PENDING_REVIEW = 'PENDING_REVIEW', // Awaiting review
  REVIEWED = 'REVIEWED',     // Reviewed but not approved
  APPROVED = 'APPROVED',     // Approved
  REJECTED = 'REJECTED',     // Rejected
  ARCHIVED = 'ARCHIVED'      // Archived/historical
}

// Interface representing the metadata for a document
export interface DocumentMetadata {
  id: string;
  title: string;
  documentType: DocumentType;
  format: DocumentFormat;
  status: DocumentStatus;
  fileSize: number;          // Size in bytes
  uploadDate: Date;
  lastModified: Date;
  parcelId?: string;         // Optional parcel reference
  workflowId?: string;       // Optional workflow reference
  createdBy: string;         // User ID
  tags?: string[];           // Custom tags
  description?: string;      // Optional description
  classification?: DocumentClassification; // Classification data
  versionId?: string;        // Current version ID if versioned
  isLatestVersion: boolean;  // Whether this is the latest version
  path: string;              // Storage path
}

// Interface for document version history
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  createdDate: Date;
  createdBy: string;
  fileSize: number;
  path: string;
  changeDescription?: string;
}

// Document relationship types
export enum DocumentRelationshipType {
  REPLACES = 'REPLACES',     // This document replaces/supersedes another
  SUPPLEMENTS = 'SUPPLEMENTS', // Supplementary document
  REFERS_TO = 'REFERS_TO',   // References another document
  ATTACHMENT = 'ATTACHMENT', // Attachment to another document
  PARENT = 'PARENT',         // Parent document
  CHILD = 'CHILD'            // Child document
}

// Document relationship interface
export interface DocumentRelationship {
  sourceDocumentId: string;
  targetDocumentId: string;
  relationshipType: DocumentRelationshipType;
  description?: string;
  createdDate: Date;
  createdBy: string;
}

// Document parcel relationship
export interface DocumentParcelLink {
  documentId: string;
  parcelId: string;
  linkType: 'PRIMARY' | 'SECONDARY' | 'REFERENCE';
  createdDate: Date;
  createdBy: string;
}

// Get a human-readable label for a document type
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    [DocumentType.DEED]: 'Deed',
    [DocumentType.TITLE]: 'Title',
    [DocumentType.ASSESSMENT]: 'Assessment',
    [DocumentType.TAX_RECORD]: 'Tax Record',
    [DocumentType.SURVEY]: 'Survey',
    [DocumentType.PLAT]: 'Plat',
    [DocumentType.LEGAL_DESCRIPTION]: 'Legal Description',
    [DocumentType.BOUNDARY_ADJUSTMENT]: 'Boundary Adjustment',
    [DocumentType.BUILDING_PERMIT]: 'Building Permit',
    [DocumentType.ZONING_PERMIT]: 'Zoning Permit',
    [DocumentType.VARIANCE_APPLICATION]: 'Variance Application',
    [DocumentType.LAND_USE_APPLICATION]: 'Land Use Application',
    [DocumentType.CORRESPONDENCE]: 'Correspondence',
    [DocumentType.MEETING_MINUTES]: 'Meeting Minutes',
    [DocumentType.STAFF_REPORT]: 'Staff Report',
    [DocumentType.NOTIFICATION]: 'Notification',
    [DocumentType.MAP]: 'Map',
    [DocumentType.AERIAL_PHOTO]: 'Aerial Photo',
    [DocumentType.SITE_PLAN]: 'Site Plan',
    [DocumentType.ELEVATION_DRAWING]: 'Elevation Drawing',
    [DocumentType.OTHER]: 'Other',
    [DocumentType.UNKNOWN]: 'Unknown'
  };
  
  return labels[type] || String(type);
}

// Function to get document category label
export function getDocumentCategoryLabel(category: DocumentCategory): string {
  return category;
}

// Common keywords associated with each document type for classification
export const documentTypeKeywords: Record<DocumentType, string[]> = {
  [DocumentType.DEED]: ['deed', 'warranty', 'quitclaim', 'transfer', 'conveyance', 'grantor', 'grantee', 'ownership'],
  [DocumentType.TITLE]: ['title', 'certificate', 'ownership', 'chain of title', 'abstract'],
  [DocumentType.ASSESSMENT]: ['assessment', 'value', 'appraisal', 'property value', 'assessed value'],
  [DocumentType.TAX_RECORD]: ['tax', 'property tax', 'tax statement', 'tax payment', 'tax record'],
  
  [DocumentType.SURVEY]: ['survey', 'surveyor', 'metes', 'bounds', 'bearings', 'distances'],
  [DocumentType.PLAT]: ['plat', 'subdivision', 'lot', 'block', 'addition', 'recorded plat'],
  [DocumentType.LEGAL_DESCRIPTION]: ['legal description', 'metes and bounds', 'township', 'range', 'section'],
  [DocumentType.BOUNDARY_ADJUSTMENT]: ['boundary', 'adjustment', 'line adjustment', 'property line'],
  
  [DocumentType.BUILDING_PERMIT]: ['building permit', 'construction', 'permit number', 'building code'],
  [DocumentType.ZONING_PERMIT]: ['zoning', 'permit', 'land use', 'zone', 'zoning code'],
  [DocumentType.VARIANCE_APPLICATION]: ['variance', 'application', 'zoning variance', 'exception'],
  [DocumentType.LAND_USE_APPLICATION]: ['land use', 'application', 'change of use', 'development'],
  
  [DocumentType.CORRESPONDENCE]: ['letter', 'correspondence', 'email', 'notice', 'communication'],
  [DocumentType.MEETING_MINUTES]: ['minutes', 'meeting', 'hearing', 'proceedings', 'board meeting'],
  [DocumentType.STAFF_REPORT]: ['staff report', 'analysis', 'recommendation', 'department', 'assessment'],
  [DocumentType.NOTIFICATION]: ['notification', 'notice', 'public notice', 'hearing notice'],
  
  [DocumentType.MAP]: ['map', 'mapping', 'cartography', 'location map', 'vicinity map'],
  [DocumentType.AERIAL_PHOTO]: ['aerial', 'photo', 'imagery', 'satellite', 'orthophotography'],
  [DocumentType.SITE_PLAN]: ['site plan', 'development plan', 'layout', 'proposed development'],
  [DocumentType.ELEVATION_DRAWING]: ['elevation', 'drawing', 'architectural', 'facade', 'building drawing'],
  
  [DocumentType.OTHER]: ['miscellaneous', 'other', 'various', 'additional'],
  [DocumentType.UNKNOWN]: ['unknown', 'unclassified', 'unspecified']
};