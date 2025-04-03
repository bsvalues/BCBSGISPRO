import { DocumentType } from '@shared/document-types';

// Export the utility function to use in routes
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    [DocumentType.PLAT_MAP]: 'Plat Map',
    [DocumentType.DEED]: 'Deed',
    [DocumentType.SURVEY]: 'Survey',
    [DocumentType.LEGAL_DESCRIPTION]: 'Legal Description',
    [DocumentType.BOUNDARY_LINE_ADJUSTMENT]: 'Boundary Line Adjustment',
    [DocumentType.TAX_FORM]: 'Tax Form',
    [DocumentType.UNCLASSIFIED]: 'Unclassified Document'
  };
  
  return labels[type] || 'Unknown Document Type';
}

/**
 * Result of document classification operation
 */
export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  alternativeTypes?: Array<{
    documentType: DocumentType;
    confidence: number;
  }>;
  keywords?: string[];
}

/**
 * Rule-based classifier that uses keyword matching to determine document types.
 * This serves as a placeholder for a more sophisticated ML model in production.
 */
class RuleBasedClassifier {
  private keywordMap: Record<DocumentType, string[]> = {
    [DocumentType.PLAT_MAP]: [
      'plat', 'parcel map', 'subdivision', 'lot', 'tract', 'survey map',
      'recorded map', 'property boundary', 'lot line', 'easement'
    ],
    [DocumentType.DEED]: [
      'deed', 'grant deed', 'quitclaim', 'warranty deed', 'convey', 'conveyance',
      'transfer ownership', 'property transfer', 'title', 'grantor', 'grantee'
    ],
    [DocumentType.SURVEY]: [
      'survey', 'boundary survey', 'topographic', 'land survey', 'metes and bounds',
      'monument', 'benchmark', 'elevation', 'ALTA survey'
    ],
    [DocumentType.LEGAL_DESCRIPTION]: [
      'legal description', 'described as', 'metes and bounds', 'section township range',
      'point of beginning', 'thence', 'feet', 'acres', 'situated in', 'together with'
    ],
    [DocumentType.BOUNDARY_LINE_ADJUSTMENT]: [
      'boundary line adjustment', 'BLA', 'lot line adjustment', 'property line adjustment', 
      'adjust boundary', 'modified boundary', 'boundary change', 'boundary revision'
    ],
    [DocumentType.TAX_FORM]: [
      'tax', 'assessment', 'excise tax', 'property tax', 'tax parcel', 'tax statement',
      'assessed value', 'tax exemption', 'tax roll', 'taxable value'
    ],
    [DocumentType.UNCLASSIFIED]: []  // Default category has no keywords
  };

  /**
   * Classifies a document based on its text content using keyword matching
   * @param text The text content of the document
   * @returns Classification result with document type and confidence score
   */
  public classify(text: string): ClassificationResult {
    const normalizedText = text.toLowerCase();
    const scores: Record<DocumentType, number> = {
      [DocumentType.PLAT_MAP]: 0,
      [DocumentType.DEED]: 0,
      [DocumentType.SURVEY]: 0,
      [DocumentType.LEGAL_DESCRIPTION]: 0,
      [DocumentType.BOUNDARY_LINE_ADJUSTMENT]: 0,
      [DocumentType.TAX_FORM]: 0,
      [DocumentType.UNCLASSIFIED]: 0.1 // Small base score for unclassified
    };
    
    let matchedKeywords: string[] = [];
    
    // Count keyword occurrences for each document type
    Object.entries(this.keywordMap).forEach(([docType, keywords]) => {
      keywords.forEach(keyword => {
        // Count occurrences of the keyword in the text
        const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
        const matches = normalizedText.match(regex);
        if (matches) {
          const typeScore = matches.length * 0.1; // Adjust weight here
          scores[docType as DocumentType] += typeScore;
          matchedKeywords.push(keyword);
        }
      });
    });
    
    // Get total score
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    // Normalize scores to get confidence values
    const normalizedScores = Object.entries(scores).map(([docType, score]) => ({
      documentType: docType as DocumentType,
      confidence: totalScore > 0 ? score / totalScore : score
    }));
    
    // Sort by confidence
    normalizedScores.sort((a, b) => b.confidence - a.confidence);
    
    // The highest confidence type is the primary classification
    const primaryClassification = normalizedScores[0];
    
    // If confidence is very low, use unclassified
    if (primaryClassification.confidence < 0.4 && 
        primaryClassification.documentType !== DocumentType.UNCLASSIFIED) {
      return {
        documentType: DocumentType.UNCLASSIFIED,
        confidence: 0.5,
        alternativeTypes: normalizedScores.slice(0, 3),
        keywords: [...new Set(matchedKeywords)]
      };
    }
    
    return {
      documentType: primaryClassification.documentType,
      confidence: primaryClassification.confidence,
      alternativeTypes: normalizedScores.slice(1, 4), // Next 3 alternatives
      keywords: [...new Set(matchedKeywords)]
    };
  }
}

// Create a singleton instance of the classifier
const classifier = new RuleBasedClassifier();

/**
 * Classifies a document based on its text content and metadata
 * @param content The text content of the document
 * @param fileType The MIME type or file extension of the document
 * @param fileName Optional file name which may contain clues about document type
 * @returns Classification result with document type and confidence score
 */
export async function classifyDocument(
  content: string,
  fileType?: string,
  fileName?: string
): Promise<ClassificationResult & { wasManuallyClassified: boolean, classifiedAt: string }> {
  // Combine content with filename for better classification
  let combinedText = content;
  if (fileName) {
    combinedText += ` ${fileName}`;
  }
  
  // Enhance classification based on file type
  let baseClassification = classifier.classify(combinedText);
  
  // Adjust confidence based on file type
  if (fileType) {
    const lowerFileType = fileType.toLowerCase();
    
    // PDFs are more likely to be official documents
    if (lowerFileType.includes('pdf')) {
      if (baseClassification.documentType !== DocumentType.UNCLASSIFIED) {
        baseClassification.confidence = Math.min(baseClassification.confidence * 1.2, 1.0);
      }
    }
    
    // Image files are more likely to be plat maps or surveys
    if (lowerFileType.includes('image') || 
        lowerFileType.includes('jpg') || 
        lowerFileType.includes('png') || 
        lowerFileType.includes('tiff')) {
      if (baseClassification.documentType === DocumentType.PLAT_MAP ||
          baseClassification.documentType === DocumentType.SURVEY) {
        baseClassification.confidence = Math.min(baseClassification.confidence * 1.2, 1.0);
      }
    }
  }
  
  // Add additional metadata for the API response
  return {
    ...baseClassification,
    wasManuallyClassified: false,
    classifiedAt: new Date().toISOString()
  };
}