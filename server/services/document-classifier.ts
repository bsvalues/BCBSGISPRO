/**
 * Document Classification Service
 * 
 * This service handles document classification based on content and metadata
 * using keyword matching and a basic rules engine to determine document types.
 */

import { DocumentType, DocumentClassification, documentTypeKeywords } from '../../shared/document-types';

// Classifies a document based on its name, content type, and optionally extracted content
export async function classifyDocument(fileName: string, contentType: string, content?: string): Promise<DocumentClassification> {
  // Default to UNKNOWN with a lower confidence
  let documentType = DocumentType.UNKNOWN;
  let confidence = 0.3;
  let matchedKeywords: string[] = [];
  
  // Normalize file name and content for matching
  const normalizedFileName = fileName.toLowerCase();
  const normalizedContent = content ? content.toLowerCase() : '';
  
  // Check file extension to determine format-based classification
  if (normalizedFileName.endsWith('.pdf')) {
    // PDFs could be any document type, so we rely more on content
    if (!content) {
      confidence = 0.4; // Slightly higher than unknown, but still uncertain
    }
  } else if (normalizedFileName.match(/\.(docx?|rtf)$/)) {
    // Word documents are often correspondence, legal descriptions, or reports
    if (normalizedFileName.includes('letter') || normalizedFileName.includes('memo')) {
      documentType = DocumentType.CORRESPONDENCE;
      confidence = 0.65;
      matchedKeywords.push('letter', 'memo');
    } else if (normalizedFileName.includes('report')) {
      documentType = DocumentType.STAFF_REPORT;
      confidence = 0.65;
      matchedKeywords.push('report');
    }
  } else if (normalizedFileName.match(/\.(xlsx?|csv)$/)) {
    // Spreadsheets are often tax records or assessments
    documentType = DocumentType.ASSESSMENT;
    confidence = 0.6;
    matchedKeywords.push('spreadsheet');
  } else if (normalizedFileName.match(/\.(jpe?g|png|tiff?)$/)) {
    // Images could be aerial photos or site plans
    if (normalizedFileName.includes('aerial') || normalizedFileName.includes('satellite')) {
      documentType = DocumentType.AERIAL_PHOTO;
      confidence = 0.8;
      matchedKeywords.push('aerial', 'satellite');
    } else {
      documentType = DocumentType.SITE_PLAN;
      confidence = 0.5;
      matchedKeywords.push('image');
    }
  } else if (normalizedFileName.match(/\.(dwg|dxf)$/)) {
    // CAD files are typically surveys or site plans
    documentType = DocumentType.SURVEY;
    confidence = 0.7;
    matchedKeywords.push('cad', 'drawing');
  } else if (normalizedFileName.match(/\.(shp|geojson|kml)$/)) {
    // GIS files are typically maps
    documentType = DocumentType.MAP;
    confidence = 0.8;
    matchedKeywords.push('gis', 'map');
  }
  
  // Enhanced classification based on file name keywords
  for (const [type, keywords] of Object.entries(documentTypeKeywords)) {
    let keywordMatches = 0;
    const uniqueMatchedKeywords: string[] = [];
    
    // Count matches in file name
    for (const keyword of keywords) {
      if (normalizedFileName.includes(keyword.toLowerCase())) {
        keywordMatches++;
        uniqueMatchedKeywords.push(keyword);
      }
    }
    
    // Count matches in content if available
    if (normalizedContent) {
      for (const keyword of keywords) {
        if (normalizedContent.includes(keyword.toLowerCase()) && 
            !uniqueMatchedKeywords.includes(keyword)) {
          keywordMatches++;
          uniqueMatchedKeywords.push(keyword);
        }
      }
    }
    
    // Calculate confidence based on keyword matches
    const matchConfidence = Math.min(0.3 + (keywordMatches * 0.15), 0.9);
    
    // If this type has a higher confidence than current best, update
    if (keywordMatches > 0 && matchConfidence > confidence) {
      documentType = type as DocumentType;
      confidence = matchConfidence;
      matchedKeywords = [...uniqueMatchedKeywords];
    }
  }
  
  // Find alternate classifications with reasonable confidence
  const alternateTypes: { documentType: DocumentType, confidence: number }[] = [];
  
  for (const [type, keywords] of Object.entries(documentTypeKeywords)) {
    // Skip the primary classification type
    if (type === documentType) continue;
    
    let keywordMatches = 0;
    
    // Count matches in file name
    for (const keyword of keywords) {
      if (normalizedFileName.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }
    
    // Count matches in content if available
    if (normalizedContent) {
      for (const keyword of keywords) {
        if (normalizedContent.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }
    }
    
    // Calculate alternate confidence
    const altConfidence = Math.min(0.2 + (keywordMatches * 0.1), 0.65);
    
    // Add to alternate types if confidence is reasonable
    if (keywordMatches > 0 && altConfidence > 0.35) {
      alternateTypes.push({
        documentType: type as DocumentType,
        confidence: altConfidence
      });
    }
  }
  
  // Sort alternate types by confidence (descending)
  alternateTypes.sort((a, b) => b.confidence - a.confidence);
  
  // Return the full classification result
  return {
    documentType,
    confidence,
    alternateTypes: alternateTypes.length > 0 ? alternateTypes.slice(0, 3) : undefined,
    keywords: matchedKeywords.length > 0 ? matchedKeywords : undefined
  };
}

// Function to test classifications based on sample data
export function testClassifications() {
  const sampleFiles = [
    { name: 'deed_of_trust_14653.pdf', type: 'application/pdf' },
    { name: 'plat_map_oak_hills_subdivision.pdf', type: 'application/pdf' },
    { name: 'county_assessment_2023.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { name: 'building_permit_application.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'property_survey_lot15.dwg', type: 'application/acad' },
    { name: 'aerial_imagery_2022.jpg', type: 'image/jpeg' },
    { name: 'board_meeting_minutes_jan2023.pdf', type: 'application/pdf' },
    { name: 'zone_variance_request.pdf', type: 'application/pdf' },
    { name: 'property_tax_statement_20240.pdf', type: 'application/pdf' },
    { name: 'site_plan_proposed_development.pdf', type: 'application/pdf' },
    { name: 'correspondence_re_boundary_dispute.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'property_parcel_map.geojson', type: 'application/geo+json' }
  ];
  
  return Promise.all(sampleFiles.map(async file => {
    const classification = await classifyDocument(file.name, file.type);
    return {
      fileName: file.name,
      classification
    };
  }));
}