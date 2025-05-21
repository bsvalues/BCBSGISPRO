/**
 * County Onboarding Workflow Component
 * 
 * This component provides a step-by-step wizard for onboarding new counties
 * into the TerraFusion platform, including data validation, transformation,
 * and integration with existing systems.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check,
  AlertCircle,
  Upload,
  Map,
  Database,
  User,
  Settings,
  ExternalLink,
  HelpCircle,
  Download,
  FileText,
  Layers,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Link, useLocation, useRoute } from 'wouter';

import { logger } from '../../../DevOps/utils/logger';
import { countiesService, County } from '../../../services/counties';
import { parcelsService } from '../../../services/parcels';
import { valuationsService } from '../../../services/valuations';
import { mapLayersService } from '../../../services/layers';

// Create module-specific logger
const workflowLogger = logger.withTags(['WorkflowUI', 'CountyOnboarding']);

/**
 * GIS data source
 */
export interface GISDataSource {
  id: string;
  name: string;
  type: 'shapefile' | 'geojson' | 'gdb' | 'arcgis_service' | 'wms' | 'wfs' | 'other';
  url?: string;
  filePath?: string;
  description?: string;
  lastUpdated?: Date;
  status: 'ready' | 'processing' | 'error' | 'not_started';
  error?: string;
}

/**
 * Valuation system
 */
export interface ValuationSystem {
  id: string;
  name: string;
  type: 'cama' | 'custom' | 'integrated' | 'manual' | 'other';
  url?: string;
  apiKey?: string;
  connectionStatus: 'connected' | 'disconnected' | 'pending' | 'not_configured';
  lastSync?: Date;
}

/**
 * Tax system
 */
export interface TaxSystem {
  id: string;
  name: string;
  type: 'integrated' | 'custom' | 'manual' | 'other';
  url?: string;
  apiKey?: string;
  connectionStatus: 'connected' | 'disconnected' | 'pending' | 'not_configured';
  lastSync?: Date;
}

/**
 * County data access configuration
 */
export interface DataAccess {
  parcelLayers: string[];
  zoningSources: string[];
  dataRefreshSchedule?: 'daily' | 'weekly' | 'monthly' | 'manual';
  dataSecurityLevel: 'public' | 'private' | 'restricted';
  apiAccessEnabled: boolean;
  exportFormats: Array<'shapefile' | 'geojson' | 'csv' | 'pdf'>;
}

/**
 * County configuration
 */
export interface CountyConfig {
  id: string;
  name: string;
  state: string;
  status: 'draft' | 'pending' | 'active' | 'archived';
  createdAt: Date;
  lastUpdated: Date;
  properties: {
    population?: number;
    area?: number;
    parcelCount?: number;
  };
  contacts: Array<{
    name: string;
    role: string;
    email: string;
    phone?: string;
  }>;
  gisDataSources: GISDataSource[];
  valuationSystem?: ValuationSystem;
  taxSystem?: TaxSystem;
  dataAccess?: DataAccess;
  validationIssues: Array<{
    type: 'error' | 'warning';
    message: string;
    component: string;
    resolved: boolean;
  }>;
}

/**
 * County onboarding workflow props
 */
export interface CountyOnboardingWorkflowProps {
  // County configuration (may be partially complete)
  county: CountyConfig;
  
  // Available data sources
  availableDataSources: GISDataSource[];
  
  // Available valuation systems
  availableValuationSystems: ValuationSystem[];
  
  // Available tax systems
  availableTaxSystems: TaxSystem[];
  
  // Event handlers
  onSave: (county: CountyConfig) => Promise<void>;
  onActivate: (countyId: string) => Promise<void>;
  onCancel: () => void;
  onDataSourceTest: (sourceId: string) => Promise<boolean>;
  onValuationSystemTest: (systemId: string) => Promise<boolean>;
  onTaxSystemTest: (systemId: string) => Promise<boolean>;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}

/**
 * County onboarding workflow component
 */
