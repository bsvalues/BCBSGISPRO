/**
 * County Onboarding Workflow Component
 * 
 * This component provides a step-by-step interface for onboarding new counties
 * to the TerraFusion platform, including data import, validation, and configuration.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { logger } from '../../../DevOps/utils/logger';

// Create module-specific logger
const workflowLogger = logger.withTags(['WorkflowUI', 'CountyOnboarding']);

// Step data interface
interface StepData {
  stepNumber: number;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  data: any;
}

// County information interface
interface CountyInfo {
  name: string;
  state: string;
  fips: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  website: string;
}

// File upload interface
interface FileUpload {
  fileType: 'parcels' | 'taxCodes' | 'sales' | 'plats' | 'other';
  fileName: string;
  fileSize: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  progressPercent: number;
  validationStatus: 'pending' | 'validating' | 'valid' | 'invalid';
  issues: Array<{
    type: 'error' | 'warning';
    message: string;
    location?: string; // e.g., "line 15" or "column: County"
  }>;
}

// Field mapping interface
interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'geojson';
  required: boolean;
  mapped: boolean;
}

// Validation results interface
interface ValidationResults {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: {
    count: number;
    byType: Record<string, number>;
    criticalCount: number;
  };
  warnings: {
    count: number;
    byType: Record<string, number>;
  };
  spatialValidation: {
    invalidGeometries: number;
    selfIntersections: number;
    emptyGeometries: number;
  };
  dataQuality: {
    completeness: number; // 0-100%
    accuracy: number; // 0-100%
  };
}

// County configuration interface
interface CountyConfiguration {
  spatialSettings: {
    crs: string;
    defaultCenter: [number, number];
    defaultZoom: number;
    boundingBox: [[number, number], [number, number]];
  };
  displaySettings: {
    primaryIdentifier: string;
    displayFields: string[];
    labelFields: Record<string, string>;
  };
  workflowSettings: {
    enabledWorkflows: string[];
    validationRules: Array<{
      field: string;
      rule: string;
    }>;
  };
  accessSettings: {
    publicAccess: boolean;
    departmentRoles: Record<string, string[]>;
  };
}

/**
 * Component props
 */
