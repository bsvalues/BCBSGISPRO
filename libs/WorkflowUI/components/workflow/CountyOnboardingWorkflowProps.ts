/**
 * CountyOnboardingWorkflow Props Interface
 * 
 * This file defines the prop interface for the CountyOnboardingWorkflow component,
 * using the standardized types from the shared types library.
 */

import { County, GISDataSource, ValuationSystem, TaxSystem, DataAccess } from '../../../../libs/types';

/**
 * Onboarding step type
 */
export type OnboardingStep = 
  | 'county-info' 
  | 'contacts' 
  | 'gis-data' 
  | 'valuation-system' 
  | 'tax-system' 
  | 'data-access' 
  | 'validation' 
  | 'confirmation';

/**
 * Onboarding step status
 */
export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'error' | 'skipped';

/**
 * Props for the CountyOnboardingWorkflow component
 */
export interface CountyOnboardingWorkflowProps {
  // Initial county data (if editing)
  initialCounty?: County;
  
  // Current active step
  activeStep?: OnboardingStep;
  
  // Status of each step
  stepStatus?: Record<OnboardingStep, StepStatus>;
  
  // Whether steps can be skipped
  allowSkipSteps?: boolean;
  
  // Whether to allow going back to previous steps
  allowBackNavigation?: boolean;
  
  // Whether the workflow is in a loading state
  isLoading?: boolean;
  
  // Error message to display (if any)
  error?: string;
  
  // Event handlers
  onStepChange?: (step: OnboardingStep) => void;
  onCountyInfoUpdate?: (countyInfo: Partial<County>) => void;
  onContactsUpdate?: (contacts: County['contacts']) => void;
  onGISDataUpdate?: (gisData: GISDataSource[]) => void;
  onValuationSystemUpdate?: (valuationSystem: ValuationSystem) => void;
  onTaxSystemUpdate?: (taxSystem: TaxSystem) => void;
  onDataAccessUpdate?: (dataAccess: DataAccess) => void;
  onValidate?: () => Promise<boolean>;
  onComplete?: (county: County) => void;
  onCancel?: () => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}