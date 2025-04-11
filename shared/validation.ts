import { z } from 'zod';
import { insertWorkflowSchema, insertWorkflowStateSchema, insertWorkflowEventSchema, insertChecklistItemSchema } from './schema';

// Enhanced data validation schemas with WA state regulation compliance

/**
 * Enhanced workflow validation schema with additional validation rules
 * Ensures data quality and regulatory compliance
 */
export const enhancedWorkflowSchema = insertWorkflowSchema.extend({
  // Validate workflow type according to Benton County requirements
  type: z.enum([
    'PARCEL_SPLIT', 
    'PROPERTY_TRANSFER', 
    'LONG_PLAT', 
    'SHORT_PLAT', 
    'BOUNDARY_LINE_ADJUSTMENT',
    'PROPERTY_APPEAL',
    'VALUATION_REVIEW',
    'EXEMPTION_APPLICATION',
    'TAX_DEFERRAL',
    'SENIOR_EXEMPTION'
  ], {
    errorMap: () => ({ message: 'Workflow type must be a valid Benton County workflow type' })
  }),
  
  // Validate status according to workflow process
  status: z.enum([
    'DRAFT', 
    'SUBMITTED', 
    'IN_REVIEW', 
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
    'CANCELLED',
    'ON_HOLD'
  ], {
    errorMap: () => ({ message: 'Workflow status must be valid according to county processes' })
  }),
  
  // Enhanced priority validation
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'Priority must be one of: LOW, NORMAL, HIGH, URGENT' })
  }),
  
  // Title must be descriptive
  title: z.string().min(5, 'Title must be at least 5 characters').max(100)
    .refine((val) => !val.includes('test'), 'Production workflows cannot include "test" in the title'),
  
  // Due date must be in the future when provided
  dueDate: z.date().nullable().refine(
    (date) => date === null || date > new Date(), 
    'Due date must be in the future'
  ).optional()
});

/**
 * Enhanced workflow state validation
 */
export const enhancedWorkflowStateSchema = insertWorkflowStateSchema.extend({
  // Ensure form data has required fields based on workflow type
  formData: z.record(z.any()).refine(
    (data) => {
      // Common validation - ensure data isn't empty
      return Object.keys(data).length > 0;
    },
    {
      message: 'Form data cannot be empty'
    }
  )
});

/**
 * Enhanced workflow event validation with audit requirements
 */
export const enhancedWorkflowEventSchema = insertWorkflowEventSchema.extend({
  eventType: z.enum([
    'CREATED',
    'UPDATED',
    'STATUS_CHANGED',
    'DOCUMENT_ADDED',
    'DOCUMENT_REMOVED',
    'COMMENT_ADDED',
    'ASSIGNED',
    'REASSIGNED',
    'PRIORITY_CHANGED',
    'CHECKLIST_UPDATED',
    'DUE_DATE_CHANGED',
    'APPROVAL_REQUESTED',
    'APPROVED',
    'REJECTED'
  ], {
    errorMap: () => ({ message: 'Event type must be a valid workflow event type' })
  }),
  
  // Ensure descriptions are meaningful
  description: z.string().min(5, 'Description must be at least 5 characters')
});

/**
 * Enhanced checklist item validation
 */
export const enhancedChecklistItemSchema = insertChecklistItemSchema.extend({
  title: z.string().min(3, 'Checklist item title must be at least 3 characters')
    .max(100, 'Checklist item title cannot exceed 100 characters'),
  
  // Order must be positive
  order: z.number().int().positive('Order must be a positive integer')
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
    securityLevel: 'PUBLIC' as const
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