export const CountyOnboardingWorkflow: React.FC<CountyOnboardingWorkflowProps> = ({
  county,
  availableDataSources,
  availableValuationSystems,
  availableTaxSystems,
  onSave,
  onActivate,
  onCancel,
  onDataSourceTest,
  onValuationSystemTest,
  onTaxSystemTest,
  className = '',
  style = {}
}) => {
  // Define workflow steps
  const steps = [
    { id: 'basic', title: 'Basic Information' },
    { id: 'contacts', title: 'Contacts' },
    { id: 'gis', title: 'GIS Data Sources' },
    { id: 'valuation', title: 'Valuation System' },
    { id: 'tax', title: 'Tax System' },
    { id: 'access', title: 'Data Access' },
    { id: 'validation', title: 'Validation' },
    { id: 'activate', title: 'Activation' }
  ];
  
  // State for the current step
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // State for the county configuration
  const [countyData, setCountyData] = useState<CountyConfig>(county);
  
  // State for form validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // State for processing actions
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [testingSource, setTestingSource] = useState<string | null>(null);
  
  // Effect to validate the current step
  useEffect(() => {
    validateCurrentStep();
  }, [currentStep, countyData]);
  
  /**
   * Validate the current step
   */
  const validateCurrentStep = useCallback(() => {
    const errors: Record<string, string> = {};
    const currentStepId = steps[currentStep].id;
    
    switch (currentStepId) {
      case 'basic':
        if (!countyData.name) {
          errors.name = 'County name is required';
        }
        
        if (!countyData.state) {
          errors.state = 'State is required';
        }
        break;
        
      case 'contacts':
        if (!countyData.contacts || countyData.contacts.length === 0) {
          errors.contacts = 'At least one contact is required';
        } else {
          countyData.contacts.forEach((contact, index) => {
            if (!contact.name) {
              errors[`contacts.${index}.name`] = 'Contact name is required';
            }
            
            if (!contact.email) {
              errors[`contacts.${index}.email`] = 'Contact email is required';
            } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(contact.email)) {
              errors[`contacts.${index}.email`] = 'Invalid email address';
            }
            
            if (!contact.role) {
              errors[`contacts.${index}.role`] = 'Contact role is required';
            }
          });
        }
        break;
        
      case 'gis':
        if (!countyData.gisDataSources || countyData.gisDataSources.length === 0) {
          errors.gisDataSources = 'At least one GIS data source is required';
        } else {
          countyData.gisDataSources.forEach((source, index) => {
            if (!source.name) {
              errors[`gisDataSources.${index}.name`] = 'Data source name is required';
            }
            
            if (source.type === 'arcgis_service' || source.type === 'wms' || source.type === 'wfs') {
              if (!source.url) {
                errors[`gisDataSources.${index}.url`] = 'URL is required for this data source type';
              }
            }
          });
        }
        break;
        
      case 'access':
        if (countyData.dataAccess) {
          if (!countyData.dataAccess.parcelLayers || countyData.dataAccess.parcelLayers.length === 0) {
            errors['dataAccess.parcelLayers'] = 'At least one parcel layer is required';
          }
        } else {
          errors.dataAccess = 'Data access configuration is required';
        }
        break;
        
      case 'validation':
        const unresolvedErrors = countyData.validationIssues.filter(
          issue => issue.type === 'error' && !issue.resolved
        );
        
        if (unresolvedErrors.length > 0) {
          errors.validation = `There are ${unresolvedErrors.length} unresolved errors`;
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [countyData, currentStep, steps]);
  
  /**
   * Handle next button click
   */
  const handleNext = useCallback(async () => {
    const isValid = validateCurrentStep();
    
    if (!isValid) {
      return;
    }
    
    if (currentStep < steps.length - 1) {
      // Save progress before advancing
      try {
        setIsSaving(true);
        
        // Convert CountyConfig to API County format
        const apiCounty: Partial<County> = {
          id: countyData.id,
          name: countyData.name,
          state: countyData.state,
          population: countyData.properties?.population,
          area: countyData.properties?.area,
          gisEnabled: true,
          contact: countyData.contacts?.length > 0 ? 
            countyData.contacts.map(c => ({
              name: c.name,
              email: c.email,
              role: c.role,
              phone: c.phone
            })) : 
            undefined
        };
        
        // Save county data using the real API service
        if (apiCounty.id) {
          // Update existing county
          await countiesService.updateCounty(apiCounty.id, apiCounty);
        } else {
          // Create new county - generate a unique ID
          const newCounty = await countiesService.createCounty({
            ...apiCounty,
            id: undefined // Remove id to let the API generate one
          } as any);
          
          // Update the county ID in the local state
          if (newCounty?.id) {
            setCountyData(prev => ({
              ...prev,
              id: newCounty.id
            }));
          }
        }
        
        // Call the original onSave handler 
        await onSave(countyData);
        
        // Advance to the next step
        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error('Error saving county data:', error);
        // Show error to user
      } finally {
        setIsSaving(false);
      }
    }
  }, [countyData, currentStep, onSave, steps.length, validateCurrentStep]);
  
  /**
   * Handle previous button click
   */
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);
  
  /**
   * Handle form field change
   */
  const handleChange = useCallback((field: string, value: any) => {
    setCountyData(prev => {
      // Handle nested fields using dot notation
      const fields = field.split('.');
      
      if (fields.length === 1) {
        return { ...prev, [field]: value };
      }
      
      // Handle nested fields
      const result = { ...prev };
      let current: any = result;
      
      for (let i = 0; i < fields.length - 1; i++) {
        const key = fields[i];
        
        // If the field is an array index
        if (/^\d+$/.test(fields[i+1])) {
          const index = parseInt(fields[i+1]);
          
          if (!current[key]) {
            current[key] = [];
          }
          
          if (!current[key][index]) {
            current[key][index] = {};
          }
          
          current = current[key][index];
          i++; // Skip the index
        } else {
          if (!current[key]) {
            current[key] = {};
          }
          
          current = current[key];
        }
      }
      
      current[fields[fields.length - 1]] = value;
      return result;
    });
  }, []);
  
  /**
   * Handle data source selection
   */
  const handleDataSourceSelect = useCallback((source: GISDataSource) => {
    setCountyData(prev => {
      const existingSources = prev.gisDataSources || [];
      const sourceExists = existingSources.some(s => s.id === source.id);
      
      if (sourceExists) {
        return prev;
      }
      
      return {
        ...prev,
        gisDataSources: [...existingSources, { ...source }]
      };
    });
  }, []);
  
  /**
   * Handle data source removal
   */
  const handleDataSourceRemove = useCallback((sourceId: string) => {
    setCountyData(prev => ({
      ...prev,
      gisDataSources: prev.gisDataSources.filter(source => source.id !== sourceId)
    }));
  }, []);
  
  /**
   * Handle valuation system selection
   */
  const handleValuationSystemSelect = useCallback((system: ValuationSystem) => {
    setCountyData(prev => ({
      ...prev,
      valuationSystem: { ...system }
    }));
  }, []);
  
  /**
   * Handle tax system selection
   */
  const handleTaxSystemSelect = useCallback((system: TaxSystem) => {
    setCountyData(prev => ({
      ...prev,
      taxSystem: { ...system }
    }));
  }, []);
  
  /**
   * Handle data source test
   */
  const handleDataSourceTest = useCallback(async (sourceId: string) => {
    try {
      setTestingSource(sourceId);
      
      // Find the source in the county data
      const source = countyData.gisDataSources.find(s => s.id === sourceId);
      if (!source) {
        throw new Error('Data source not found');
      }
      
      // First call the original test handler
      const success = await onDataSourceTest(sourceId);
      
      // If successful, try to create a map layer using this source
      if (success && countyData.id) {
        // Convert the GIS data source to a map layer
        const layerData = {
          name: source.name,
          countyId: countyData.id,
          type: source.type,
          url: source.url,
          isEnabled: true,
          opacity: 1.0,
          zIndex: 0,
          metadata: {
            description: source.description,
            lastUpdated: source.lastUpdated
          }
        };
        
        // Create map layer using the API
        await mapLayersService.createLayer(layerData);
        
        // Update local state
        setCountyData(prev => ({
          ...prev,
          gisDataSources: prev.gisDataSources.map(s => 
            s.id === sourceId
              ? { ...s, status: 'ready', error: undefined }
              : s
          )
        }));
      } else if (!success) {
        // Update local state to show error
        setCountyData(prev => ({
          ...prev,
          gisDataSources: prev.gisDataSources.map(s => 
            s.id === sourceId
              ? { ...s, status: 'error', error: 'Could not connect to data source' }
              : s
          )
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error testing data source:', error);
      
      // Update local state to show error
      setCountyData(prev => ({
        ...prev,
        gisDataSources: prev.gisDataSources.map(source => 
          source.id === sourceId
            ? { ...source, status: 'error', error: error instanceof Error ? error.message : String(error) }
            : source
        )
      }));
      
      return false;
    } finally {
      setTestingSource(null);
    }
  }, [countyData.gisDataSources, countyData.id, onDataSourceTest]);
  
  /**
   * Handle valuation system test
   */
  const handleValuationSystemTest = useCallback(async () => {
    if (!countyData.valuationSystem || !countyData.id) {
      return false;
    }
    
    try {
      setTestingSource('valuation');
      
      // First call the original test handler
      const success = await onValuationSystemTest(countyData.valuationSystem.id);
      
      if (success) {
        // If successful, create a test valuation record for a random parcel
        try {
          // Get parcels for the county
          const parcelsResponse = await parcelsService.getParcelsByCounty(countyData.id, 1, 1);
          
          if (parcelsResponse.data.length > 0) {
            const parcel = parcelsResponse.data[0];
            
            // Create a test valuation
            const valuationData = {
              parcelId: parcel.id,
              countyId: countyData.id,
              valuationDate: new Date().toISOString(),
              requestedBy: 'system_test',
              landValue: 100000,
              improvementsValue: 250000,
              totalValue: 350000,
              confidence: 0.95,
              method: countyData.valuationSystem.type || 'manual',
              status: 'completed',
              notes: 'Test valuation during system integration'
            };
            
            // Create the valuation via API
            await valuationsService.createValuation(valuationData);
          }
        } catch (apiError) {
          console.warn('Could not create test valuation, but connection test succeeded:', apiError);
          // This is not a critical error, so we'll still consider the test successful
        }
        
        // Update local state
        setCountyData(prev => ({
          ...prev,
          valuationSystem: prev.valuationSystem
            ? { ...prev.valuationSystem, connectionStatus: 'connected' }
            : undefined
        }));
      } else {
        // Update local state to show error
        setCountyData(prev => ({
          ...prev,
          valuationSystem: prev.valuationSystem
            ? { ...prev.valuationSystem, connectionStatus: 'disconnected' }
            : undefined
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error testing valuation system:', error);
      
      // Update local state to show error
      setCountyData(prev => ({
        ...prev,
        valuationSystem: prev.valuationSystem
          ? { ...prev.valuationSystem, connectionStatus: 'disconnected' }
          : undefined
      }));
      
      return false;
    } finally {
      setTestingSource(null);
    }
  }, [countyData.id, countyData.valuationSystem, onValuationSystemTest]);
  
  /**
   * Handle tax system test
   */
  const handleTaxSystemTest = useCallback(async () => {
    if (!countyData.taxSystem) {
      return false;
    }
    
    try {
      setTestingSource('tax');
      const success = await onTaxSystemTest(countyData.taxSystem.id);
      
      if (success) {
        setCountyData(prev => ({
          ...prev,
          taxSystem: prev.taxSystem
            ? { ...prev.taxSystem, connectionStatus: 'connected' }
            : undefined
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error testing tax system:', error);
      
      setCountyData(prev => ({
        ...prev,
        taxSystem: prev.taxSystem
          ? { ...prev.taxSystem, connectionStatus: 'disconnected' }
          : undefined
      }));
      
      return false;
    } finally {
      setTestingSource(null);
    }
  }, [countyData.taxSystem, onTaxSystemTest]);
  
  /**
   * Handle issue resolution
   */
  const handleResolveIssue = useCallback((index: number, resolved: boolean) => {
    setCountyData(prev => ({
      ...prev,
      validationIssues: prev.validationIssues.map((issue, i) => 
        i === index ? { ...issue, resolved } : issue
      )
    }));
  }, []);
  
  /**
   * Handle county activation
   */
  const handleActivate = useCallback(async () => {
    try {
      setIsActivating(true);
      
      // Use the real API service to update county status
      const apiCounty: Partial<County> = {
        id: countyData.id,
        gisEnabled: true
      };
      
      // Update the county via API
      await countiesService.updateCounty(countyData.id, apiCounty);
      
      // Call the original onActivate handler
      await onActivate(countyData.id);
      
      // Update county status to active
      setCountyData(prev => ({
        ...prev,
        status: 'active'
      }));
      
      workflowLogger.info(`County activated: ${countyData.name}, ${countyData.state}`);
    } catch (error) {
      console.error('Error activating county:', error);
      // Show error to user
    } finally {
      setIsActivating(false);
    }
  }, [countyData.id, countyData.name, countyData.state, onActivate]);
  
  /**
   * Render step indicator
   */
  const renderStepIndicator = () => (
    <div style={{
      display: 'flex',
      marginBottom: '24px',
      overflow: 'auto',
      paddingBottom: '8px'
    }}>
      {steps.map((step, index) => (
        <div 
          key={step.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 'max-content'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: index === currentStep
                ? '#0ea5e9'
                : index < currentStep
                  ? '#22c55e'
                  : '#f1f5f9',
              color: index <= currentStep ? 'white' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {index < currentStep ? (
              <Check size={16} />
            ) : (
              index + 1
            )}
          </div>
          
          <div style={{
            fontSize: '14px',
            fontWeight: index === currentStep ? 'bold' : 'normal',
            color: index === currentStep ? '#0f172a' : '#64748b',
            marginLeft: '8px',
            marginRight: '16px'
          }}>
            {step.title}
          </div>
          
          {index < steps.length - 1 && (
            <div style={{
              height: '1px',
              width: '24px',
              backgroundColor: '#e2e8f0',
              marginRight: '16px'
            }} />
          )}
        </div>
      ))}
    </div>
  );
  
  /**
   * Render basic information step
   */
  const renderBasicStep = () => (
    <div className="step-basic">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        Basic County Information
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            County Name *
          </label>
          <input
            type="text"
            value={countyData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: validationErrors.name ? '1px solid #ef4444' : '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '16px'
            }}
            placeholder="Enter county name"
          />
          {validationErrors.name && (
            <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {validationErrors.name}
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            State *
          </label>
          <select
            value={countyData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: validationErrors.state ? '1px solid #ef4444' : '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          >
            <option value="">Select a state</option>
            {[
              'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
              'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
              'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
              'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
              'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
            ].map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {validationErrors.state && (
            <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {validationErrors.state}
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Population
            </label>
            <input
              type="number"
              value={countyData.properties.population || ''}
              onChange={(e) => handleChange('properties.population', e.target.value ? parseInt(e.target.value) : undefined)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="Enter population"
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Area (sq mi)
            </label>
            <input
              type="number"
              value={countyData.properties.area || ''}
              onChange={(e) => handleChange('properties.area', e.target.value ? parseFloat(e.target.value) : undefined)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="Enter area"
            />
          </div>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Estimated Parcel Count
          </label>
          <input
            type="number"
            value={countyData.properties.parcelCount || ''}
            onChange={(e) => handleChange('properties.parcelCount', e.target.value ? parseInt(e.target.value) : undefined)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '16px'
            }}
            placeholder="Enter parcel count"
          />
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <HelpCircle size={20} color="#0ea5e9" />
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          Provide the basic information about the county. Fields marked with * are required.
        </div>
      </div>
    </div>
  );
  
  /**
   * Render contacts step
   */
  const renderContactsStep = () => (
    <div className="step-contacts">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        County Contacts
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        {countyData.contacts.map((contact, index) => (
          <div
            key={index}
            style={{
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: index < countyData.contacts.length - 1 ? '1px solid #e2e8f0' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>
                Contact #{index + 1}
              </h3>
              
              {countyData.contacts.length > 1 && (
                <button
                  onClick={() => {
                    setCountyData(prev => ({
                      ...prev,
                      contacts: prev.contacts.filter((_, i) => i !== index)
                    }));
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#fef2f2',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleChange(`contacts.${index}.name`, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: validationErrors[`contacts.${index}.name`] ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  placeholder="Enter name"
                />
                {validationErrors[`contacts.${index}.name`] && (
                  <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                    {validationErrors[`contacts.${index}.name`]}
                  </div>
                )}
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Role *
                </label>
                <input
                  type="text"
                  value={contact.role}
                  onChange={(e) => handleChange(`contacts.${index}.role`, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: validationErrors[`contacts.${index}.role`] ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  placeholder="Enter role (e.g., GIS Manager)"
                />
                {validationErrors[`contacts.${index}.role`] && (
                  <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                    {validationErrors[`contacts.${index}.role`]}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleChange(`contacts.${index}.email`, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: validationErrors[`contacts.${index}.email`] ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  placeholder="Enter email"
                />
                {validationErrors[`contacts.${index}.email`] && (
                  <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                    {validationErrors[`contacts.${index}.email`]}
                  </div>
                )}
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={contact.phone || ''}
                  onChange={(e) => handleChange(`contacts.${index}.phone`, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  placeholder="Enter phone number (optional)"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button
          onClick={() => {
            setCountyData(prev => ({
              ...prev,
              contacts: [
                ...prev.contacts,
                { name: '', role: '', email: '' }
              ]
            }));
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <User size={16} />
          Add Another Contact
        </button>
      </div>
      
      {validationErrors.contacts && (
        <div style={{
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <div style={{ fontSize: '14px', color: '#7f1d1d' }}>
            {validationErrors.contacts}
          </div>
        </div>
      )}
      
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <HelpCircle size={20} color="#0ea5e9" />
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          Add contacts who will be responsible for this county's data in the system.
          At least one contact is required.
        </div>
      </div>
    </div>
  );
  
  /**
   * Render GIS data sources step
   */
  const renderGISStep = () => (
    <div className="step-gis">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        GIS Data Sources
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
          Current Data Sources
        </h3>
        
        {countyData.gisDataSources.length > 0 ? (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 120px 100px',
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px 6px 0 0',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#64748b'
            }}>
              <div>Name</div>
              <div>Type</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            
            {countyData.gisDataSources.map((source) => (
              <div 
                key={source.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 120px 100px',
                  padding: '12px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>
                  {source.name}
                  {source.description && (
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>
                      {source.description}
                    </div>
                  )}
                </div>
                
                <div style={{ textTransform: 'capitalize' }}>
                  {source.type.replace(/_/g, ' ')}
                </div>
                
                <div>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backgroundColor: 
                      source.status === 'ready' ? '#dcfce7' :
                      source.status === 'processing' ? '#fef9c3' :
                      source.status === 'error' ? '#fee2e2' :
                      '#f1f5f9',
                    color:
                      source.status === 'ready' ? '#16a34a' :
                      source.status === 'processing' ? '#ca8a04' :
                      source.status === 'error' ? '#dc2626' :
                      '#64748b'
                  }}>
                    {source.status}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDataSourceTest(source.id)}
                    disabled={testingSource === source.id}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: testingSource === source.id ? 'default' : 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: testingSource === source.id ? 0.7 : 1
                    }}
                  >
                    {testingSource === source.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Test
                  </button>
                  
                  <button
                    onClick={() => handleDataSourceRemove(source.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#fef2f2',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#ef4444'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            color: '#64748b',
            marginBottom: '24px'
          }}>
            No data sources added yet
          </div>
        )}
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Add Data Source
          </h3>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 120px 100px',
            gap: '16px'
          }}>
            <select
              id="data-source-select"
              style={{
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            >
              <option value="">Select a data source</option>
              {availableDataSources
                .filter(source => !countyData.gisDataSources.some(s => s.id === source.id))
                .map(source => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.type.replace(/_/g, ' ')})
                  </option>
                ))
              }
            </select>
            
            <button
              onClick={() => {
                const select = document.getElementById('data-source-select') as HTMLSelectElement;
                if (select.value) {
                  const source = availableDataSources.find(s => s.id === select.value);
                  if (source) {
                    handleDataSourceSelect(source);
                    select.value = '';
                  }
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Add Source
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Upload New Data
          </h3>
          
          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '6px',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <Upload size={24} style={{ margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Drag & Drop or Click to Upload
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Supported formats: Shapefiles, GeoJSON, File Geodatabase (.gdb)
            </div>
          </div>
        </div>
      </div>
      
      {validationErrors.gisDataSources && (
        <div style={{
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <div style={{ fontSize: '14px', color: '#7f1d1d' }}>
            {validationErrors.gisDataSources}
          </div>
        </div>
      )}
      
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <HelpCircle size={20} color="#0ea5e9" />
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          Add GIS data sources for this county. You can select from existing sources or upload new data.
          At least one GIS data source is required.
        </div>
      </div>
    </div>
  );
  
  /**
   * Render valuation system step
   */
  const renderValuationStep = () => (
    <div className="step-valuation">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        Valuation System Integration
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
          Current Valuation System
        </h3>
        
        {countyData.valuationSystem ? (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 150px 150px',
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px 6px 0 0',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#64748b'
            }}>
              <div>Name</div>
              <div>Type</div>
              <div>Connection Status</div>
              <div>Actions</div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 150px 150px',
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 'bold' }}>
                {countyData.valuationSystem.name}
              </div>
              
              <div style={{ textTransform: 'capitalize' }}>
                {countyData.valuationSystem.type}
              </div>
              
              <div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: 
                    countyData.valuationSystem.connectionStatus === 'connected' ? '#dcfce7' :
                    countyData.valuationSystem.connectionStatus === 'pending' ? '#fef9c3' :
                    countyData.valuationSystem.connectionStatus === 'disconnected' ? '#fee2e2' :
                    '#f1f5f9',
                  color:
                    countyData.valuationSystem.connectionStatus === 'connected' ? '#16a34a' :
                    countyData.valuationSystem.connectionStatus === 'pending' ? '#ca8a04' :
                    countyData.valuationSystem.connectionStatus === 'disconnected' ? '#dc2626' :
                    '#64748b'
                }}>
                  {countyData.valuationSystem.connectionStatus}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleValuationSystemTest()}
                  disabled={testingSource === 'valuation'}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: testingSource === 'valuation' ? 'default' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: testingSource === 'valuation' ? 0.7 : 1
                  }}
                >
                  {testingSource === 'valuation' ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Test Connection
                </button>
                
                <button
                  onClick={() => setCountyData(prev => ({ ...prev, valuationSystem: undefined }))}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#fef2f2',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#ef4444'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
            
            {countyData.valuationSystem.url && (
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '14px',
                color: '#64748b'
              }}>
                <strong>URL:</strong> {countyData.valuationSystem.url}
              </div>
            )}
            
            {countyData.valuationSystem.lastSync && (
              <div style={{
                padding: '12px 16px',
                fontSize: '14px',
                color: '#64748b'
              }}>
                <strong>Last Sync:</strong> {countyData.valuationSystem.lastSync.toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              color: '#64748b'
            }}>
              No valuation system configured
            </div>
          </div>
        )}
        
        {!countyData.valuationSystem && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Select Valuation System
            </h3>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 120px',
              gap: '16px'
            }}>
              <select
                id="valuation-system-select"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="">Select a valuation system</option>
                {availableValuationSystems.map(system => (
                  <option key={system.id} value={system.id}>
                    {system.name} ({system.type})
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => {
                  const select = document.getElementById('valuation-system-select') as HTMLSelectElement;
                  if (select.value) {
                    const system = availableValuationSystems.find(s => s.id === select.value);
                    if (system) {
                      handleValuationSystemSelect(system);
                      select.value = '';
                    }
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Add System
              </button>
            </div>
          </div>
        )}
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fef9c3',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} color="#ca8a04" />
          <div style={{ fontSize: '14px', color: '#854d0e' }}>
            Note: A valuation system integration is optional, but recommended for full functionality.
          </div>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <HelpCircle size={20} color="#0ea5e9" />
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          Configure a valuation system integration. This allows TerraFusion to synchronize with your
          Computer Assisted Mass Appraisal (CAMA) or other valuation system.
        </div>
      </div>
    </div>
  );
  
  /**
   * Render tax system step
   */
  const renderTaxStep = () => (
    <div className="step-tax">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        Tax System Integration
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
          Current Tax System
        </h3>
        
        {countyData.taxSystem ? (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 150px 150px',
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px 6px 0 0',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#64748b'
            }}>
              <div>Name</div>
              <div>Type</div>
              <div>Connection Status</div>
              <div>Actions</div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 150px 150px',
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 'bold' }}>
                {countyData.taxSystem.name}
              </div>
              
              <div style={{ textTransform: 'capitalize' }}>
                {countyData.taxSystem.type}
              </div>
              
              <div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: 
                    countyData.taxSystem.connectionStatus === 'connected' ? '#dcfce7' :
                    countyData.taxSystem.connectionStatus === 'pending' ? '#fef9c3' :
                    countyData.taxSystem.connectionStatus === 'disconnected' ? '#fee2e2' :
                    '#f1f5f9',
                  color:
                    countyData.taxSystem.connectionStatus === 'connected' ? '#16a34a' :
                    countyData.taxSystem.connectionStatus === 'pending' ? '#ca8a04' :
                    countyData.taxSystem.connectionStatus === 'disconnected' ? '#dc2626' :
                    '#64748b'
                }}>
                  {countyData.taxSystem.connectionStatus}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleTaxSystemTest()}
                  disabled={testingSource === 'tax'}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: testingSource === 'tax' ? 'default' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: testingSource === 'tax' ? 0.7 : 1
                  }}
                >
                  {testingSource === 'tax' ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Test Connection
                </button>
                
                <button
                  onClick={() => setCountyData(prev => ({ ...prev, taxSystem: undefined }))}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#fef2f2',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#ef4444'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
            
            {countyData.taxSystem.url && (
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '14px',
                color: '#64748b'
              }}>
                <strong>URL:</strong> {countyData.taxSystem.url}
              </div>
            )}
            
            {countyData.taxSystem.lastSync && (
              <div style={{
                padding: '12px 16px',
                fontSize: '14px',
                color: '#64748b'
              }}>
                <strong>Last Sync:</strong> {countyData.taxSystem.lastSync.toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              color: '#64748b'
            }}>
              No tax system configured
            </div>
          </div>
        )}
        
        {!countyData.taxSystem && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Select Tax System
            </h3>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 120px',
              gap: '16px'
            }}>
              <select
                id="tax-system-select"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="">Select a tax system</option>
                {availableTaxSystems.map(system => (
                  <option key={system.id} value={system.id}>
                    {system.name} ({system.type})
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => {
                  const select = document.getElementById('tax-system-select') as HTMLSelectElement;
                  if (select.value) {
                    const system = availableTaxSystems.find(s => s.id === select.value);
                    if (system) {
                      handleTaxSystemSelect(system);
                      select.value = '';
                    }
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Add System
              </button>
            </div>
          </div>
        )}
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fef9c3',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} color="#ca8a04" />
          <div style={{ fontSize: '14px', color: '#854d0e' }}>
            Note: A tax system integration is optional, but recommended for full functionality.
          </div>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <HelpCircle size={20} color="#0ea5e9" />
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          Configure a tax system integration. This allows TerraFusion to synchronize with your
          tax collection or assessment system.
        </div>
      </div>
    </div>
  );
  
  /**
   * Render data access step
   */
  const renderAccessStep = () => {
    // Initialize dataAccess if not already set
    if (!countyData.dataAccess) {
      handleChange('dataAccess', {
        parcelLayers: [],
        zoningSources: [],
        dataRefreshSchedule: 'daily',
        dataSecurityLevel: 'private',
        apiAccessEnabled: false,
        exportFormats: ['shapefile', 'geojson', 'csv']
      });
    }
    
    const dataAccess = countyData.dataAccess || {
      parcelLayers: [],
      zoningSources: [],
      dataRefreshSchedule: 'daily',
      dataSecurityLevel: 'private',
      apiAccessEnabled: false,
      exportFormats: ['shapefile', 'geojson', 'csv']
    };
    
    return (
      <div className="step-access">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Data Access Configuration
        </h2>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Parcel Layers
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Select parcel layers to include in this county:
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {countyData.gisDataSources
                  .filter(source => source.status === 'ready')
                  .map(source => (
                    <label
                      key={source.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={dataAccess.parcelLayers.includes(source.id)}
                        onChange={(e) => {
                          const parcelLayers = e.target.checked
                            ? [...dataAccess.parcelLayers, source.id]
                            : dataAccess.parcelLayers.filter(id => id !== source.id);
                          
                          handleChange('dataAccess.parcelLayers', parcelLayers);
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>{source.name}</span>
                    </label>
                  ))
                }
              </div>
              
              {validationErrors['dataAccess.parcelLayers'] && (
                <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                  {validationErrors['dataAccess.parcelLayers']}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Zoning Sources
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Select zoning sources to include (optional):
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {countyData.gisDataSources
                  .filter(source => source.status === 'ready')
                  .map(source => (
                    <label
                      key={source.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={dataAccess.zoningSources.includes(source.id)}
                        onChange={(e) => {
                          const zoningSources = e.target.checked
                            ? [...dataAccess.zoningSources, source.id]
                            : dataAccess.zoningSources.filter(id => id !== source.id);
                          
                          handleChange('dataAccess.zoningSources', zoningSources);
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>{source.name}</span>
                    </label>
                  ))
                }
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Data Refresh Schedule
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                How often should data be refreshed?
              </label>
              
              <select
                value={dataAccess.dataRefreshSchedule}
                onChange={(e) => handleChange('dataAccess.dataRefreshSchedule', e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '16px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Data Security
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Data security level:
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="securityLevel"
                    value="public"
                    checked={dataAccess.dataSecurityLevel === 'public'}
                    onChange={() => handleChange('dataAccess.dataSecurityLevel', 'public')}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Public</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Data is accessible to all users</div>
                  </div>
                </label>
                
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="securityLevel"
                    value="private"
                    checked={dataAccess.dataSecurityLevel === 'private'}
                    onChange={() => handleChange('dataAccess.dataSecurityLevel', 'private')}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Private</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Data is accessible to authorized users only</div>
                  </div>
                </label>
                
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="securityLevel"
                    value="restricted"
                    checked={dataAccess.dataSecurityLevel === 'restricted'}
                    onChange={() => handleChange('dataAccess.dataSecurityLevel', 'restricted')}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Restricted</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Data is accessible to county administrators only</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              API Access
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={dataAccess.apiAccessEnabled}
                  onChange={(e) => handleChange('dataAccess.apiAccessEnabled', e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 'bold' }}>Enable API Access</div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>Allow access to data via the TerraFusion API</div>
                </div>
              </label>
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              Export Formats
            </h3>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Select allowed export formats:
              </label>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(['shapefile', 'geojson', 'csv', 'pdf'] as const).map(format => (
                  <label
                    key={format}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={dataAccess.exportFormats.includes(format)}
                      onChange={(e) => {
                        const exportFormats = e.target.checked
                          ? [...dataAccess.exportFormats, format]
                          : dataAccess.exportFormats.filter(f => f !== format);
                        
                        handleChange('dataAccess.exportFormats', exportFormats);
                      }}
                    />
                    <span style={{ fontSize: '14px', textTransform: 'uppercase' }}>{format}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {validationErrors.dataAccess && (
          <div style={{
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <AlertCircle size={20} color="#ef4444" />
            <div style={{ fontSize: '14px', color: '#7f1d1d' }}>
              {validationErrors.dataAccess}
            </div>
          </div>
        )}
        
        <div style={{
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <HelpCircle size={20} color="#0ea5e9" />
          <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
            Configure how data can be accessed and exported from the TerraFusion platform.
            At least one parcel layer is required.
          </div>
        </div>
      </div>
    );
  };
  
  /**
   * Render validation step
   */
  const renderValidationStep = () => (
    <div className="step-validation">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        Data Validation
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
              Validation Issues
            </h3>
            
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <RefreshCw size={16} />
              Revalidate
            </button>
          </div>
          
          {countyData.validationIssues.length > 0 ? (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 120px 120px',
                padding: '8px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px 6px 0 0',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#64748b'
              }}>
                <div>Type</div>
                <div>Message</div>
                <div>Component</div>
                <div>Status</div>
              </div>
              
              {countyData.validationIssues.map((issue, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 120px 120px',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e2e8f0',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    {issue.type === 'error' ? (
                      <AlertCircle size={18} color="#ef4444" />
                    ) : (
                      <AlertCircle size={18} color="#f59e0b" />
                    )}
                  </div>
                  
                  <div style={{ fontSize: '14px' }}>
                    {issue.message}
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {issue.component}
                  </div>
                  
                  <div>
                    {issue.resolved ? (
                      <div style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        backgroundColor: '#dcfce7',
                        color: '#16a34a'
                      }}>
                        Resolved
                      </div>
                    ) : (
                      <button
                        onClick={() => handleResolveIssue(index, true)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              color: '#64748b'
            }}>
              No validation issues found
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Data Quality Summary
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>GIS Data Sources</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {countyData.gisDataSources.filter(source => source.status === 'ready').length} / {countyData.gisDataSources.length} Ready
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Validation Issues</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {countyData.validationIssues.filter(issue => !issue.resolved).length} Unresolved
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Contacts</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {countyData.contacts.length} Configured
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Integration Status</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {(countyData.valuationSystem?.connectionStatus === 'connected' ? 1 : 0) +
                  (countyData.taxSystem?.connectionStatus === 'connected' ? 1 : 0)} / 2
              </div>
            </div>
          </div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: countyData.validationIssues.some(issue => issue.type === 'error' && !issue.resolved)
            ? '#fef2f2'
            : '#f0fdf4',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {countyData.validationIssues.some(issue => issue.type === 'error' && !issue.resolved) ? (
            <>
              <AlertCircle size={20} color="#ef4444" />
              <div style={{ fontSize: '14px', color: '#7f1d1d' }}>
                There are unresolved errors that must be fixed before county activation.
              </div>
            </>
          ) : (
            <>
              <Check size={20} color="#16a34a" />
              <div style={{ fontSize: '14px', color: '#14532d' }}>
                All critical issues resolved. You can proceed to activate the county.
              </div>
            </>
          )}
        </div>
      </div>
      
      {validationErrors.validation && (
        <div style={{
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <div style={{ fontSize: '14px', color: '#7f1d1d' }}>
            {validationErrors.validation}
          </div>
        </div>
      )}
      
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <HelpCircle size={20} color="#0ea5e9" />
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          Review and resolve any validation issues before activating the county.
          Critical errors must be resolved, while warnings can be acknowledged.
        </div>
      </div>
    </div>
  );
  
  /**
   * Render activation step
   */
  const renderActivateStep = () => (
    <div className="step-activate">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        County Activation
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Configuration Summary
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: '16px' }}>
            <div style={{ color: '#64748b' }}>County:</div>
            <div style={{ fontWeight: 'bold' }}>{countyData.name}, {countyData.state}</div>
            
            <div style={{ color: '#64748b' }}>Status:</div>
            <div>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                backgroundColor: 
                  countyData.status === 'active' ? '#dcfce7' :
                  countyData.status === 'pending' ? '#fef9c3' :
                  countyData.status === 'draft' ? '#f1f5f9' :
                  '#f1f5f9',
                color:
                  countyData.status === 'active' ? '#16a34a' :
                  countyData.status === 'pending' ? '#ca8a04' :
                  countyData.status === 'draft' ? '#64748b' :
                  '#64748b'
              }}>
                {countyData.status}
              </div>
            </div>
            
            <div style={{ color: '#64748b' }}>Contacts:</div>
            <div>{countyData.contacts.length}</div>
            
            <div style={{ color: '#64748b' }}>GIS Data Sources:</div>
            <div>{countyData.gisDataSources.length}</div>
            
            <div style={{ color: '#64748b' }}>Valuation System:</div>
            <div>{countyData.valuationSystem?.name || 'Not configured'}</div>
            
            <div style={{ color: '#64748b' }}>Tax System:</div>
            <div>{countyData.taxSystem?.name || 'Not configured'}</div>
            
            <div style={{ color: '#64748b' }}>Data Refresh:</div>
            <div style={{ textTransform: 'capitalize' }}>{countyData.dataAccess?.dataRefreshSchedule || 'Not configured'}</div>
            
            <div style={{ color: '#64748b' }}>Data Security:</div>
            <div style={{ textTransform: 'capitalize' }}>{countyData.dataAccess?.dataSecurityLevel || 'Not configured'}</div>
          </div>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Activation Status
          </h3>
          
          {countyData.status === 'active' ? (
            <div style={{
              padding: '24px',
              backgroundColor: '#f0fdf4',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#14532d'
            }}>
              <Check size={24} color="#16a34a" />
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>County Successfully Activated</div>
                <div style={{ fontSize: '14px' }}>
                  {countyData.name}, {countyData.state} is now active and ready for use in TerraFusion.
                </div>
              </div>
            </div>
          ) : (
            countyData.validationIssues.some(issue => issue.type === 'error' && !issue.resolved) ? (
              <div style={{
                padding: '24px',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#7f1d1d',
                marginBottom: '24px'
              }}>
                <AlertCircle size={24} color="#ef4444" />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Cannot Activate County</div>
                  <div style={{ fontSize: '14px' }}>
                    There are unresolved validation errors that must be fixed before activation.
                    Please go back to the Validation step and resolve all errors.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '24px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#0c4a6e',
                marginBottom: '24px'
              }}>
                <Clock size={24} color="#0ea5e9" />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Ready for Activation</div>
                  <div style={{ fontSize: '14px' }}>
                    All required configuration is complete. You can now activate this county
                    to make it available in TerraFusion.
                  </div>
                </div>
              </div>
            )
          )}
          
          {countyData.status !== 'active' && !countyData.validationIssues.some(issue => issue.type === 'error' && !issue.resolved) && (
            <button
              onClick={handleActivate}
              disabled={isActivating}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isActivating ? 'default' : 'pointer',
                opacity: isActivating ? 0.7 : 1
              }}
            >
              {isActivating ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Activating County...
                </>
              ) : (
                <>
                  Activate County
                </>
              )}
            </button>
          )}
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            What happens next?
          </h4>
          
          <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#64748b' }}>
            <li style={{ marginBottom: '4px' }}>Initial data sync will begin after activation</li>
            <li style={{ marginBottom: '4px' }}>County will appear in TerraFusion platform dashboards</li>
            <li style={{ marginBottom: '4px' }}>Contacts will receive email notifications</li>
            <li style={{ marginBottom: '4px' }}>Regular data updates will occur based on the configured schedule</li>
            <li>You can modify county settings at any time after activation</li>
          </ul>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <HelpCircle size={20} color="#0ea5e9" />
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          Review the county configuration and activate it when ready.
          You can always make changes to the configuration after activation.
        </div>
      </div>
    </div>
  );
  
  /**
   * Render the step content based on the current step
   */
  const renderStepContent = () => {
    const currentStepId = steps[currentStep].id;
    
    switch (currentStepId) {
      case 'basic':
        return renderBasicStep();
      case 'contacts':
        return renderContactsStep();
      case 'gis':
        return renderGISStep();
      case 'valuation':
        return renderValuationStep();
      case 'tax':
        return renderTaxStep();
      case 'access':
        return renderAccessStep();
      case 'validation':
        return renderValidationStep();
      case 'activate':
        return renderActivateStep();
      default:
        return null;
    }
  };
  
  /**
   * Render navigation buttons
   */
  const renderNavButtons = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '24px',
      padding: '16px 0',
      borderTop: '1px solid #e2e8f0'
    }}>
      <button
        onClick={handlePrevious}
        disabled={currentStep === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: currentStep === 0 ? '#f1f5f9' : '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          cursor: currentStep === 0 ? 'default' : 'pointer',
          opacity: currentStep === 0 ? 0.5 : 1
        }}
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        
        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={isSaving || Object.keys(validationErrors).length > 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: Object.keys(validationErrors).length > 0 ? '#f1f5f9' : '#0ea5e9',
              color: Object.keys(validationErrors).length > 0 ? '#64748b' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: Object.keys(validationErrors).length > 0 || isSaving ? 'default' : 'pointer',
              opacity: Object.keys(validationErrors).length > 0 || isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Next
                <ChevronRight size={16} />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onCancel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
  
  return (
    <div 
      className={`county-onboarding-workflow ${className}`}
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        ...style
      }}
    >
      {/* Step indicator */}
      {renderStepIndicator()}
      
      {/* Step content */}
      {renderStepContent()}
      
      {/* Navigation buttons */}
      {renderNavButtons()}
      
      {/* CSS for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};