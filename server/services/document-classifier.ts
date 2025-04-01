/**
 * Document Classification Service
 * 
 * This service provides machine learning capabilities to classify documents
 * uploaded to the Benton County Assessor's Office GIS system.
 * 
 * Currently implements a rule-based classifier with keyword matching.
 * In a production environment, this would be replaced with a proper ML model.
 */

// Document types supported by the classifier
export enum DocumentType {
  PLAT_MAP = 'plat_map',
  DEED = 'deed',
  SURVEY = 'survey',
  LEGAL_DESCRIPTION = 'legal_description',
  BOUNDARY_LINE_ADJUSTMENT = 'boundary_line_adjustment',
  TAX_FORM = 'tax_form',
  UNCLASSIFIED = 'unclassified'
}

// Document classification result
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
      'plat', 'subdivision', 'lot', 'block', 'boundary', 'tract', 
      'survey', 'map', 'parcel', 'recorded', 'replat'
    ],
    [DocumentType.DEED]: [
      'deed', 'grant', 'convey', 'warranty', 'quitclaim', 'title', 
      'transfer', 'grantor', 'grantee', 'conveyance', 'consideration'
    ],
    [DocumentType.SURVEY]: [
      'survey', 'bearing', 'distance', 'monument', 'coordinate', 
      'surveyor', 'benchmark', 'corner', 'measure', 'elevation', 'topographic'
    ],
    [DocumentType.LEGAL_DESCRIPTION]: [
      'legal description', 'township', 'range', 'section', 'quarter section', 
      'metes and bounds', 'beginning at', 'thence', 'meridian', 'feet', 'acres'
    ],
    [DocumentType.BOUNDARY_LINE_ADJUSTMENT]: [
      'boundary line adjustment', 'boundary line agreement', 'bla', 'lot line adjustment', 
      'property line', 'adjust', 'modification', 'boundary'
    ],
    [DocumentType.TAX_FORM]: [
      'tax', 'assessment', 'property tax', 'levy', 'valuation', 
      'assessed value', 'exemption', 'form', 'treasury', 'payment'
    ],
    [DocumentType.UNCLASSIFIED]: []
  };

  /**
   * Classifies a document based on its text content using keyword matching
   * @param text The text content of the document
   * @returns Classification result with document type and confidence score
   */
  public classify(text: string): ClassificationResult {
    if (!text || text.trim() === '') {
      return {
        documentType: DocumentType.UNCLASSIFIED,
        confidence: 1.0
      };
    }

    const normalizedText = text.toLowerCase();
    const scores: Record<DocumentType, number> = {
      [DocumentType.PLAT_MAP]: 0,
      [DocumentType.DEED]: 0,
      [DocumentType.SURVEY]: 0,
      [DocumentType.LEGAL_DESCRIPTION]: 0,
      [DocumentType.BOUNDARY_LINE_ADJUSTMENT]: 0,
      [DocumentType.TAX_FORM]: 0,
      [DocumentType.UNCLASSIFIED]: 0
    };

    // Calculate keyword match scores for each document type
    const matchedKeywords: string[] = [];
    Object.entries(this.keywordMap).forEach(([docType, keywords]) => {
      const documentType = docType as DocumentType;
      
      if (documentType === DocumentType.UNCLASSIFIED) {
        return;
      }
      
      keywords.forEach(keyword => {
        if (normalizedText.includes(keyword.toLowerCase())) {
          scores[documentType] += 1;
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
          }
        }
      });
    });

    // Find the document type with the highest score
    let maxScore = 0;
    let classifiedType = DocumentType.UNCLASSIFIED;
    
    Object.entries(scores).forEach(([docType, score]) => {
      if (score > maxScore) {
        maxScore = score;
        classifiedType = docType as DocumentType;
      }
    });

    // If no keywords matched, return unclassified
    if (maxScore === 0) {
      return {
        documentType: DocumentType.UNCLASSIFIED,
        confidence: 1.0
      };
    }

    // Calculate confidence based on the number of matching keywords
    // and the total keywords for that document type
    const totalKeywords = this.keywordMap[classifiedType].length;
    const confidence = Math.min(maxScore / (totalKeywords * 0.5), 1.0);

    // Get alternative types (second highest scores)
    const alternativeTypes = Object.entries(scores)
      .filter(([docType]) => docType !== classifiedType && docType !== DocumentType.UNCLASSIFIED)
      .map(([docType, score]) => ({
        documentType: docType as DocumentType,
        confidence: Math.min(score / (this.keywordMap[docType as DocumentType].length * 0.5), 1.0)
      }))
      .filter(alt => alt.confidence > 0.2) // Only include alternatives with confidence > 20%
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2); // Return top 2 alternatives

    return {
      documentType: classifiedType,
      confidence,
      alternativeTypes: alternativeTypes.length > 0 ? alternativeTypes : undefined,
      keywords: matchedKeywords.length > 0 ? matchedKeywords : undefined
    };
  }

  /**
   * Gets a human-readable label for a document type
   * @param documentType The document type enum value
   * @returns Human-readable label
   */
  public getDocumentTypeLabel(documentType: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      [DocumentType.PLAT_MAP]: 'Plat Map',
      [DocumentType.DEED]: 'Deed',
      [DocumentType.SURVEY]: 'Survey',
      [DocumentType.LEGAL_DESCRIPTION]: 'Legal Description',
      [DocumentType.BOUNDARY_LINE_ADJUSTMENT]: 'Boundary Line Adjustment',
      [DocumentType.TAX_FORM]: 'Tax Form',
      [DocumentType.UNCLASSIFIED]: 'Unclassified Document'
    };
    
    return labels[documentType] || 'Unknown Document Type';
  }
}

// Create a singleton instance of the classifier
const classifier = new RuleBasedClassifier();

/**
 * Classifies a document based on its text content
 * @param text The text content of the document
 * @returns Classification result with document type and confidence score
 */
export function classifyDocument(text: string): ClassificationResult {
  return classifier.classify(text);
}

/**
 * Gets a human-readable label for a document type
 * @param documentType The document type enum value
 * @returns Human-readable label
 */
export function getDocumentTypeLabel(documentType: DocumentType): string {
  return classifier.getDocumentTypeLabel(documentType);
}