interface CountyOnboardingWorkflowProps {
  initialStep?: number;
  onComplete?: (countyId: string) => void;
  onCancel?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * County Onboarding Workflow Component
 */
export const CountyOnboardingWorkflow: React.FC<CountyOnboardingWorkflowProps> = ({
  initialStep = 1,
  onComplete,
  onCancel,
  className = '',
  style = {}
}) => {
  // Current step
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  
  // Steps data
  const [stepsData, setStepsData] = useState<StepData[]>([
    { 
      stepNumber: 1, 
      title: 'County Information', 
      status: 'pending', 
      data: null 
    },
    { 
      stepNumber: 2, 
      title: 'Data Upload', 
      status: 'pending', 
      data: null 
    },
    { 
      stepNumber: 3, 
      title: 'Field Mapping', 
      status: 'pending', 
      data: null 
    },
    { 
      stepNumber: 4, 
      title: 'Data Validation', 
      status: 'pending', 
      data: null 
    },
    { 
      stepNumber: 5, 
      title: 'Configuration', 
      status: 'pending', 
      data: null 
    },
    { 
      stepNumber: 6, 
      title: 'Activation', 
      status: 'pending', 
      data: null 
    },
  ]);
  
  // County information
  const [countyInfo, setCountyInfo] = useState<CountyInfo>({
    name: '',
    state: '',
    fips: '',
    contact: {
      name: '',
      email: '',
      phone: '',
    },
    website: ''
  });
  
  // File uploads
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  
  // Field mappings
  const [fieldMappings, setFieldMappings] = useState<Record<string, FieldMapping[]>>({});
  
  // Validation results
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  
  // County configuration
  const [countyConfig, setCountyConfig] = useState<CountyConfiguration>({
    spatialSettings: {
      crs: 'EPSG:4326',
      defaultCenter: [-119.2034, 46.2503], // Example: Benton County, WA
      defaultZoom: 10,
      boundingBox: [[-120.0, 45.0], [-118.0, 47.0]]
    },
    displaySettings: {
      primaryIdentifier: 'parcelId',
      displayFields: ['owner', 'address', 'landValue', 'improvementValue', 'totalValue'],
      labelFields: {
        parcelId: 'Parcel ID',
        owner: 'Owner',
        address: 'Address',
        landValue: 'Land Value',
        improvementValue: 'Improvement Value',
        totalValue: 'Total Value'
      }
    },
    workflowSettings: {
      enabledWorkflows: ['ownership-transfer', 'property-split', 'valuation'],
      validationRules: [
        { field: 'parcelId', rule: 'required' },
        { field: 'owner', rule: 'required' },
        { field: 'address', rule: 'required' },
        { field: 'totalValue', rule: 'min:0' }
      ]
    },
    accessSettings: {
      publicAccess: false,
      departmentRoles: {
        assessor: ['read', 'write'],
        treasurer: ['read'],
        publicWorks: ['read']
      }
    }
  });
  
  // Loading state
  const [loading, setLoading] = useState<boolean>(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // County ID (generated after activation)
  const [countyId, setCountyId] = useState<string | null>(null);
  
  // For navigation
  const [, setLocation] = useLocation();
  
  // Effect to update step status when we change steps
  useEffect(() => {
    setStepsData(prevSteps => {
      return prevSteps.map(step => {
        if (step.stepNumber === currentStep) {
          return { ...step, status: 'in-progress' };
        }
        return step;
      });
    });
    
    workflowLogger.info(`Navigated to step ${currentStep}`);
  }, [currentStep]);
  
  // Function to handle county information changes
  const handleCountyInfoChange = (field: string, value: string) => {
    setCountyInfo(prev => {
      // Handle nested field for contact info
      if (field.startsWith('contact.')) {
        const contactField = field.split('.')[1];
        return {
          ...prev,
          contact: {
            ...prev.contact,
            [contactField]: value
          }
        };
      }
      
      // Handle regular fields
      return {
        ...prev,
        [field]: value
      };
    });
  };
  
  // Function to validate county information
  const validateCountyInfo = (): boolean => {
    // Basic validation
    if (!countyInfo.name || !countyInfo.state || !countyInfo.fips) {
      setError('Please provide the county name, state, and FIPS code.');
      return false;
    }
    
    // FIPS code validation (should be 5 digits)
    if (!/^\d{5}$/.test(countyInfo.fips)) {
      setError('FIPS code should be a 5-digit number.');
      return false;
    }
    
    // Email validation
    if (countyInfo.contact.email && 
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(countyInfo.contact.email)) {
      setError('Please provide a valid email address.');
      return false;
    }
    
    return true;
  };
  
  // Function to handle file upload
  const handleFileUpload = async (fileType: FileUpload['fileType'], file: File) => {
    // Create new file upload entry
    const newUpload: FileUpload = {
      fileType,
      fileName: file.name,
      fileSize: file.size,
      uploadStatus: 'uploading',
      progressPercent: 0,
      validationStatus: 'pending',
      issues: []
    };
    
    // Add to list of uploads
    setFileUploads(prev => [...prev, newUpload]);
    
    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setFileUploads(prev => {
          return prev.map(upload => {
            if (upload.fileName === file.name && upload.uploadStatus === 'uploading') {
              const newProgress = Math.min(upload.progressPercent + 10, 100);
              
              if (newProgress === 100) {
                clearInterval(uploadInterval);
                return {
                  ...upload,
                  progressPercent: 100,
                  uploadStatus: 'completed',
                  validationStatus: 'validating'
                };
              }
              
              return {
                ...upload,
                progressPercent: newProgress
              };
            }
            return upload;
          });
        });
      }, 300);
      
      // In a real implementation, this would actually upload the file to a server
      // and then validate it. For now, we'll just simulate both processes.
      
      // Simulate completed upload after file interval
      setTimeout(() => {
        clearInterval(uploadInterval);
        
        setFileUploads(prev => {
          return prev.map(upload => {
            if (upload.fileName === file.name) {
              return {
                ...upload,
                progressPercent: 100,
                uploadStatus: 'completed',
                validationStatus: 'validating'
              };
            }
            return upload;
          });
        });
        
        // Simulate file validation
        setTimeout(() => {
          const isValid = Math.random() > 0.3; // 70% chance of success for demo
          
          setFileUploads(prev => {
            return prev.map(upload => {
              if (upload.fileName === file.name) {
                if (isValid) {
                  return {
                    ...upload,
                    validationStatus: 'valid',
                    issues: [
                      {
                        type: 'warning',
                        message: 'Some optional fields are missing values.',
                        location: 'Multiple records'
                      }
                    ]
                  };
                } else {
                  return {
                    ...upload,
                    validationStatus: 'invalid',
                    issues: [
                      {
                        type: 'error',
                        message: 'Invalid geometry found.',
                        location: 'Line 256'
                      },
                      {
                        type: 'error',
                        message: 'Missing required field "parcelId".',
                        location: 'Line 128-135'
                      }
                    ]
                  };
                }
              }
              return upload;
            });
          });
          
          // If this is the parcels file, generate field mappings after validation
          if (fileType === 'parcels' && isValid) {
            generateFieldMappings(fileType);
          }
        }, 1500);
      }, 3000);
      
      workflowLogger.info(`Started upload of ${file.name} (${fileType})`);
    } catch (err: any) {
      workflowLogger.error(`Failed to upload ${file.name}`, err);
      
      setFileUploads(prev => {
        return prev.map(upload => {
          if (upload.fileName === file.name) {
            return {
              ...upload,
              uploadStatus: 'error',
              validationStatus: 'invalid',
              issues: [
                {
                  type: 'error',
                  message: err.message || 'Upload failed',
                  location: 'N/A'
                }
              ]
            };
          }
          return upload;
        });
      });
      
      setError(`Failed to upload ${file.name}: ${err.message}`);
    }
  };
  
  // Function to handle removal of a file
  const handleRemoveFile = (fileName: string) => {
    setFileUploads(prev => prev.filter(upload => upload.fileName !== fileName));
    workflowLogger.info(`Removed file ${fileName}`);
  };
  
  // Function to generate field mappings from a file
  const generateFieldMappings = (fileType: FileUpload['fileType']) => {
    // In a real implementation, this would analyze the uploaded file
    // and extract field names for mapping. For now, we'll use mock data.
    
    let mockSourceFields: string[] = [];
    let mockTargetFields: FieldMapping[] = [];
    
    switch (fileType) {
      case 'parcels':
        mockSourceFields = [
          'PIN', 'OWNER_NAME', 'SITE_ADDR', 'LAND_VAL', 'IMPRV_VAL', 'TOT_VAL', 
          'ACRES', 'TAX_CODE', 'ZONE_CODE', 'NEIGHBORHOOD', 'YEAR_BUILT'
        ];
        
        mockTargetFields = [
          { 
            sourceField: 'PIN', 
            targetField: 'parcelId',
            dataType: 'string',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'OWNER_NAME', 
            targetField: 'owner',
            dataType: 'string',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'SITE_ADDR', 
            targetField: 'address',
            dataType: 'string',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'LAND_VAL', 
            targetField: 'landValue',
            dataType: 'number',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'IMPRV_VAL', 
            targetField: 'improvementValue',
            dataType: 'number',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'TOT_VAL', 
            targetField: 'totalValue',
            dataType: 'number',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'ACRES', 
            targetField: 'acres',
            dataType: 'number',
            required: false,
            mapped: true
          },
          { 
            sourceField: 'TAX_CODE', 
            targetField: 'taxCode',
            dataType: 'string',
            required: false,
            mapped: true
          },
          { 
            sourceField: 'ZONE_CODE', 
            targetField: 'zoneCode',
            dataType: 'string',
            required: false,
            mapped: true
          },
          { 
            sourceField: 'NEIGHBORHOOD', 
            targetField: 'neighborhood',
            dataType: 'string',
            required: false,
            mapped: true
          },
          { 
            sourceField: 'YEAR_BUILT', 
            targetField: 'yearBuilt',
            dataType: 'number',
            required: false,
            mapped: true
          }
        ];
        break;
        
      case 'taxCodes':
        mockSourceFields = [
          'TXCD_NUM', 'TXCD_NAME', 'RATE', 'JURIS_LIST', 'JURIS_RATES'
        ];
        
        mockTargetFields = [
          { 
            sourceField: 'TXCD_NUM', 
            targetField: 'taxCodeId',
            dataType: 'string',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'TXCD_NAME', 
            targetField: 'name',
            dataType: 'string',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'RATE', 
            targetField: 'rate',
            dataType: 'number',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'JURIS_LIST', 
            targetField: 'jurisdictions',
            dataType: 'string',
            required: false,
            mapped: true
          },
          { 
            sourceField: 'JURIS_RATES', 
            targetField: 'jurisdictionRates',
            dataType: 'string',
            required: false,
            mapped: true
          }
        ];
        break;
        
      case 'sales':
        mockSourceFields = [
          'SALE_ID', 'PIN', 'SALE_DATE', 'SALE_PRICE', 'DEED_TYPE', 'GRANTOR', 'GRANTEE'
        ];
        
        mockTargetFields = [
          { 
            sourceField: 'SALE_ID', 
            targetField: 'saleId',
            dataType: 'string',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'PIN', 
            targetField: 'parcelId',
            dataType: 'string',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'SALE_DATE', 
            targetField: 'saleDate',
            dataType: 'date',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'SALE_PRICE', 
            targetField: 'salePrice',
            dataType: 'number',
            required: true,
            mapped: true
          },
          { 
            sourceField: 'DEED_TYPE', 
            targetField: 'deedType',
            dataType: 'string',
            required: false,
            mapped: true
          },
          { 
            sourceField: 'GRANTOR', 
            targetField: 'grantor',
            dataType: 'string',
            required: false,
            mapped: true
          },
          { 
            sourceField: 'GRANTEE', 
            targetField: 'grantee',
            dataType: 'string',
            required: false,
            mapped: true
          }
        ];
        break;
    }
    
    // Set field mappings for this file type
    setFieldMappings(prev => ({
      ...prev,
      [fileType]: mockTargetFields
    }));
    
    workflowLogger.info(`Generated field mappings for ${fileType}`);
  };
  
  // Function to update field mapping
  const updateFieldMapping = (
    fileType: string,
    index: number,
    updates: Partial<FieldMapping>
  ) => {
    setFieldMappings(prev => {
      const currentMappings = [...(prev[fileType] || [])];
      currentMappings[index] = { ...currentMappings[index], ...updates };
      
      return {
        ...prev,
        [fileType]: currentMappings
      };
    });
  };
  
  // Function to validate field mappings
  const validateFieldMappings = (): boolean => {
    // Check that all required fields are mapped
    for (const fileType in fieldMappings) {
      const mappings = fieldMappings[fileType];
      
      for (const mapping of mappings) {
        if (mapping.required && !mapping.mapped) {
          setError(`Required field ${mapping.targetField} is not mapped for ${fileType}.`);
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Function to run data validation
  const runDataValidation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the backend to validate
      // the data. For now, we'll just simulate the process.
      
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock validation results
      const mockValidationResults: ValidationResults = {
        totalRecords: 65247,
        validRecords: 64982,
        invalidRecords: 265,
        errors: {
          count: 142,
          byType: {
            'missing-required-field': 45,
            'invalid-value': 78,
            'invalid-geometry': 19
          },
          criticalCount: 19
        },
        warnings: {
          count: 523,
          byType: {
            'missing-optional-field': 327,
            'unusual-value': 196
          }
        },
        spatialValidation: {
          invalidGeometries: 19,
          selfIntersections: 12,
          emptyGeometries: 7
        },
        dataQuality: {
          completeness: 97.8,
          accuracy: 94.5
        }
      };
      
      setValidationResults(mockValidationResults);
      workflowLogger.info('Data validation completed', { metadata: mockValidationResults });
      
      // Update step status
      setStepsData(prevSteps => {
        return prevSteps.map(step => {
          if (step.stepNumber === 4) {
            return { 
              ...step, 
              status: 'completed',
              data: mockValidationResults
            };
          }
          return step;
        });
      });
    } catch (err: any) {
      workflowLogger.error('Data validation failed', err);
      setError(`Validation failed: ${err.message}`);
      
      // Update step status
      setStepsData(prevSteps => {
        return prevSteps.map(step => {
          if (step.stepNumber === 4) {
            return { ...step, status: 'error' };
          }
          return step;
        });
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle configuration changes
  const handleConfigChange = (section: string, field: string, value: any) => {
    setCountyConfig(prev => {
      // Handle nested fields
      if (section === 'spatialSettings') {
        return {
          ...prev,
          spatialSettings: {
            ...prev.spatialSettings,
            [field]: value
          }
        };
      } else if (section === 'displaySettings') {
        return {
          ...prev,
          displaySettings: {
            ...prev.displaySettings,
            [field]: value
          }
        };
      } else if (section === 'workflowSettings') {
        return {
          ...prev,
          workflowSettings: {
            ...prev.workflowSettings,
            [field]: value
          }
        };
      } else if (section === 'accessSettings') {
        return {
          ...prev,
          accessSettings: {
            ...prev.accessSettings,
            [field]: value
          }
        };
      }
      
      return prev;
    });
  };
  
  // Function to validate configuration
  const validateConfiguration = (): boolean => {
    // Basic validation
    if (!countyConfig.spatialSettings.crs) {
      setError('Please specify a coordinate reference system.');
      return false;
    }
    
    if (!countyConfig.displaySettings.primaryIdentifier) {
      setError('Please specify a primary identifier field.');
      return false;
    }
    
    if (countyConfig.displaySettings.displayFields.length === 0) {
      setError('Please select at least one display field.');
      return false;
    }
    
    return true;
  };
  
  // Function to activate the county
  const activateCounty = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the backend to activate
      // the county. For now, we'll just simulate the process.
      
      // Simulate activation delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate a mock county ID (would come from the server in real implementation)
      const mockCountyId = `${countyInfo.state.toLowerCase()}-${countyInfo.name.toLowerCase().replace(/\s+/g, '-')}`;
      setCountyId(mockCountyId);
      
      // Update step status
      setStepsData(prevSteps => {
        return prevSteps.map(step => {
          if (step.stepNumber === 6) {
            return { 
              ...step, 
              status: 'completed',
              data: { countyId: mockCountyId }
            };
          }
          return step;
        });
      });
      
      workflowLogger.info(`County activated with ID: ${mockCountyId}`);
      
      // Call completion callback
      if (onComplete) {
        onComplete(mockCountyId);
      }
    } catch (err: any) {
      workflowLogger.error('County activation failed', err);
      setError(`Activation failed: ${err.message}`);
      
      // Update step status
      setStepsData(prevSteps => {
        return prevSteps.map(step => {
          if (step.stepNumber === 6) {
            return { ...step, status: 'error' };
          }
          return step;
        });
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle next step
  const handleNextStep = async () => {
    // Validate current step before proceeding
    let isValid = true;
    
    switch (currentStep) {
      case 1: // County Information
        isValid = validateCountyInfo();
        if (isValid) {
          // Update step status
          setStepsData(prevSteps => {
            return prevSteps.map(step => {
              if (step.stepNumber === 1) {
                return { 
                  ...step, 
                  status: 'completed',
                  data: countyInfo
                };
              }
              return step;
            });
          });
        }
        break;
        
      case 2: // Data Upload
        // Check if we have at least parcels uploaded and validated
        const parcelsUploaded = fileUploads.some(
          upload => upload.fileType === 'parcels' && upload.validationStatus === 'valid'
        );
        
        if (!parcelsUploaded) {
          setError('Please upload and validate a parcels file before continuing.');
          isValid = false;
        } else {
          // Update step status
          setStepsData(prevSteps => {
            return prevSteps.map(step => {
              if (step.stepNumber === 2) {
                return { 
                  ...step, 
                  status: 'completed',
                  data: fileUploads
                };
              }
              return step;
            });
          });
        }
        break;
        
      case 3: // Field Mapping
        isValid = validateFieldMappings();
        if (isValid) {
          // Update step status
          setStepsData(prevSteps => {
            return prevSteps.map(step => {
              if (step.stepNumber === 3) {
                return { 
                  ...step, 
                  status: 'completed',
                  data: fieldMappings
                };
              }
              return step;
            });
          });
          
          // Run data validation when moving to step 4
          await runDataValidation();
        }
        break;
        
      case 4: // Data Validation
        // Check if we have validation results with acceptable quality
        if (!validationResults) {
          setError('Please run data validation before continuing.');
          isValid = false;
        } else if (validationResults.errors.criticalCount > 0) {
          setError('Please fix all critical errors before continuing.');
          isValid = false;
        } else {
          // Update step status if not already completed
          setStepsData(prevSteps => {
            return prevSteps.map(step => {
              if (step.stepNumber === 4 && step.status !== 'completed') {
                return { 
                  ...step, 
                  status: 'completed',
                  data: validationResults
                };
              }
              return step;
            });
          });
        }
        break;
        
      case 5: // Configuration
        isValid = validateConfiguration();
        if (isValid) {
          // Update step status
          setStepsData(prevSteps => {
            return prevSteps.map(step => {
              if (step.stepNumber === 5) {
                return { 
                  ...step, 
                  status: 'completed',
                  data: countyConfig
                };
              }
              return step;
            });
          });
        }
        break;
        
      case 6: // Activation
        // No validation needed, activation is handled separately
        break;
    }
    
    // Proceed to next step if valid
    if (isValid) {
      if (currentStep < stepsData.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  
  // Function to handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Function to handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Navigate back to dashboard if no cancel handler provided
      setLocation('/dashboard');
    }
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // County Information
        return (
          <div className="county-info-step">
            <h2>County Information</h2>
            
            <div className="form-group">
              <label htmlFor="countyName">County Name *</label>
              <input
                type="text"
                id="countyName"
                value={countyInfo.name}
                onChange={(e) => handleCountyInfoChange('name', e.target.value)}
                placeholder="e.g., Benton"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="countyState">State *</label>
              <input
                type="text"
                id="countyState"
                value={countyInfo.state}
                onChange={(e) => handleCountyInfoChange('state', e.target.value)}
                placeholder="e.g., Washington"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="countyFips">FIPS Code *</label>
              <input
                type="text"
                id="countyFips"
                value={countyInfo.fips}
                onChange={(e) => handleCountyInfoChange('fips', e.target.value)}
                placeholder="e.g., 01234"
                required
                pattern="\\d{5}"
              />
              <small>5-digit county FIPS code</small>
            </div>
            
            <h3>Contact Information</h3>
            
            <div className="form-group">
              <label htmlFor="contactName">Contact Name</label>
              <input
                type="text"
                id="contactName"
                value={countyInfo.contact.name}
                onChange={(e) => handleCountyInfoChange('contact.name', e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                value={countyInfo.contact.email}
                onChange={(e) => handleCountyInfoChange('contact.email', e.target.value)}
                placeholder="e.g., john.smith@example.gov"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contactPhone">Contact Phone</label>
              <input
                type="tel"
                id="contactPhone"
                value={countyInfo.contact.phone}
                onChange={(e) => handleCountyInfoChange('contact.phone', e.target.value)}
                placeholder="e.g., (555) 123-4567"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="countyWebsite">County Website</label>
              <input
                type="url"
                id="countyWebsite"
                value={countyInfo.website}
                onChange={(e) => handleCountyInfoChange('website', e.target.value)}
                placeholder="e.g., https://benton.gov"
              />
            </div>
          </div>
        );
        
      case 2: // Data Upload
        return (
          <div className="data-upload-step">
            <h2>Data Upload</h2>
            
            <div className="upload-section">
              <h3>Required Files</h3>
              
              <div className="upload-card">
                <h4>Parcels (GeoJSON or Shapefile) *</h4>
                <p>Upload the parcel boundaries with attributes.</p>
                
                {fileUploads.some(upload => upload.fileType === 'parcels') ? (
                  // Show uploaded files
                  fileUploads
                    .filter(upload => upload.fileType === 'parcels')
                    .map((upload, index) => (
                      <div key={index} className="uploaded-file">
                        <div className="file-info">
                          <span className="file-name">{upload.fileName}</span>
                          <span className="file-size">
                            {(upload.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        
                        <div className="upload-status">
                          {upload.uploadStatus === 'uploading' && (
                            <div className="progress-bar">
                              <div 
                                className="progress" 
                                style={{ width: `${upload.progressPercent}%` }}
                              ></div>
                            </div>
                          )}
                          
                          {upload.uploadStatus === 'completed' && (
                            <div className="validation-status">
                              {upload.validationStatus === 'validating' && (
                                <span>Validating...</span>
                              )}
                              
                              {upload.validationStatus === 'valid' && (
                                <span className="valid">Valid ✓</span>
                              )}
                              
                              {upload.validationStatus === 'invalid' && (
                                <span className="invalid">Invalid ✗</span>
                              )}
                            </div>
                          )}
                          
                          {upload.uploadStatus === 'error' && (
                            <span className="error">Upload failed ✗</span>
                          )}
                          
                          <button 
                            onClick={() => handleRemoveFile(upload.fileName)}
                            className="remove-button"
                          >
                            Remove
                          </button>
                        </div>
                        
                        {upload.issues.length > 0 && (
                          <div className="file-issues">
                            <h5>Issues:</h5>
                            <ul>
                              {upload.issues.map((issue, i) => (
                                <li key={i} className={issue.type}>
                                  {issue.type === 'error' ? '❌ ' : '⚠️ '}
                                  {issue.message}
                                  {issue.location && ` (${issue.location})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  // Show upload button
                  <div className="upload-button-container">
                    <button className="upload-button">
                      Select File
                      <input 
                        type="file" 
                        accept=".geojson,.json,.zip,.shp" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload('parcels', e.target.files[0]);
                          }
                        }}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="upload-section">
              <h3>Optional Files</h3>
              
              <div className="upload-card">
                <h4>Tax Codes (CSV or GeoJSON)</h4>
                <p>Upload tax code area definitions.</p>
                
                {fileUploads.some(upload => upload.fileType === 'taxCodes') ? (
                  // Show uploaded files
                  fileUploads
                    .filter(upload => upload.fileType === 'taxCodes')
                    .map((upload, index) => (
                      <div key={index} className="uploaded-file">
                        <div className="file-info">
                          <span className="file-name">{upload.fileName}</span>
                          <span className="file-size">
                            {(upload.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        
                        <div className="upload-status">
                          {/* Similar status display as parcels */}
                          {upload.uploadStatus === 'uploading' && (
                            <div className="progress-bar">
                              <div 
                                className="progress" 
                                style={{ width: `${upload.progressPercent}%` }}
                              ></div>
                            </div>
                          )}
                          
                          {upload.uploadStatus === 'completed' && (
                            <div className="validation-status">
                              {upload.validationStatus === 'validating' && (
                                <span>Validating...</span>
                              )}
                              
                              {upload.validationStatus === 'valid' && (
                                <span className="valid">Valid ✓</span>
                              )}
                              
                              {upload.validationStatus === 'invalid' && (
                                <span className="invalid">Invalid ✗</span>
                              )}
                            </div>
                          )}
                          
                          <button 
                            onClick={() => handleRemoveFile(upload.fileName)}
                            className="remove-button"
                          >
                            Remove
                          </button>
                        </div>
                        
                        {upload.issues.length > 0 && (
                          <div className="file-issues">
                            <h5>Issues:</h5>
                            <ul>
                              {upload.issues.map((issue, i) => (
                                <li key={i} className={issue.type}>
                                  {issue.type === 'error' ? '❌ ' : '⚠️ '}
                                  {issue.message}
                                  {issue.location && ` (${issue.location})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  // Show upload button
                  <div className="upload-button-container">
                    <button className="upload-button">
                      Select File
                      <input 
                        type="file" 
                        accept=".csv,.geojson,.json" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload('taxCodes', e.target.files[0]);
                          }
                        }}
                      />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="upload-card">
                <h4>Sales History (CSV)</h4>
                <p>Upload property sale records.</p>
                
                {fileUploads.some(upload => upload.fileType === 'sales') ? (
                  // Show uploaded files
                  fileUploads
                    .filter(upload => upload.fileType === 'sales')
                    .map((upload, index) => (
                      <div key={index} className="uploaded-file">
                        {/* Similar display as above */}
                        <div className="file-info">
                          <span className="file-name">{upload.fileName}</span>
                          <span className="file-size">
                            {(upload.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        
                        <div className="upload-status">
                          {upload.uploadStatus === 'uploading' && (
                            <div className="progress-bar">
                              <div 
                                className="progress" 
                                style={{ width: `${upload.progressPercent}%` }}
                              ></div>
                            </div>
                          )}
                          
                          {upload.uploadStatus === 'completed' && (
                            <div className="validation-status">
                              {upload.validationStatus === 'validating' && (
                                <span>Validating...</span>
                              )}
                              
                              {upload.validationStatus === 'valid' && (
                                <span className="valid">Valid ✓</span>
                              )}
                              
                              {upload.validationStatus === 'invalid' && (
                                <span className="invalid">Invalid ✗</span>
                              )}
                            </div>
                          )}
                          
                          <button 
                            onClick={() => handleRemoveFile(upload.fileName)}
                            className="remove-button"
                          >
                            Remove
                          </button>
                        </div>
                        
                        {upload.issues.length > 0 && (
                          <div className="file-issues">
                            <h5>Issues:</h5>
                            <ul>
                              {upload.issues.map((issue, i) => (
                                <li key={i} className={issue.type}>
                                  {issue.type === 'error' ? '❌ ' : '⚠️ '}
                                  {issue.message}
                                  {issue.location && ` (${issue.location})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  // Show upload button
                  <div className="upload-button-container">
                    <button className="upload-button">
                      Select File
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload('sales', e.target.files[0]);
                          }
                        }}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 3: // Field Mapping
        return (
          <div className="field-mapping-step">
            <h2>Field Mapping</h2>
            <p>Map the fields from your uploaded files to the platform fields.</p>
            
            {Object.keys(fieldMappings).length === 0 ? (
              <div className="no-mappings">
                <p>No field mappings available. Please upload and validate your data files first.</p>
              </div>
            ) : (
              <div className="mapping-tables">
                {Object.entries(fieldMappings).map(([fileType, mappings]) => (
                  <div key={fileType} className="mapping-table-container">
                    <h3>{fileType.charAt(0).toUpperCase() + fileType.slice(1)} Field Mapping</h3>
                    
                    <table className="mapping-table">
                      <thead>
                        <tr>
                          <th>Source Field</th>
                          <th>Target Field</th>
                          <th>Data Type</th>
                          <th>Required</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappings.map((mapping, index) => (
                          <tr key={index}>
                            <td>{mapping.sourceField}</td>
                            <td>
                              <input
                                type="text"
                                value={mapping.targetField}
                                onChange={(e) => updateFieldMapping(
                                  fileType, 
                                  index, 
                                  { targetField: e.target.value, mapped: !!e.target.value }
                                )}
                              />
                            </td>
                            <td>
                              <select
                                value={mapping.dataType}
                                onChange={(e) => updateFieldMapping(
                                  fileType, 
                                  index, 
                                  { dataType: e.target.value as any }
                                )}
                              >
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="boolean">Boolean</option>
                                <option value="geojson">GeoJSON</option>
                              </select>
                            </td>
                            <td>{mapping.required ? 'Yes' : 'No'}</td>
                            <td>
                              <button
                                onClick={() => updateFieldMapping(
                                  fileType, 
                                  index, 
                                  { mapped: !mapping.mapped }
                                )}
                              >
                                {mapping.mapped ? 'Unmap' : 'Map'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 4: // Data Validation
        return (
          <div className="data-validation-step">
            <h2>Data Validation</h2>
            
            {loading ? (
              <div className="loading">
                <p>Validating data...</p>
                <div className="spinner"></div>
              </div>
            ) : validationResults ? (
              <div className="validation-results">
                <div className="validation-summary">
                  <div className="summary-card">
                    <h3>Records</h3>
                    <div className="summary-numbers">
                      <div className="summary-item">
                        <span className="number">{validationResults.totalRecords.toLocaleString()}</span>
                        <span className="label">Total</span>
                      </div>
                      <div className="summary-item">
                        <span className="number">{validationResults.validRecords.toLocaleString()}</span>
                        <span className="label">Valid</span>
                      </div>
                      <div className="summary-item">
                        <span className="number">{validationResults.invalidRecords.toLocaleString()}</span>
                        <span className="label">Invalid</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <h3>Data Quality</h3>
                    <div className="quality-metrics">
                      <div className="quality-meter">
                        <span className="label">Completeness</span>
                        <div className="meter">
                          <div 
                            className="fill" 
                            style={{ width: `${validationResults.dataQuality.completeness}%` }}
                          ></div>
                        </div>
                        <span className="value">{validationResults.dataQuality.completeness}%</span>
                      </div>
                      
                      <div className="quality-meter">
                        <span className="label">Accuracy</span>
                        <div className="meter">
                          <div 
                            className="fill" 
                            style={{ width: `${validationResults.dataQuality.accuracy}%` }}
                          ></div>
                        </div>
                        <span className="value">{validationResults.dataQuality.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="validation-details">
                  <h3>Validation Issues</h3>
                  
                  <div className="issues-container">
                    <div className="issues-section">
                      <h4>Errors ({validationResults.errors.count})</h4>
                      <ul className="issues-list errors">
                        {Object.entries(validationResults.errors.byType).map(([type, count]) => (
                          <li key={type}>
                            <span className="issue-icon">❌</span>
                            <span className="issue-type">{type.replace(/-/g, ' ')}</span>
                            <span className="issue-count">{count}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {validationResults.errors.criticalCount > 0 && (
                        <div className="critical-warning">
                          <p>
                            <strong>Warning:</strong> {validationResults.errors.criticalCount} critical errors 
                            must be fixed before continuing.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="issues-section">
                      <h4>Warnings ({validationResults.warnings.count})</h4>
                      <ul className="issues-list warnings">
                        {Object.entries(validationResults.warnings.byType).map(([type, count]) => (
                          <li key={type}>
                            <span className="issue-icon">⚠️</span>
                            <span className="issue-type">{type.replace(/-/g, ' ')}</span>
                            <span className="issue-count">{count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="spatial-validation">
                    <h4>Spatial Validation</h4>
                    <ul className="spatial-issues">
                      <li>
                        <span className="issue-type">Invalid Geometries</span>
                        <span className="issue-count">{validationResults.spatialValidation.invalidGeometries}</span>
                      </li>
                      <li>
                        <span className="issue-type">Self Intersections</span>
                        <span className="issue-count">{validationResults.spatialValidation.selfIntersections}</span>
                      </li>
                      <li>
                        <span className="issue-type">Empty Geometries</span>
                        <span className="issue-count">{validationResults.spatialValidation.emptyGeometries}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="validation-actions">
                    <button onClick={runDataValidation}>Revalidate Data</button>
                    <button>Export Report</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-validation">
                <p>Data has not been validated yet.</p>
                <button onClick={runDataValidation}>Validate Now</button>
              </div>
            )}
          </div>
        );
        
      case 5: // Configuration
        return (
          <div className="configuration-step">
            <h2>County Configuration</h2>
            
            <div className="config-section">
              <h3>Spatial Settings</h3>
              
              <div className="form-group">
                <label htmlFor="crs">Coordinate Reference System</label>
                <input
                  type="text"
                  id="crs"
                  value={countyConfig.spatialSettings.crs}
                  onChange={(e) => handleConfigChange('spatialSettings', 'crs', e.target.value)}
                  placeholder="e.g., EPSG:4326"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="defaultCenter">Default Map Center</label>
                <div className="coord-inputs">
                  <input
                    type="number"
                    id="defaultCenterLng"
                    value={countyConfig.spatialSettings.defaultCenter[0]}
                    onChange={(e) => handleConfigChange(
                      'spatialSettings', 
                      'defaultCenter', 
                      [parseFloat(e.target.value), countyConfig.spatialSettings.defaultCenter[1]]
                    )}
                    placeholder="Longitude"
                    step="0.0001"
                  />
                  <input
                    type="number"
                    id="defaultCenterLat"
                    value={countyConfig.spatialSettings.defaultCenter[1]}
                    onChange={(e) => handleConfigChange(
                      'spatialSettings', 
                      'defaultCenter', 
                      [countyConfig.spatialSettings.defaultCenter[0], parseFloat(e.target.value)]
                    )}
                    placeholder="Latitude"
                    step="0.0001"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="defaultZoom">Default Zoom Level</label>
                <input
                  type="number"
                  id="defaultZoom"
                  value={countyConfig.spatialSettings.defaultZoom}
                  onChange={(e) => handleConfigChange('spatialSettings', 'defaultZoom', parseInt(e.target.value))}
                  min="1"
                  max="20"
                />
              </div>
            </div>
            
            <div className="config-section">
              <h3>Display Settings</h3>
              
              <div className="form-group">
                <label htmlFor="primaryIdentifier">Primary Identifier Field</label>
                <input
                  type="text"
                  id="primaryIdentifier"
                  value={countyConfig.displaySettings.primaryIdentifier}
                  onChange={(e) => handleConfigChange('displaySettings', 'primaryIdentifier', e.target.value)}
                  placeholder="e.g., parcelId"
                />
              </div>
              
              <div className="form-group">
                <label>Display Fields</label>
                <div className="checkbox-list">
                  {['parcelId', 'owner', 'address', 'landValue', 'improvementValue', 'totalValue', 'acres', 'taxCode', 'zoneCode'].map(field => (
                    <div key={field} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`display-${field}`}
                        checked={countyConfig.displaySettings.displayFields.includes(field)}
                        onChange={(e) => {
                          const newFields = e.target.checked
                            ? [...countyConfig.displaySettings.displayFields, field]
                            : countyConfig.displaySettings.displayFields.filter(f => f !== field);
                          
                          handleConfigChange('displaySettings', 'displayFields', newFields);
                        }}
                      />
                      <label htmlFor={`display-${field}`}>{field}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="config-section">
              <h3>Workflow Settings</h3>
              
              <div className="form-group">
                <label>Enabled Workflows</label>
                <div className="checkbox-list">
                  {['ownership-transfer', 'property-split', 'valuation', 'appeals', 'document-processing'].map(workflow => (
                    <div key={workflow} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`workflow-${workflow}`}
                        checked={countyConfig.workflowSettings.enabledWorkflows.includes(workflow)}
                        onChange={(e) => {
                          const newWorkflows = e.target.checked
                            ? [...countyConfig.workflowSettings.enabledWorkflows, workflow]
                            : countyConfig.workflowSettings.enabledWorkflows.filter(w => w !== workflow);
                          
                          handleConfigChange('workflowSettings', 'enabledWorkflows', newWorkflows);
                        }}
                      />
                      <label htmlFor={`workflow-${workflow}`}>{workflow.replace(/-/g, ' ')}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="config-section">
              <h3>Access Settings</h3>
              
              <div className="form-group">
                <label htmlFor="publicAccess">Public Access</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="publicAccess"
                    checked={countyConfig.accessSettings.publicAccess}
                    onChange={(e) => handleConfigChange('accessSettings', 'publicAccess', e.target.checked)}
                  />
                  <label htmlFor="publicAccess"></label>
                </div>
                <small>Allow public access to parcel data</small>
              </div>
              
              <div className="form-group">
                <label>Department Access</label>
                <table className="department-access">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Read</th>
                      <th>Write</th>
                      <th>Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(countyConfig.accessSettings.departmentRoles).map(([dept, roles]) => (
                      <tr key={dept}>
                        <td>{dept}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={roles.includes('read')}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...roles, 'read']
                                : roles.filter(r => r !== 'read');
                              
                              handleConfigChange('accessSettings', 'departmentRoles', {
                                ...countyConfig.accessSettings.departmentRoles,
                                [dept]: newRoles
                              });
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={roles.includes('write')}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...roles, 'write']
                                : roles.filter(r => r !== 'write');
                              
                              handleConfigChange('accessSettings', 'departmentRoles', {
                                ...countyConfig.accessSettings.departmentRoles,
                                [dept]: newRoles
                              });
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={roles.includes('admin')}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...roles, 'admin']
                                : roles.filter(r => r !== 'admin');
                              
                              handleConfigChange('accessSettings', 'departmentRoles', {
                                ...countyConfig.accessSettings.departmentRoles,
                                [dept]: newRoles
                              });
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
        
      case 6: // Activation
        return (
          <div className="activation-step">
            <h2>County Activation</h2>
            
            {countyId ? (
              <div className="activation-success">
                <div className="success-icon">✓</div>
                <h3>County Successfully Activated!</h3>
                <p>
                  <strong>{countyInfo.name} County, {countyInfo.state}</strong> has been 
                  activated and is now available on the TerraFusion platform.
                </p>
                
                <div className="county-details">
                  <p><strong>County ID:</strong> {countyId}</p>
                  <p><strong>Activation Date:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Status:</strong> Active</p>
                </div>
                
                <div className="next-steps">
                  <h4>Next Steps</h4>
                  <ul>
                    <li>Invite county administrators to the platform</li>
                    <li>Configure additional workflows specific to {countyInfo.name} County</li>
                    <li>Review and verify imported data</li>
                  </ul>
                </div>
                
                <div className="action-buttons">
                  <button onClick={() => setLocation(`/counties/${countyId}`)}>
                    View County Dashboard
                  </button>
                  <button onClick={() => setLocation('/dashboard')}>
                    Return to Main Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="activation-form">
                <div className="activation-summary">
                  <h3>Activation Summary</h3>
                  
                  <div className="summary-item">
                    <h4>County Information</h4>
                    <p>{countyInfo.name} County, {countyInfo.state}</p>
                    <p>FIPS: {countyInfo.fips}</p>
                  </div>
                  
                  <div className="summary-item">
                    <h4>Imported Data</h4>
                    <ul>
                      {fileUploads.map((upload, index) => (
                        <li key={index}>
                          {upload.fileType}: {upload.fileName}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="summary-item">
                    <h4>Data Quality</h4>
                    {validationResults ? (
                      <>
                        <p>Completeness: {validationResults.dataQuality.completeness}%</p>
                        <p>Accuracy: {validationResults.dataQuality.accuracy}%</p>
                        <p>Issues: {validationResults.errors.count} errors, {validationResults.warnings.count} warnings</p>
                      </>
                    ) : (
                      <p>Validation not performed</p>
                    )}
                  </div>
                  
                  <div className="activation-confirm">
                    <p>
                      By activating this county, you confirm that the imported data 
                      is accurate and ready for use on the platform.
                    </p>
                    
                    <label className="confirm-checkbox">
                      <input 
                        type="checkbox" 
                        checked={stepsData.every(step => step.status === 'completed' || step.stepNumber === 6)}
                        disabled={!stepsData.every(step => step.status === 'completed' || step.stepNumber === 6)}
                      />
                      I confirm that all data has been validated and configuration is complete
                    </label>
                  </div>
                </div>
                
                <div className="activation-button">
                  <button 
                    onClick={activateCounty}
                    disabled={!stepsData.every(step => step.status === 'completed' || step.stepNumber === 6) || loading}
                    className="activate-button"
                  >
                    {loading ? 'Activating...' : 'Activate County'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
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
      {/* Steps indicator */}
      <div className="steps-indicator">
        {stepsData.map((step) => (
          <div 
            key={step.stepNumber}
            className={`step ${step.status} ${currentStep === step.stepNumber ? 'active' : ''}`}
            onClick={() => {
              // Allow clicking on completed steps or the current step + 1
              if (step.status === 'completed' || step.stepNumber === currentStep || step.stepNumber === currentStep + 1) {
                setCurrentStep(step.stepNumber);
              }
            }}
          >
            <div className="step-number">{step.stepNumber}</div>
            <div className="step-title">{step.title}</div>
          </div>
        ))}
      </div>
      
      {/* Step content */}
      <div className="step-content">
        {renderStepContent()}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="navigation-buttons">
        <button 
          onClick={handleCancel}
          className="cancel-button"
          disabled={loading}
        >
          Cancel
        </button>
        
        <div className="step-buttons">
          {currentStep > 1 && (
            <button 
              onClick={handlePreviousStep}
              className="prev-button"
              disabled={loading}
            >
              Previous
            </button>
          )}
          
          {currentStep < stepsData.length ? (
            <button 
              onClick={handleNextStep}
              className="next-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Next'}
            </button>
          ) : (
            !countyId && (
              <button 
                onClick={activateCounty}
                className="activate-button"
                disabled={loading || !stepsData.every(step => step.status === 'completed' || step.stepNumber === 6)}
              >
                {loading ? 'Activating...' : 'Activate County'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};