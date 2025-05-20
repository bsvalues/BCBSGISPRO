/**
 * County Onboarding Workflow Component
 * 
 * This component provides a step-by-step interface for onboarding new counties
 * into the TerraFusion platform. It guides administrators through the process of
 * collecting county information, configuring data sources, mapping fields,
 * and validating the setup.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'wouter';

// County interface
interface County {
  id: string;
  name: string;
  state: string;
  fips: string;
  timezone: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  assessorAddress: string;
  assessorWebsite: string;
  dataAccess: 'public' | 'restricted' | 'private';
  notes: string;
}

// Data source interface
interface DataSource {
  id: string;
  name: string;
  type: 'parcels' | 'taxCodes' | 'sales' | 'plats' | 'documents' | 'other';
  format: 'csv' | 'shp' | 'gdb' | 'api' | 'other';
  path: string;
  refreshFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'manual';
  lastUpdated?: string;
  isConfigured: boolean;
  mappingComplete: boolean;
}

// Field mapping interface
interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'geometry';
  required: boolean;
  transform?: string;
  validation?: string;
}

// Component props
interface CountyOnboardingWorkflowProps {
  initialStep?: number;
  onComplete?: (county: County) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * County Onboarding Workflow Component
 */
export const CountyOnboardingWorkflow: React.FC<CountyOnboardingWorkflowProps> = ({
  initialStep = 0,
  onComplete,
  className = '',
  style = {}
}) => {
  // Navigation hook
  const navigate = useNavigate();

  // State for current step
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  
  // State for county data
  const [county, setCounty] = useState<Partial<County>>({
    dataAccess: 'public'
  });
  
  // State for data sources
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  
  // State for current data source
  const [currentDataSourceIndex, setCurrentDataSourceIndex] = useState<number>(-1);
  
  // State for field mappings
  const [fieldMappings, setFieldMappings] = useState<Record<string, FieldMapping[]>>({});
  
  // State for loading
  const [loading, setLoading] = useState<boolean>(false);
  
  // State for errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Steps for the onboarding process
  const steps = [
    { title: 'County Information', description: 'Basic county details' },
    { title: 'Data Sources', description: 'Configure data import sources' },
    { title: 'Field Mapping', description: 'Map source fields to system fields' },
    { title: 'Validation', description: 'Validate and test the configuration' },
    { title: 'Review & Complete', description: 'Finalize county onboarding' }
  ];

  // Handle county information form change
  const handleCountyFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setCounty(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate county information
  const validateCountyInformation = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    const requiredFields: Array<keyof County> = ['name', 'state', 'fips', 'contactName', 'contactEmail'];
    
    requiredFields.forEach(field => {
      if (!county[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
      }
    });
    
    // FIPS validation
    if (county.fips && !/^\d{5}$/.test(county.fips)) {
      newErrors.fips = 'FIPS code must be a 5-digit number';
    }
    
    // Email validation
    if (county.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(county.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (county.contactPhone && !/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(county.contactPhone)) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }
    
    // Website validation
    if (county.assessorWebsite && !/^(http|https):\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([\/?#].*)?$/.test(county.assessorWebsite)) {
      newErrors.assessorWebsite = 'Please enter a valid website URL';
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle data source form change
  const handleDataSourceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update current data source
    if (currentDataSourceIndex >= 0) {
      setDataSources(prev => {
        const updated = [...prev];
        updated[currentDataSourceIndex] = {
          ...updated[currentDataSourceIndex],
          [name]: value
        };
        return updated;
      });
      
      // Clear error for this field if exists
      if (errors[`dataSource_${name}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`dataSource_${name}`];
          return newErrors;
        });
      }
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0 && currentDataSourceIndex >= 0) {
      const file = files[0];
      
      // Update data source with file information
      setDataSources(prev => {
        const updated = [...prev];
        updated[currentDataSourceIndex] = {
          ...updated[currentDataSourceIndex],
          path: file.name,
          isConfigured: true
        };
        return updated;
      });
      
      // Clear error for path if exists
      if (errors[`dataSource_path`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`dataSource_path`];
          return newErrors;
        });
      }
      
      // Simulate file analysis to determine fields
      setTimeout(() => {
        analyzeFile(file);
      }, 1000);
    }
  };
  
  // Simulate file analysis
  const analyzeFile = (file: File) => {
    // In a real implementation, this would analyze the file and determine fields
    // For now, we'll use mock fields based on data source type
    
    if (currentDataSourceIndex >= 0) {
      const dataSource = dataSources[currentDataSourceIndex];
      let mockFields: FieldMapping[] = [];
      
      switch (dataSource.type) {
        case 'parcels':
          mockFields = [
            { sourceField: 'PARCEL_ID', targetField: 'parcelId', dataType: 'string', required: true },
            { sourceField: 'OWNER_NAME', targetField: 'ownerName', dataType: 'string', required: true },
            { sourceField: 'ADDRESS', targetField: 'address', dataType: 'string', required: true },
            { sourceField: 'CITY', targetField: 'city', dataType: 'string', required: true },
            { sourceField: 'STATE', targetField: 'state', dataType: 'string', required: true },
            { sourceField: 'ZIP', targetField: 'zip', dataType: 'string', required: true },
            { sourceField: 'LEGAL_DESC', targetField: 'legalDescription', dataType: 'string', required: false },
            { sourceField: 'LAND_VALUE', targetField: 'landValue', dataType: 'number', required: true },
            { sourceField: 'IMPROVEMENT_VALUE', targetField: 'improvementValue', dataType: 'number', required: true },
            { sourceField: 'TOTAL_VALUE', targetField: 'totalValue', dataType: 'number', required: true },
            { sourceField: 'ACRES', targetField: 'acres', dataType: 'number', required: false },
            { sourceField: 'YEAR_BUILT', targetField: 'yearBuilt', dataType: 'number', required: false },
            { sourceField: 'GEOMETRY', targetField: 'geometry', dataType: 'geometry', required: true }
          ];
          break;
        
        case 'taxCodes':
          mockFields = [
            { sourceField: 'TAX_CODE', targetField: 'taxCode', dataType: 'string', required: true },
            { sourceField: 'DESCRIPTION', targetField: 'description', dataType: 'string', required: true },
            { sourceField: 'RATE', targetField: 'rate', dataType: 'number', required: true },
            { sourceField: 'JURISDICTION', targetField: 'jurisdiction', dataType: 'string', required: true },
            { sourceField: 'EFFECTIVE_DATE', targetField: 'effectiveDate', dataType: 'date', required: true },
            { sourceField: 'EXPIRATION_DATE', targetField: 'expirationDate', dataType: 'date', required: false }
          ];
          break;
        
        case 'sales':
          mockFields = [
            { sourceField: 'PARCEL_ID', targetField: 'parcelId', dataType: 'string', required: true },
            { sourceField: 'SALE_DATE', targetField: 'saleDate', dataType: 'date', required: true },
            { sourceField: 'SALE_PRICE', targetField: 'salePrice', dataType: 'number', required: true },
            { sourceField: 'BUYER_NAME', targetField: 'buyerName', dataType: 'string', required: true },
            { sourceField: 'SELLER_NAME', targetField: 'sellerName', dataType: 'string', required: true },
            { sourceField: 'VALID_SALE', targetField: 'validSale', dataType: 'boolean', required: false },
            { sourceField: 'DOCUMENT_NUMBER', targetField: 'documentNumber', dataType: 'string', required: false }
          ];
          break;
        
        case 'plats':
          mockFields = [
            { sourceField: 'PLAT_ID', targetField: 'platId', dataType: 'string', required: true },
            { sourceField: 'PLAT_NAME', targetField: 'platName', dataType: 'string', required: true },
            { sourceField: 'RECORDING_DATE', targetField: 'recordingDate', dataType: 'date', required: true },
            { sourceField: 'SURVEYOR', targetField: 'surveyor', dataType: 'string', required: false },
            { sourceField: 'NUMBER_OF_LOTS', targetField: 'numberOfLots', dataType: 'number', required: false },
            { sourceField: 'GEOMETRY', targetField: 'geometry', dataType: 'geometry', required: true }
          ];
          break;
        
        case 'documents':
          mockFields = [
            { sourceField: 'DOCUMENT_ID', targetField: 'documentId', dataType: 'string', required: true },
            { sourceField: 'DOCUMENT_TYPE', targetField: 'documentType', dataType: 'string', required: true },
            { sourceField: 'RECORDING_DATE', targetField: 'recordingDate', dataType: 'date', required: true },
            { sourceField: 'RELATED_PARCELS', targetField: 'relatedParcels', dataType: 'string', required: false },
            { sourceField: 'DOCUMENT_URL', targetField: 'documentUrl', dataType: 'string', required: false }
          ];
          break;
        
        default:
          mockFields = [
            { sourceField: 'FIELD1', targetField: '', dataType: 'string', required: false },
            { sourceField: 'FIELD2', targetField: '', dataType: 'string', required: false },
            { sourceField: 'FIELD3', targetField: '', dataType: 'string', required: false }
          ];
      }
      
      // Update field mappings for this data source
      setFieldMappings(prev => ({
        ...prev,
        [dataSource.id]: mockFields
      }));
      
      // Update data source
      setDataSources(prev => {
        const updated = [...prev];
        updated[currentDataSourceIndex] = {
          ...updated[currentDataSourceIndex],
          mappingComplete: false
        };
        return updated;
      });
    }
  };
  
  // Add new data source
  const addDataSource = () => {
    const newId = `ds_${Date.now()}`;
    
    const newDataSource: DataSource = {
      id: newId,
      name: `Data Source ${dataSources.length + 1}`,
      type: 'parcels',
      format: 'csv',
      path: '',
      refreshFrequency: 'monthly',
      isConfigured: false,
      mappingComplete: false
    };
    
    setDataSources(prev => [...prev, newDataSource]);
    setCurrentDataSourceIndex(dataSources.length);
    
    // Initialize empty field mappings for this data source
    setFieldMappings(prev => ({
      ...prev,
      [newId]: []
    }));
  };
  
  // Delete data source
  const deleteDataSource = (index: number) => {
    if (index >= 0 && index < dataSources.length) {
      const dataSourceId = dataSources[index].id;
      
      // Remove data source
      setDataSources(prev => {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      });
      
      // Remove field mappings
      setFieldMappings(prev => {
        const updated = { ...prev };
        delete updated[dataSourceId];
        return updated;
      });
      
      // Update current data source index
      if (currentDataSourceIndex === index) {
        setCurrentDataSourceIndex(-1);
      } else if (currentDataSourceIndex > index) {
        setCurrentDataSourceIndex(currentDataSourceIndex - 1);
      }
    }
  };
  
  // Validate data sources
  const validateDataSources = (): boolean => {
    // Check if there's at least one data source
    if (dataSources.length === 0) {
      setErrors({ dataSourcesRequired: 'At least one data source is required' });
      return false;
    }
    
    // Check if all data sources are configured
    const unconfiguredSources = dataSources.filter(ds => !ds.isConfigured);
    
    if (unconfiguredSources.length > 0) {
      setErrors({ 
        dataSourcesUnconfigured: `${unconfiguredSources.length} data ${unconfiguredSources.length === 1 ? 'source is' : 'sources are'} not configured` 
      });
      return false;
    }
    
    return true;
  };
  
  // Handle field mapping change
  const handleFieldMappingChange = (sourceField: string, property: keyof FieldMapping, value: any) => {
    if (currentDataSourceIndex >= 0) {
      const dataSource = dataSources[currentDataSourceIndex];
      
      setFieldMappings(prev => {
        const updatedMappings = [...(prev[dataSource.id] || [])];
        const index = updatedMappings.findIndex(mapping => mapping.sourceField === sourceField);
        
        if (index >= 0) {
          updatedMappings[index] = {
            ...updatedMappings[index],
            [property]: value
          };
        }
        
        return {
          ...prev,
          [dataSource.id]: updatedMappings
        };
      });
    }
  };
  
  // Validate field mappings
  const validateFieldMappings = (): boolean => {
    if (currentDataSourceIndex >= 0) {
      const dataSource = dataSources[currentDataSourceIndex];
      const mappings = fieldMappings[dataSource.id] || [];
      
      // Check for required fields
      const requiredFields = mappings.filter(mapping => mapping.required);
      const incompleteFields = requiredFields.filter(mapping => !mapping.targetField);
      
      if (incompleteFields.length > 0) {
        setErrors({ 
          fieldMappingsIncomplete: `${incompleteFields.length} required ${incompleteFields.length === 1 ? 'field is' : 'fields are'} not mapped` 
        });
        return false;
      }
      
      // Check for duplicate target fields
      const targetFields = mappings.map(mapping => mapping.targetField).filter(Boolean);
      const uniqueTargetFields = new Set(targetFields);
      
      if (targetFields.length !== uniqueTargetFields.size) {
        setErrors({ fieldMappingsDuplicate: 'Duplicate target fields detected' });
        return false;
      }
      
      // Update data source as mapping complete
      setDataSources(prev => {
        const updated = [...prev];
        updated[currentDataSourceIndex] = {
          ...updated[currentDataSourceIndex],
          mappingComplete: true
        };
        return updated;
      });
      
      return true;
    }
    
    return false;
  };
  
  // Select data source for editing
  const selectDataSource = (index: number) => {
    setCurrentDataSourceIndex(index);
  };
  
  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would save all data to the server
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate county ID from name and state
      const countyId = `${county.name?.toLowerCase().replace(/\s+/g, '-')}-${county.state?.toLowerCase()}`;
      
      // Create complete county object
      const completeCounty: County = {
        ...(county as County),
        id: countyId
      };
      
      // Notify parent component
      if (onComplete) {
        onComplete(completeCounty);
      }
      
      // Navigate to county dashboard
      navigate(`/counties/${countyId}`);
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setErrors({ submitError: 'Failed to complete onboarding. Please try again.' });
    }
  };
  
  // Navigate to next step
  const goToNextStep = () => {
    let canProceed = false;
    
    // Validate current step
    switch (currentStep) {
      case 0: // County Information
        canProceed = validateCountyInformation();
        break;
      
      case 1: // Data Sources
        canProceed = validateDataSources();
        break;
      
      case 2: // Field Mapping
        // Check if all data sources have mapping completed
        canProceed = dataSources.every(ds => ds.mappingComplete);
        
        if (!canProceed) {
          setErrors({ 
            fieldMappingsIncomplete: 'Field mapping is not complete for all data sources' 
          });
        }
        break;
      
      case 3: // Validation
        // In a real implementation, this would validate the entire setup
        canProceed = true;
        break;
      
      case 4: // Complete
        completeOnboarding();
        return;
    }
    
    if (canProceed) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // County information form
  const renderCountyInformationForm = () => (
    <div className="county-info-form">
      <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            County Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={county.name || ''}
            onChange={handleCountyFormChange}
            placeholder="e.g. Benton"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.name ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}
          />
          {errors.name && (
            <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.name}
            </div>
          )}
        </div>
        
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="state" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            State *
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={county.state || ''}
            onChange={handleCountyFormChange}
            placeholder="e.g. Washington"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.state ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}
          />
          {errors.state && (
            <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.state}
            </div>
          )}
        </div>
      </div>
      
      <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="fips" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            FIPS Code *
          </label>
          <input
            type="text"
            id="fips"
            name="fips"
            value={county.fips || ''}
            onChange={handleCountyFormChange}
            placeholder="e.g. 53005"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.fips ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}
          />
          {errors.fips && (
            <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.fips}
            </div>
          )}
        </div>
        
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="timezone" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            value={county.timezone || ''}
            onChange={handleCountyFormChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.timezone ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}
          >
            <option value="">Select Timezone</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Anchorage">Alaska Time (AKT)</option>
            <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
          </select>
          {errors.timezone && (
            <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.timezone}
            </div>
          )}
        </div>
      </div>
      
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '24px', marginBottom: '16px' }}>
        Contact Information
      </h3>
      
      <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="contactName" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Contact Name *
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={county.contactName || ''}
            onChange={handleCountyFormChange}
            placeholder="e.g. John Smith"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.contactName ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}
          />
          {errors.contactName && (
            <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.contactName}
            </div>
          )}
        </div>
        
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="contactEmail" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Contact Email *
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={county.contactEmail || ''}
            onChange={handleCountyFormChange}
            placeholder="e.g. john.smith@example.gov"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.contactEmail ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}
          />
          {errors.contactEmail && (
            <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.contactEmail}
            </div>
          )}
        </div>
      </div>
      
      <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="contactPhone" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Contact Phone
          </label>
          <input
            type="text"
            id="contactPhone"
            name="contactPhone"
            value={county.contactPhone || ''}
            onChange={handleCountyFormChange}
            placeholder="e.g. (555) 123-4567"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.contactPhone ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}
          />
          {errors.contactPhone && (
            <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.contactPhone}
            </div>
          )}
        </div>
        
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="assessorWebsite" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Assessor Website
          </label>
          <input
            type="text"
            id="assessorWebsite"
            name="assessorWebsite"
            value={county.assessorWebsite || ''}
            onChange={handleCountyFormChange}
            placeholder="e.g. https://www.bentoncounty.gov/assessor"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.assessorWebsite ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}
          />
          {errors.assessorWebsite && (
            <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.assessorWebsite}
            </div>
          )}
        </div>
      </div>
      
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label htmlFor="assessorAddress" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Assessor Office Address
        </label>
        <textarea
          id="assessorAddress"
          name="assessorAddress"
          value={county.assessorAddress || ''}
          onChange={handleCountyFormChange}
          placeholder="e.g. 123 Main St, City, State 12345"
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: errors.assessorAddress ? '1px solid #ef4444' : '1px solid #e5e7eb',
            resize: 'vertical'
          }}
        />
        {errors.assessorAddress && (
          <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
            {errors.assessorAddress}
          </div>
        )}
      </div>
      
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Data Access Level
        </label>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['public', 'restricted', 'private'].map(level => (
            <label key={level} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="dataAccess"
                value={level}
                checked={county.dataAccess === level}
                onChange={handleCountyFormChange}
                style={{ marginRight: '8px' }}
              />
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </label>
          ))}
        </div>
        {errors.dataAccess && (
          <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
            {errors.dataAccess}
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="notes" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={county.notes || ''}
          onChange={handleCountyFormChange}
          placeholder="Additional notes about this county..."
          rows={4}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            resize: 'vertical'
          }}
        />
      </div>
    </div>
  );
  
  // Data sources form
  const renderDataSourcesForm = () => (
    <div className="data-sources-form">
      {/* Error messages */}
      {errors.dataSourcesRequired && (
        <div className="error" style={{ 
          color: '#ef4444', 
          backgroundColor: '#fee2e2',
          padding: '8px 12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {errors.dataSourcesRequired}
        </div>
      )}
      
      {errors.dataSourcesUnconfigured && (
        <div className="error" style={{ 
          color: '#ef4444', 
          backgroundColor: '#fee2e2',
          padding: '8px 12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {errors.dataSourcesUnconfigured}
        </div>
      )}
      
      {/* Data sources list */}
      <div className="data-sources-list" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        marginBottom: '16px'
      }}>
        {dataSources.map((dataSource, index) => (
          <div 
            key={dataSource.id}
            className={`data-source-item ${currentDataSourceIndex === index ? 'active' : ''}`}
            style={{
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              backgroundColor: currentDataSourceIndex === index ? '#f9fafb' : 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => selectDataSource(index)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{dataSource.name}</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {dataSource.type.charAt(0).toUpperCase() + dataSource.type.slice(1)} - 
                {dataSource.format.toUpperCase()}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Configuration status */}
              <div style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: dataSource.isConfigured ? '#dcfce7' : '#fee2e2',
                color: dataSource.isConfigured ? '#16a34a' : '#b91c1c',
                fontSize: '14px'
              }}>
                {dataSource.isConfigured ? 'Configured' : 'Not Configured'}
              </div>
              
              {/* Mapping status */}
              {dataSource.isConfigured && (
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: dataSource.mappingComplete ? '#dcfce7' : '#fef9c3',
                  color: dataSource.mappingComplete ? '#16a34a' : '#854d0e',
                  fontSize: '14px'
                }}>
                  {dataSource.mappingComplete ? 'Mapped' : 'Needs Mapping'}
                </div>
              )}
              
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDataSource(index);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {dataSources.length === 0 && (
          <div style={{ 
            padding: '24px', 
            textAlign: 'center', 
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            border: '1px dashed #e5e7eb',
            color: '#6b7280'
          }}>
            No data sources added yet. Click "Add Data Source" to begin.
          </div>
        )}
      </div>
      
      {/* Add data source button */}
      <button
        onClick={addDataSource}
        style={{
          padding: '8px 12px',
          borderRadius: '4px',
          backgroundColor: '#e0f2fe',
          color: '#0369a1',
          border: '1px solid #bae6fd',
          cursor: 'pointer',
          marginBottom: '24px'
        }}
      >
        + Add Data Source
      </button>
      
      {/* Data source configuration form */}
      {currentDataSourceIndex >= 0 && (
        <div className="data-source-form" style={{ 
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Configure Data Source
          </h3>
          
          <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={dataSources[currentDataSourceIndex].name}
                onChange={handleDataSourceFormChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: errors.dataSource_name ? '1px solid #ef4444' : '1px solid #e5e7eb'
                }}
              />
              {errors.dataSource_name && (
                <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                  {errors.dataSource_name}
                </div>
              )}
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="type" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Data Type
              </label>
              <select
                id="type"
                name="type"
                value={dataSources[currentDataSourceIndex].type}
                onChange={handleDataSourceFormChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: errors.dataSource_type ? '1px solid #ef4444' : '1px solid #e5e7eb'
                }}
              >
                <option value="parcels">Parcels</option>
                <option value="taxCodes">Tax Codes</option>
                <option value="sales">Sales</option>
                <option value="plats">Plats</option>
                <option value="documents">Documents</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="format" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                File Format
              </label>
              <select
                id="format"
                name="format"
                value={dataSources[currentDataSourceIndex].format}
                onChange={handleDataSourceFormChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: errors.dataSource_format ? '1px solid #ef4444' : '1px solid #e5e7eb'
                }}
              >
                <option value="csv">CSV</option>
                <option value="shp">Shapefile</option>
                <option value="gdb">File Geodatabase</option>
                <option value="api">API Endpoint</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="refreshFrequency" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Refresh Frequency
              </label>
              <select
                id="refreshFrequency"
                name="refreshFrequency"
                value={dataSources[currentDataSourceIndex].refreshFrequency}
                onChange={handleDataSourceFormChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: errors.dataSource_refreshFrequency ? '1px solid #ef4444' : '1px solid #e5e7eb'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Upload Sample File
            </label>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
              >
                Choose File
              </button>
              <div style={{ color: '#6b7280' }}>
                {dataSources[currentDataSourceIndex].path 
                  ? dataSources[currentDataSourceIndex].path 
                  : 'No file selected'}
              </div>
            </div>
            {errors.dataSource_path && (
              <div className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                {errors.dataSource_path}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
  // Field mapping form
  const renderFieldMappingForm = () => {
    if (currentDataSourceIndex < 0 || !dataSources[currentDataSourceIndex]) {
      return (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          border: '1px dashed #e5e7eb',
          color: '#6b7280'
        }}>
          Please select a data source to map fields.
        </div>
      );
    }
    
    const dataSource = dataSources[currentDataSourceIndex];
    const mappings = fieldMappings[dataSource.id] || [];
    
    return (
      <div className="field-mapping-form">
        {/* Error messages */}
        {errors.fieldMappingsIncomplete && (
          <div className="error" style={{ 
            color: '#ef4444', 
            backgroundColor: '#fee2e2',
            padding: '8px 12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {errors.fieldMappingsIncomplete}
          </div>
        )}
        
        {errors.fieldMappingsDuplicate && (
          <div className="error" style={{ 
            color: '#ef4444', 
            backgroundColor: '#fee2e2',
            padding: '8px 12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {errors.fieldMappingsDuplicate}
          </div>
        )}
        
        {/* Data source selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Select Data Source to Map
          </label>
          <select
            value={currentDataSourceIndex}
            onChange={(e) => selectDataSource(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              width: '100%'
            }}
          >
            {dataSources.map((ds, index) => (
              <option key={ds.id} value={index}>
                {ds.name} ({ds.type.charAt(0).toUpperCase() + ds.type.slice(1)})
              </option>
            ))}
          </select>
        </div>
        
        {/* Field mappings */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Field Mappings
          </h3>
          
          {mappings.length === 0 ? (
            <div style={{ 
              padding: '24px', 
              textAlign: 'center', 
              backgroundColor: '#f9fafb',
              borderRadius: '4px',
              border: '1px dashed #e5e7eb',
              color: '#6b7280'
            }}>
              No fields detected for this data source. Please upload a sample file first.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Source Field</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Target Field</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Data Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Required</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Transform</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {mapping.sourceField}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={mapping.targetField}
                        onChange={(e) => handleFieldMappingChange(mapping.sourceField, 'targetField', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: !mapping.targetField && mapping.required ? '1px solid #ef4444' : '1px solid #e5e7eb',
                          width: '100%'
                        }}
                      >
                        <option value="">-- Select Target Field --</option>
                        {dataSource.type === 'parcels' && [
                          <option key="parcelId" value="parcelId">Parcel ID</option>,
                          <option key="ownerName" value="ownerName">Owner Name</option>,
                          <option key="address" value="address">Address</option>,
                          <option key="city" value="city">City</option>,
                          <option key="state" value="state">State</option>,
                          <option key="zip" value="zip">ZIP</option>,
                          <option key="legalDescription" value="legalDescription">Legal Description</option>,
                          <option key="landValue" value="landValue">Land Value</option>,
                          <option key="improvementValue" value="improvementValue">Improvement Value</option>,
                          <option key="totalValue" value="totalValue">Total Value</option>,
                          <option key="acres" value="acres">Acres</option>,
                          <option key="yearBuilt" value="yearBuilt">Year Built</option>,
                          <option key="geometry" value="geometry">Geometry</option>
                        ]}
                        
                        {dataSource.type === 'taxCodes' && [
                          <option key="taxCode" value="taxCode">Tax Code</option>,
                          <option key="description" value="description">Description</option>,
                          <option key="rate" value="rate">Rate</option>,
                          <option key="jurisdiction" value="jurisdiction">Jurisdiction</option>,
                          <option key="effectiveDate" value="effectiveDate">Effective Date</option>,
                          <option key="expirationDate" value="expirationDate">Expiration Date</option>
                        ]}
                        
                        {dataSource.type === 'sales' && [
                          <option key="parcelId" value="parcelId">Parcel ID</option>,
                          <option key="saleDate" value="saleDate">Sale Date</option>,
                          <option key="salePrice" value="salePrice">Sale Price</option>,
                          <option key="buyerName" value="buyerName">Buyer Name</option>,
                          <option key="sellerName" value="sellerName">Seller Name</option>,
                          <option key="validSale" value="validSale">Valid Sale</option>,
                          <option key="documentNumber" value="documentNumber">Document Number</option>
                        ]}
                        
                        <option value="ignore">-- Ignore This Field --</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={mapping.dataType}
                        onChange={(e) => handleFieldMappingChange(mapping.sourceField, 'dataType', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                          width: '100%'
                        }}
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                        <option value="geometry">Geometry</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={mapping.required}
                        onChange={(e) => handleFieldMappingChange(mapping.sourceField, 'required', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="text"
                        placeholder="e.g. UPPER(), TRIM()"
                        value={mapping.transform || ''}
                        onChange={(e) => handleFieldMappingChange(mapping.sourceField, 'transform', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                          width: '100%'
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Save mapping button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={validateFieldMappings}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Save Mapping
          </button>
        </div>
      </div>
    );
  };
  
  // Validation form
  const renderValidationForm = () => {
    // Count mapped fields
    const totalFields = Object.values(fieldMappings)
      .reduce((acc, mappings) => acc + mappings.length, 0);
    
    const mappedFields = Object.values(fieldMappings)
      .reduce((acc, mappings) => acc + mappings.filter(m => m.targetField && m.targetField !== 'ignore').length, 0);
    
    // Count required fields
    const requiredFields = Object.values(fieldMappings)
      .reduce((acc, mappings) => acc + mappings.filter(m => m.required).length, 0);
    
    const mappedRequiredFields = Object.values(fieldMappings)
      .reduce((acc, mappings) => acc + mappings.filter(m => m.required && m.targetField && m.targetField !== 'ignore').length, 0);
    
    return (
      <div className="validation-form">
        <div className="validation-summary" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Validation Summary
          </h3>
          
          <div style={{ 
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {/* County information */}
              <div style={{ 
                padding: '16px',
                backgroundColor: validateCountyInformation() ? '#dcfce7' : '#fee2e2',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: validateCountyInformation() ? '#16a34a' : '#b91c1c',
                  marginBottom: '8px'
                }}>
                  County Information
                </div>
                <div style={{ fontSize: '14px', textAlign: 'center' }}>
                  {validateCountyInformation() 
                    ? 'All required information provided' 
                    : 'Missing required information'}
                </div>
              </div>
              
              {/* Data sources */}
              <div style={{ 
                padding: '16px',
                backgroundColor: validateDataSources() ? '#dcfce7' : '#fee2e2',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: validateDataSources() ? '#16a34a' : '#b91c1c',
                  marginBottom: '8px'
                }}>
                  Data Sources
                </div>
                <div style={{ fontSize: '14px', textAlign: 'center' }}>
                  {validateDataSources() 
                    ? `${dataSources.length} data ${dataSources.length === 1 ? 'source' : 'sources'} configured` 
                    : 'Data sources missing or not configured'}
                </div>
              </div>
              
              {/* Field mappings */}
              <div style={{ 
                padding: '16px',
                backgroundColor: mappedRequiredFields === requiredFields ? '#dcfce7' : '#fee2e2',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: mappedRequiredFields === requiredFields ? '#16a34a' : '#b91c1c',
                  marginBottom: '8px'
                }}>
                  Required Fields
                </div>
                <div style={{ fontSize: '14px', textAlign: 'center' }}>
                  {mappedRequiredFields} of {requiredFields} required fields mapped
                </div>
              </div>
              
              {/* Total mappings */}
              <div style={{ 
                padding: '16px',
                backgroundColor: '#f0f9ff',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#0369a1',
                  marginBottom: '8px'
                }}>
                  Total Fields
                </div>
                <div style={{ fontSize: '14px', textAlign: 'center' }}>
                  {mappedFields} of {totalFields} total fields mapped
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="validation-details" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Data Source Validation
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Data Source</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Fields</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Required Fields</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {dataSources.map((dataSource) => {
                const ds_mappings = fieldMappings[dataSource.id] || [];
                const total = ds_mappings.length;
                const mapped = ds_mappings.filter(m => m.targetField && m.targetField !== 'ignore').length;
                const required = ds_mappings.filter(m => m.required).length;
                const mappedRequired = ds_mappings.filter(m => m.required && m.targetField && m.targetField !== 'ignore').length;
                const isValid = mappedRequired === required;
                
                return (
                  <tr key={dataSource.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>{dataSource.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {dataSource.type.charAt(0).toUpperCase() + dataSource.type.slice(1)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{mapped} of {total}</td>
                    <td style={{ padding: '12px 16px' }}>{mappedRequired} of {required}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: isValid ? '#dcfce7' : '#fee2e2',
                        color: isValid ? '#16a34a' : '#b91c1c',
                        display: 'inline-block'
                      }}>
                        {isValid ? 'Valid' : 'Invalid'}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {dataSources.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                    No data sources configured
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div style={{ 
          padding: '16px',
          backgroundColor: '#fef9c3',
          borderRadius: '8px',
          border: '1px solid #fde047',
          marginBottom: '24px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#854d0e', marginBottom: '8px' }}>
            Validation Notes
          </div>
          <div style={{ fontSize: '14px', color: '#854d0e' }}>
            In a production environment, this step would perform more detailed validation including:
            <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
              <li>Sample data import to verify field mappings</li>
              <li>Geometry validation for spatial data</li>
              <li>Data type checking and conversion validation</li>
              <li>Relationship validation between different data sources</li>
              <li>Unique identifier verification</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  // Review form
  const renderReviewForm = () => {
    return (
      <div className="review-form">
        <div style={{ 
          padding: '16px',
          backgroundColor: '#dcfce7',
          borderRadius: '8px',
          border: '1px solid #86efac',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 'bold', color: '#16a34a', marginBottom: '8px', fontSize: '18px' }}>
            County Configuration Complete
          </div>
          <div style={{ color: '#16a34a' }}>
            The county has been configured successfully and is ready to be activated in the system.
          </div>
        </div>
        
        <div className="review-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            County Information
          </h3>
          
          <div style={{ 
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>County Name</div>
                <div>{county.name}</div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>State</div>
                <div>{county.state}</div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>FIPS Code</div>
                <div>{county.fips}</div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Timezone</div>
                <div>{county.timezone || 'Not specified'}</div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Contact Name</div>
                <div>{county.contactName}</div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Contact Email</div>
                <div>{county.contactEmail}</div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Contact Phone</div>
                <div>{county.contactPhone || 'Not specified'}</div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Data Access Level</div>
                <div>{county.dataAccess.charAt(0).toUpperCase() + county.dataAccess.slice(1)}</div>
              </div>
            </div>
            
            {county.assessorAddress && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Assessor Office Address</div>
                <div>{county.assessorAddress}</div>
              </div>
            )}
            
            {county.notes && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Notes</div>
                <div>{county.notes}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="review-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
            Configured Data Sources
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Data Source</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Format</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Refresh</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Mapped Fields</th>
              </tr>
            </thead>
            <tbody>
              {dataSources.map((dataSource) => {
                const ds_mappings = fieldMappings[dataSource.id] || [];
                const mappedCount = ds_mappings.filter(m => m.targetField && m.targetField !== 'ignore').length;
                const totalCount = ds_mappings.length;
                
                return (
                  <tr key={dataSource.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>{dataSource.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {dataSource.type.charAt(0).toUpperCase() + dataSource.type.slice(1)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {dataSource.format.toUpperCase()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {dataSource.refreshFrequency.charAt(0).toUpperCase() + dataSource.refreshFrequency.slice(1)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {mappedCount} of {totalCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div style={{ 
          padding: '16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bae6fd',
          marginBottom: '24px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: '8px' }}>
            Next Steps
          </div>
          <div style={{ color: '#0369a1' }}>
            <ol style={{ marginLeft: '20px' }}>
              <li>Click "Complete" to finalize the county onboarding process</li>
              <li>The system will create necessary database tables and configurations</li>
              <li>Initial data import workflows will be scheduled according to the refresh frequencies</li>
              <li>Users with appropriate permissions will be able to access this county's data</li>
              <li>You will be redirected to the county dashboard where you can monitor the progress</li>
            </ol>
          </div>
        </div>
        
        {/* Submit error */}
        {errors.submitError && (
          <div style={{ 
            padding: '16px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            {errors.submitError}
          </div>
        )}
      </div>
    );
  };
  
  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderCountyInformationForm();
      case 1:
        return renderDataSourcesForm();
      case 2:
        return renderFieldMappingForm();
      case 3:
        return renderValidationForm();
      case 4:
        return renderReviewForm();
      default:
        return null;
    }
  };
  
  return (
    <div 
      className={`county-onboarding-workflow ${className}`}
      style={{
        ...style
      }}
    >
      {/* Header */}
      <div className="workflow-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          County Onboarding Workflow
        </h1>
        <p style={{ color: '#6b7280' }}>
          This workflow will guide you through the process of onboarding a new county into the TerraFusion platform.
        </p>
      </div>
      
      {/* Steps indicator */}
      <div className="steps-indicator" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {/* Step */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  className="step-circle"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: index < currentStep 
                      ? '#0284c7'
                      : index === currentStep
                        ? '#0ea5e9'
                        : '#e5e7eb',
                    color: index <= currentStep ? 'white' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <div style={{ 
                  fontWeight: index === currentStep ? 'bold' : 'normal',
                  fontSize: '14px',
                  color: index <= currentStep ? 'black' : '#6b7280',
                  width: '120px',
                  textAlign: 'center'
                }}>
                  {step.title}
                </div>
                <div style={{ 
                  fontSize: '12px',
                  color: '#6b7280',
                  width: '120px',
                  textAlign: 'center'
                }}>
                  {step.description}
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div style={{ 
                  height: '2px', 
                  flex: 1, 
                  backgroundColor: index < currentStep ? '#0284c7' : '#e5e7eb',
                  margin: '0 8px'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Step content */}
      <div className="step-content" style={{ 
        marginBottom: '24px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        {renderStepContent()}
      </div>
      
      {/* Navigation buttons */}
      <div className="navigation-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={goToPreviousStep}
          disabled={currentStep === 0 || loading}
          style={{
            padding: '10px 16px',
            borderRadius: '4px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            cursor: currentStep === 0 || loading ? 'not-allowed' : 'pointer',
            opacity: currentStep === 0 || loading ? 0.5 : 1
          }}
        >
          Previous
        </button>
        
        <button
          onClick={goToNextStep}
          disabled={loading}
          style={{
            padding: '10px 16px',
            borderRadius: '4px',
            backgroundColor: '#0284c7',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading 
            ? 'Processing...' 
            : currentStep === steps.length - 1 
              ? 'Complete' 
              : 'Next'}
        </button>
      </div>
    </div>
  );
};