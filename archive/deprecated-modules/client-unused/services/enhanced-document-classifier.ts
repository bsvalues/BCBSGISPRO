/**
 * Enhanced Document Classification Service
 * 
 * This service provides advanced document classification capabilities using both
 * keyword-based classification and machine learning approaches.
 */

import { DocumentType, DocumentClassification } from '@shared/document-types';
import { apiRequest } from '@/lib/queryClient';

/**
 * Classification result with confidence scores
 */
export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  alternateTypes?: {
    documentType: DocumentType;
    confidence: number;
  }[];
  keywords?: string[];
  metadata?: Record<string, any>;
  parcelReferences?: string[];
}

/**
 * Document content for classification
 */
export interface DocumentContent {
  text: string;
  title?: string;
  fileType?: string;
  metadata?: Record<string, any>;
}

/**
 * Enhanced document classifier that combines rule-based and machine learning
 * approaches for high-accuracy document type detection.
 */
export class EnhancedDocumentClassifier {
  // Keyword sets for document types
  private keywordSets: Record<DocumentType, string[]> = {
    [DocumentType.DEED]: [
      'deed', 'convey', 'grantor', 'grantee', 'conveyance', 
      'transfer', 'legal description', 'property', 'real estate', 
      'warranty', 'quitclaim', 'special warranty'
    ],
    [DocumentType.TITLE]: [
      'title', 'certificate', 'ownership', 'property', 'abstract', 
      'chain of title', 'title insurance', 'title report', 'vesting'
    ],
    [DocumentType.ASSESSMENT]: [
      'assessment', 'value', 'appraisal', 'appraised', 'tax', 
      'valuation', 'assessed', 'improvement', 'land value', 
      'property value', 'market value'
    ],
    [DocumentType.TAX_RECORD]: [
      'tax', 'property tax', 'payment', 'levy', 'exemption', 
      'tax bill', 'tax payment', 'tax year', 'delinquent', 
      'treasurer', 'assessment roll'
    ],
    [DocumentType.SURVEY]: [
      'survey', 'surveyor', 'boundary', 'monument', 'measure', 
      'plss', 'benchmark', 'topographic', 'elevation', 
      'metes and bounds', 'legal description'
    ],
    [DocumentType.PLAT]: [
      'plat', 'subdivision', 'lot', 'block', 'tract', 
      'dedicated', 'easement', 'right-of-way', 'map', 
      'record of survey', 'corner'
    ],
    [DocumentType.LEGAL_DESCRIPTION]: [
      'legal description', 'metes and bounds', 'section', 'township', 
      'range', 'parcel', 'lot', 'block', 'tract', 'subdivision', 
      'aliquot', 'quarter', 'government lot'
    ],
    [DocumentType.BOUNDARY_ADJUSTMENT]: [
      'boundary', 'adjustment', 'line', 'lot line', 'property line', 
      'record of survey', 'legal description', 'description', 
      'bla', 'boundary line agreement'
    ],
    [DocumentType.BUILDING_PERMIT]: [
      'permit', 'building', 'construction', 'approval', 'inspection', 
      'building code', 'occupancy', 'zoning', 'compliance', 'plans'
    ],
    [DocumentType.ZONING_PERMIT]: [
      'zoning', 'permit', 'variance', 'conditional use', 'special use', 
      'land use', 'planning', 'code', 'compliance', 'ordinance'
    ],
    [DocumentType.VARIANCE_APPLICATION]: [
      'variance', 'application', 'hardship', 'zoning board', 'appeal', 
      'setback', 'deviation', 'exception', 'public hearing', 'approval'
    ],
    [DocumentType.LAND_USE_APPLICATION]: [
      'land use', 'application', 'development', 'planning', 'zoning', 
      'proposed', 'change of use', 'site plan', 'project', 'review'
    ],
    [DocumentType.CORRESPONDENCE]: [
      'letter', 'correspondence', 'memo', 'regarding', 're:', 
      'subject:', 'attention:', 'response', 'inquiry', 'request'
    ],
    [DocumentType.MEETING_MINUTES]: [
      'minutes', 'meeting', 'board', 'commission', 'council', 
      'attendees', 'present', 'discussion', 'vote', 'action items'
    ],
    [DocumentType.STAFF_REPORT]: [
      'staff', 'report', 'analysis', 'recommendation', 'findings', 
      'prepared by', 'department', 'review', 'evaluation', 'conclusion'
    ],
    [DocumentType.NOTIFICATION]: [
      'notice', 'notification', 'inform', 'advise', 'public notice', 
      'hearing', 'meeting', 'deadline', 'requirement', 'response required'
    ],
    [DocumentType.MAP]: [
      'map', 'cartography', 'display', 'gis', 'geographic', 
      'spatial', 'features', 'layout', 'legend', 'scale'
    ],
    [DocumentType.AERIAL_PHOTO]: [
      'aerial', 'photo', 'imagery', 'photograph', 'orthophoto', 
      'satellite', 'ortho', 'image', 'flight', 'photography'
    ],
    [DocumentType.SITE_PLAN]: [
      'site plan', 'development plan', 'proposed', 'layout', 'building', 
      'structure', 'improvements', 'parking', 'landscape', 'utilities'
    ],
    [DocumentType.ELEVATION_DRAWING]: [
      'elevation', 'drawing', 'architectural', 'facade', 'design', 
      'building', 'structure', 'height', 'exterior', 'view'
    ],
    [DocumentType.OTHER]: [
      'miscellaneous', 'other', 'additional', 'supplemental'
    ],
    [DocumentType.UNKNOWN]: []
  };

