import { 
  FileText, 
  Map, 
  FileImage, 
  FileSpreadsheet, 
  FilePieChart, 
  FileArchive,
  File,
  LucideIcon
} from 'lucide-react';

/**
 * Returns the appropriate Lucide icon for a given document type
 */
export function getDocumentTypeIcon(type: string): LucideIcon {
  switch (type.toLowerCase()) {
    case 'deed':
    case 'contract':
    case 'agreement':
    case 'legal_document':
      return FileText;
    case 'map':
    case 'plat':
    case 'survey':
    case 'boundary_line_adjustment':
    case 'bla':
      return Map;
    case 'photo':
    case 'image':
      return FileImage;
    case 'spreadsheet':
    case 'data':
    case 'assessment':
      return FileSpreadsheet;
    case 'report':
    case 'sm00_report':
      return FilePieChart;
    case 'archive':
    case 'collection':
      return FileArchive;
    default:
      return File;
  }
}

/**
 * Returns a color class for a document type
 */
export function getDocumentTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'deed':
    case 'contract':
    case 'agreement':
    case 'legal_document':
      return 'bg-blue-500';
    case 'map':
    case 'plat':
    case 'survey':
    case 'boundary_line_adjustment':
    case 'bla':
      return 'bg-emerald-500';
    case 'photo':
    case 'image':
      return 'bg-purple-500';
    case 'spreadsheet':
    case 'data':
    case 'assessment':
      return 'bg-amber-500';
    case 'report':
    case 'sm00_report':
      return 'bg-indigo-500';
    case 'archive':
    case 'collection':
      return 'bg-slate-500';
    default:
      return 'bg-slate-400';
  }
}

/**
 * Returns a user-friendly label for a document type
 */
export function getDocumentTypeLabel(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}