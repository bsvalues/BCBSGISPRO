import { z } from 'zod';

// Benton County Map Element validation schemas

/**
 * Map element validation schema
 */
export const mapElementSchema = z.object({
  elementId: z.string().min(3).max(50),
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  category: z.string().min(3).max(50),
  importance: z.enum(['high', 'medium', 'low']),
  bentonCountyUsage: z.string().min(10),
  bentonCountyExample: z.string().optional(),
  sortOrder: z.number().int().positive()
});

/**
 * Map evaluation validation schema
 */
export const mapEvaluationSchema = z.object({
  mapDescription: z.string().min(10, 'Map description must be at least 10 characters'),
  mapPurpose: z.string().min(10, 'Map purpose must be at least 10 characters'),
  mapContext: z.string().optional(),
  overallScore: z.number().int().min(0).max(100),
  aiRecommendations: z.string()
});

/**
 * Element evaluation validation schema
 */
export const elementEvaluationSchema = z.object({
  mapEvaluationId: z.number().int().positive(),
  elementId: z.string().min(3).max(50),
  implementationStatus: z.enum(['implemented', 'partial', 'missing']),
  aiTips: z.string().optional()
});

/**
 * Benton County Map validation schema
 */
export const bentonCountyMapSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().optional(),
  purpose: z.string().min(10),
  creator: z.string().optional(),
  department: z.string().optional(),
  userId: z.number().int().positive().optional(),
  isPublic: z.boolean().default(false),
  mapUrl: z.string().url().optional()
});

/**
 * Validates workflow data against Washington State assessment standards
 */