  /**
   * Classify a document based on its content
   * 
   * @param content Document content for classification
   * @returns Classification result with confidence score
   */
  async classifyDocument(content: DocumentContent): Promise<ClassificationResult> {
    // First, try rule-based classification
    const ruleBasedResult = this.performRuleBasedClassification(content);
    
    // If high confidence with rule-based, just return that
    if (ruleBasedResult.confidence > 0.8) {
      return ruleBasedResult;
    }
    
    // Otherwise, enhance with ML classification from server
    try {
      const mlResult = await this.performMLClassification(content);
      
      // Combine the results
      return this.combineClassificationResults(ruleBasedResult, mlResult);
    } catch (error) {
      console.error('ML classification error:', error);
      // Fall back to rule-based if ML fails
      return ruleBasedResult;
    }
  }
  
  /**
   * Classify multiple documents in batch
   * 
   * @param documents Array of document contents
   * @returns Array of classification results
   */
  async batchClassifyDocuments(documents: DocumentContent[]): Promise<ClassificationResult[]> {
    try {
      const response = await apiRequest('POST', '/api/documents/classify-batch', { documents });
      return response;
    } catch (error) {
      console.error('Batch classification error:', error);
      
      // Fall back to individual classification
      const results: ClassificationResult[] = [];
      for (const doc of documents) {
        results.push(await this.classifyDocument(doc));
      }
      return results;
    }
  }
  
  /**
   * Extract parcel references from document content
   * 
   * @param content Document content
   * @returns Array of parcel numbers referenced in the document
   */
  async extractParcelReferences(content: DocumentContent): Promise<string[]> {
    try {
      const response = await apiRequest('POST', '/api/documents/extract-parcels', { content: content.text });
      return response.parcels || [];
    } catch (error) {
      console.error('Parcel extraction error:', error);
      return [];
    }
  }
  
  /**
   * Find similar documents based on content comparison
   * 
   * @param content Document content to find similar documents for
   * @param limit Maximum number of similar documents to return
   * @returns Array of similar document references
   */
  async findSimilarDocuments(content: DocumentContent, limit = 5): Promise<any[]> {
    try {
      const response = await apiRequest('POST', '/api/documents/find-similar', { 
        content: content.text,
        limit
      });
      return response.similarDocuments || [];
    } catch (error) {
      console.error('Similar documents search error:', error);
      return [];
    }
  }
  
