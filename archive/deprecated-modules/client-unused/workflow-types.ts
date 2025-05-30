// Workflow related types

export interface Workflow {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  createdBy: number; 
  assignedTo?: number;
  parcelId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
}

export interface WorkflowEvent {
  id: number;
  workflowId: number;
  eventType: string;
  description: string;
  userId: number;
  metadata?: any;
  createdAt: string;
}

export enum WorkflowType {
  PROPERTY_ASSESSMENT = 'property_assessment',
  BOUNDARY_ADJUSTMENT = 'boundary_adjustment',
  LAND_DIVISION = 'land_division',
  CONSTRUCTION_PERMIT = 'construction_permit',
  ZONING_CHANGE = 'zoning_change',
  LEGAL_APPEAL = 'legal_appeal',
  TAX_APPEAL = 'tax_appeal',
  OWNERSHIP_CHANGE = 'ownership_change',
  SPECIAL_ASSESSMENT = 'special_assessment',
  OTHER = 'other'
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum WorkflowPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface WorkflowState {
  id: number;
  workflowId: number;
  currentStep: number;
  totalSteps: number;
  data: any;
  updatedAt: string;
}

export interface ChecklistItem {
  id: number;
  workflowId: number;
  title: string;
  description?: string;
  completed: boolean;
  completedBy?: number;
  completedAt?: string;
  dueDate?: string;
  required: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}