export function validateWorkflowCompliance(workflowData: any, type: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Different validation rules based on workflow type
  switch (type.toUpperCase()) {
    case 'PROPERTY_APPEAL':
      // Check for required appeal documentation
      if (!workflowData.appealReason) {
        issues.push('Appeal workflows require a documented appeal reason');
      }
      if (!workflowData.evidenceDocuments || workflowData.evidenceDocuments.length === 0) {
        issues.push('Appeal workflows require at least one supporting evidence document');
      }
      break;
      
    case 'VALUATION_REVIEW':
      // Check for valuation compliance factors
      if (!workflowData.assessedValue) {
        issues.push('Valuation review requires a documented assessed value');
      }
      if (!workflowData.marketValue) {
        issues.push('Valuation review requires a documented market value');
      }
      break;
      
    case 'EXEMPTION_APPLICATION':
      // Verify exemption eligibility documentation
      if (!workflowData.exemptionCategory) {
        issues.push('Exemption applications require a specified exemption category');
      }
      if (!workflowData.eligibilityDocuments || workflowData.eligibilityDocuments.length === 0) {
        issues.push('Exemption applications require supporting eligibility documentation');
      }
      break;
      
    case 'PARCEL_SPLIT':
    case 'BOUNDARY_LINE_ADJUSTMENT':
      // Verify spatial integrity
      if (!workflowData.surveyDocument) {
        issues.push('Boundary adjustments require a registered survey document');
      }
      if (!workflowData.legalDescription) {
        issues.push('Legal description is required for property boundary changes');
      }
      break;
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validates that a document meets Washington State records retention requirements
 */
export function validateDocumentRetention(documentType: string): { 
  retentionPeriod: number; // in years
  requiresNotarization: boolean;
  requiresRecording: boolean;
  securityLevel: 'PUBLIC' | 'PROTECTED' | 'CONFIDENTIAL'
} {
  // Default values
  const result = {
    retentionPeriod: 7, // 7 years default
    requiresNotarization: false,
    requiresRecording: false,
    securityLevel: 'PUBLIC' as 'PUBLIC' | 'PROTECTED' | 'CONFIDENTIAL'
  };
  
  switch (documentType.toUpperCase()) {
    case 'DEED':
    case 'PLAT':
    case 'COVENANT':
      result.retentionPeriod = 999; // Permanent retention
      result.requiresNotarization = true;
      result.requiresRecording = true;
      break;
      
    case 'SURVEY':
    case 'EASEMENT':
      result.retentionPeriod = 999; // Permanent retention
      result.requiresRecording = true;
      break;
      
    case 'TAX_RECORD':
    case 'ASSESSMENT':
      result.retentionPeriod = 10; // 10 years
      result.securityLevel = 'PROTECTED';
      break;
      
    case 'LEGAL_DESCRIPTION':
      result.retentionPeriod = 999; // Permanent retention
      break;
      
    case 'PERMIT':
      result.retentionPeriod = 15; // 15 years
      break;
      
    case 'CORRESPONDENCE':
      result.retentionPeriod = 3; // 3 years
      break;
      
    case 'COURT_ORDER':
      result.retentionPeriod = 999; // Permanent retention
      result.securityLevel = 'PROTECTED';
      break;
  }
  
  return result;
}

/**
 * Calculates a data quality score for workflows and documents
 * @param data The workflow or document to score
 * @param type The type of data being scored
 * @returns A score from 0-100
 */
export function calculateDataQualityScore(data: any, type: 'WORKFLOW' | 'DOCUMENT'): number {
  let score = 100; // Start with perfect score
  const penalties: number[] = [];
  
  if (type === 'WORKFLOW') {
    // Check for missing required fields
    if (!data.title || data.title.length < 5) penalties.push(10);
    if (!data.description || data.description.length < 10) penalties.push(5);
    
    // Check for data completeness
    if (!data.dueDate) penalties.push(3);
    
    // Check for appropriate documentation
    const documentCount = data.documents?.length || 0;
    if (documentCount === 0) penalties.push(15);
    else if (documentCount < 3) penalties.push(5);
    
  } else if (type === 'DOCUMENT') {
    // Check document metadata
    if (!data.name || data.name.length < 3) penalties.push(10);
    if (!data.type) penalties.push(15);
    
    // Check for content
    if (!data.content || data.content.length === 0) penalties.push(50);
    
    // Check for file size - too small might indicate empty/corrupt document
    if (data.size < 1000) penalties.push(20);
    
    // Check for proper classification
    if (!data.classification) penalties.push(10);
  }
  
  // Calculate final score
  const totalPenalty = penalties.reduce((sum, penalty) => sum + penalty, 0);
  return Math.max(0, score - totalPenalty);
}

/**
 * Generates a compliance report for a workflow
 * @param workflow The workflow to assess
 * @returns A compliance report with findings and recommendations
 */
export function generateComplianceReport(workflow: any): {
  overallCompliance: 'COMPLIANT' | 'NEEDS_REVIEW' | 'NON_COMPLIANT';
  findings: { area: string; status: string; description: string }[];
  recommendations: string[];
} {
  const findings: { area: string; status: string; description: string }[] = [];
  const recommendations: string[] = [];
  
  // Validate documentation
  if (!workflow.documents || workflow.documents.length === 0) {
    findings.push({
      area: 'Documentation',
      status: 'NON_COMPLIANT',
      description: 'Workflow lacks required documentation'
    });
    recommendations.push('Add required supporting documentation to the workflow');
  }
  
  // Validate workflow type-specific compliance
  const complianceCheck = validateWorkflowCompliance(workflow, workflow.type);
  if (!complianceCheck.valid) {
    complianceCheck.issues.forEach(issue => {
      findings.push({
        area: 'Regulatory Compliance',
        status: 'NON_COMPLIANT',
        description: issue
      });
    });
    recommendations.push('Address all regulatory compliance issues before proceeding');
  }
  
  // Validate data quality
  const qualityScore = calculateDataQualityScore(workflow, 'WORKFLOW');
  if (qualityScore < 70) {
    findings.push({
      area: 'Data Quality',
      status: 'NEEDS_REVIEW',
      description: `Data quality score of ${qualityScore} is below acceptable threshold of 70`
    });
    recommendations.push('Improve data completeness and accuracy to enhance quality score');
  }
  
  // Determine overall compliance
  let overallCompliance: 'COMPLIANT' | 'NEEDS_REVIEW' | 'NON_COMPLIANT' = 'COMPLIANT';
  
  if (findings.some(f => f.status === 'NON_COMPLIANT')) {
    overallCompliance = 'NON_COMPLIANT';
  } else if (findings.some(f => f.status === 'NEEDS_REVIEW')) {
    overallCompliance = 'NEEDS_REVIEW';
  }
  
  return {
    overallCompliance,
    findings,
    recommendations
  };
}