  /**
   * Perform rule-based classification using keyword matching
   * 
   * @param content Document content
   * @returns Classification result
   */
  private performRuleBasedClassification(content: DocumentContent): ClassificationResult {
    const text = (content.text || '').toLowerCase();
    const title = (content.title || '').toLowerCase();
    const combinedText = `${title} ${text}`;
    
    // Calculate scores for each document type based on keyword matches
    const scores: Record<DocumentType, { score: number; matchedKeywords: string[] }> = {} as any;
    
    for (const [docType, keywords] of Object.entries(this.keywordSets)) {
      const matchedKeywords: string[] = [];
      let score = 0;
      
      for (const keyword of keywords) {
        // If the keyword is found in the title, it's a stronger match
        if (title.includes(keyword.toLowerCase())) {
          score += 3;
          matchedKeywords.push(keyword);
        }
        // If found in the body text
        else if (text.includes(keyword.toLowerCase())) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      }
      
      // Normalize score based on the number of keywords
      const normalizedScore = keywords.length > 0 ? score / (keywords.length * 3) : 0;
      
      scores[docType as DocumentType] = {
        score: normalizedScore,
        matchedKeywords
      };
    }
    
    // Find the document type with the highest score
    let maxScore = 0;
    let bestMatch = DocumentType.UNKNOWN;
    
    for (const [docType, { score }] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestMatch = docType as DocumentType;
      }
    }
    
    // Find alternate types (next highest scores)
    const alternates = Object.entries(scores)
      .filter(([docType]) => docType !== bestMatch)
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 3)
      .map(([docType, { score }]) => ({
        documentType: docType as DocumentType,
        confidence: Math.min(score, 0.95)
      }))
      .filter(alt => alt.confidence > 0.2);
    
    // Return classification result
    return {
      documentType: bestMatch,
      confidence: Math.min(maxScore, 0.95),
      alternateTypes: alternates,
      keywords: scores[bestMatch]?.matchedKeywords || []
    };
  }
  
  /**
   * Perform machine learning classification using the server
   * 
   * @param content Document content
   * @returns Classification result from ML service
   */
  private async performMLClassification(content: DocumentContent): Promise<ClassificationResult> {
    const response = await apiRequest('POST', '/api/documents/classify-ml', { content });
    return response;
  }
  
  /**
   * Combine rule-based and ML classification results
   * 
   * @param ruleBasedResult Result from rule-based classification
   * @param mlResult Result from ML classification
   * @returns Combined classification result
   */
  private combineClassificationResults(
    ruleBasedResult: ClassificationResult, 
    mlResult: ClassificationResult
  ): ClassificationResult {
    // If both methods agree on the document type, boost confidence
    if (ruleBasedResult.documentType === mlResult.documentType) {
      return {
        documentType: ruleBasedResult.documentType,
        confidence: Math.min(0.98, (ruleBasedResult.confidence + mlResult.confidence) / 2 + 0.1),
        alternateTypes: ruleBasedResult.alternateTypes,
        keywords: ruleBasedResult.keywords,
        metadata: mlResult.metadata
      };
    }
    
    // If the ML classification has higher confidence, prefer it
    if (mlResult.confidence > ruleBasedResult.confidence + 0.1) {
      return {
        ...mlResult,
        alternateTypes: [
          ...(mlResult.alternateTypes || []),
          { documentType: ruleBasedResult.documentType, confidence: ruleBasedResult.confidence }
        ].sort((a, b) => b.confidence - a.confidence).slice(0, 3)
      };
    }
    
    // Otherwise, prefer rule-based but add ML as an alternate
    return {
      ...ruleBasedResult,
      alternateTypes: [
        ...(ruleBasedResult.alternateTypes || []),
        { documentType: mlResult.documentType, confidence: mlResult.confidence }
      ].sort((a, b) => b.confidence - a.confidence).slice(0, 3),
      metadata: mlResult.metadata
    };
  }
}

// Export a singleton instance
export const enhancedDocumentClassifier = new EnhancedDocumentClassifier();
export default enhancedDocumentClassifier;