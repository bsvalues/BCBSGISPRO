import { FileText, FileImage, FileArchive, Map, File, FileCog, FileCheck, FileHeart, BookCopy, Upload, FileCode } from 'lucide-react';

/**
 * Returns the appropriate icon component based on document type
 */
export function getDocumentTypeIcon(documentType: string) {
  switch (documentType) {
    case 'deed':
      return FileCheck;
    case 'plat':
      return Map;
    case 'survey':
      return FileImage;
    case 'boundary_line_adjustment':
      return FileCog;
    case 'legal_document':
      return BookCopy;
    case 'report':
      return FileText;
    case 'image':
      return FileImage;
    case 'application':
      return FileCode;
    case 'permit':
      return FileHeart;
    case 'archive':
      return FileArchive;
    default:
      return File;
  }
}

/**
 * Returns a human-readable label for document type
 */
export function getDocumentTypeLabel(documentType: string): string {
  // Replace underscores with spaces and capitalize first letter of each word
  return documentType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Determines the color for a document type
 */
export function getDocumentTypeColor(documentType: string): string {
  switch (documentType) {
    case 'deed':
      return 'green';
    case 'plat':
      return 'blue';
    case 'survey':
      return 'purple';
    case 'boundary_line_adjustment':
      return 'orange';
    case 'legal_document':
      return 'red';
    case 'report':
      return 'indigo';
    case 'image':
      return 'sky';
    case 'application':
      return 'amber';
    case 'permit':
      return 'pink';
    case 'archive':
      return 'gray';
    default:
      return 'slate';
  }
}

/**
 * Formats document file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Determines if file is an image based on content type
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith('image/');
}

/**
 * Determines if file is a PDF based on content type
 */
export function isPdfFile(contentType: string): boolean {
  return contentType === 'application/pdf';
}

/**
 * Extracts file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}