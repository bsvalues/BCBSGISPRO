/**
 * County Onboarding Workflow Component
 * 
 * This component guides users through the process of onboarding a new county
 * to the TerraFusion platform, including data import, validation, and configuration.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'wouter';
import { CSVImporter } from '../../../ETL/importers/csv-importer';
import { 
  createCountyLogger,
  logPerformance,
  logDataQualityIssues 
} from '../../../ETL/utils/logger';

// UI Components
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '../ui/card';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../ui/form';

import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Stepper, Step } from '../ui/stepper';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useETLProcess } from '../../hooks/useETLProcess';

// Toast notifications
import { useToast } from '../../hooks/use-toast';

// Define the workflow steps
const WORKFLOW_STEPS = [
  {
    id: 'county-info',
    title: 'County Information',
    description: 'Basic information about the county',
  },
  {
    id: 'data-import',
    title: 'Data Import',
    description: 'Upload county data files',
  },
  {
    id: 'validation',
    title: 'Data Validation',
    description: 'Validate imported data',
  },
  {
    id: 'configuration',
    title: 'Configuration',
    description: 'Configure county-specific settings',
  },
  {
    id: 'review',
    title: 'Review & Activate',
    description: 'Review and activate the county',
  },
];

// County information form schema
interface CountyInformation {
  name: string;
  state: string;
  fips: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

// Data import configuration
interface DataImportConfig {
  parcels: File | null;
  taxcodes: File | null;
  sales: File | null;
  plats: File | null;
}

// County configuration settings
interface CountyConfig {
  useCrs: string;
  primaryIdField: string;
  enableAiValuation: boolean;
  enablePublicAccess: boolean;
}

/**
 * County Onboarding Workflow Component
 */
export function CountyOnboardingWorkflow() {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [countyInfo, setCountyInfo] = useState<CountyInformation>({
    name: '',
    state: '',
    fips: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [dataFiles, setDataFiles] = useState<DataImportConfig>({
    parcels: null,
    taxcodes: null,
    sales: null,
    plats: null,
  });
  const [countyConfig, setCountyConfig] = useState<CountyConfig>({
    useCrs: 'EPSG:4326',
    primaryIdField: 'parcel_id',
    enableAiValuation: true,
    enablePublicAccess: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  
  // Custom hooks
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { uploadFile, uploadProgress } = useFileUpload();
  const { processData, processingStatus } = useETLProcess();
  
  // Logger for this workflow
  const logger = createCountyLogger('Onboarding');
  
  // Handle navigation between steps
  const goToNextStep = () => {
    if (currentStep < WORKFLOW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle form submission for county information
  const handleCountyInfoSubmit = (data: CountyInformation) => {
    setCountyInfo(data);
    logger.info(`County information entered for ${data.name}, ${data.state}`);
    goToNextStep();
  };
  
  // Handle file uploads
  const handleFileChange = (fileType: keyof DataImportConfig, file: File | null) => {
    setDataFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
    
    if (file) {
      logger.info(`File selected for ${fileType}: ${file.name}`);
    }
  };
  
  // Process data imports
  const handleDataImport = async () => {
    setIsLoading(true);
    logger.info(`Starting data import for ${countyInfo.name} county`);
    
    const startTime = Date.now();
    const importResults: Record<string, any> = {};
    
    try {
      // Process each file type if provided
      for (const [fileType, file] of Object.entries(dataFiles)) {
        if (file) {
          // Upload the file
          const uploadResult = await uploadFile(file, fileType);
          
          if (uploadResult.success) {
            // Process the uploaded file
            const result = await processData({
              countyName: countyInfo.name,
              dataType: fileType,
              filePath: uploadResult.path
            });
            
            importResults[fileType] = result;
            
            toast({
              title: `${fileType} Import Complete`,
              description: `Processed ${result.recordCount} records with ${result.errorCount} errors`,
              variant: result.errorCount > 0 ? 'destructive' : 'default',
            });
          }
        }
      }
      
      // Log performance metrics
      logPerformance('data-import', startTime, { 
        county: countyInfo.name,
        fileCount: Object.values(dataFiles).filter(Boolean).length 
      });
      
      // Store results for validation step
      setValidationResults(importResults);
      
      // Move to next step
      goToNextStep();
    } catch (error) {
      logger.error(`Error during data import`, error);
      
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle configuration changes
  const handleConfigChange = (field: keyof CountyConfig, value: any) => {
    setCountyConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Complete the onboarding process
  const completeOnboarding = async () => {
    setIsLoading(true);
    logger.info(`Completing onboarding for ${countyInfo.name} county`);
    
    try {
      // Here we would save all configurations and activate the county
      // This is a placeholder for the actual implementation
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'County Onboarding Complete',
        description: `${countyInfo.name} County has been successfully onboarded!`,
      });
      
      // Navigate to county dashboard
      navigate(`/counties/${countyInfo.name.toLowerCase()}`);
    } catch (error) {
      logger.error(`Error completing onboarding`, error);
      
      toast({
        title: 'Onboarding Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">County Onboarding Workflow</h1>
      
      <Stepper
        currentStep={currentStep}
        steps={WORKFLOW_STEPS.map(step => step.title)}
        onStepClick={(step) => {
          if (step < currentStep) {
            setCurrentStep(step);
          }
        }}
      />
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{WORKFLOW_STEPS[currentStep].title}</CardTitle>
          <CardDescription>{WORKFLOW_STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* County Information Step */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>County Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Benton" 
                        value={countyInfo.name}
                        onChange={(e) => setCountyInfo(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </FormControl>
                    <FormDescription>The official name of the county</FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Washington" 
                        value={countyInfo.state}
                        onChange={(e) => setCountyInfo(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                name="fips"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FIPS Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 53005" 
                        value={countyInfo.fips}
                        onChange={(e) => setCountyInfo(prev => ({ ...prev, fips: e.target.value }))}
                      />
                    </FormControl>
                    <FormDescription>Federal Information Processing Standards code</FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. John Smith" 
                        value={countyInfo.contactName}
                        onChange={(e) => setCountyInfo(prev => ({ ...prev, contactName: e.target.value }))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="e.g. john.smith@example.gov" 
                        value={countyInfo.contactEmail}
                        onChange={(e) => setCountyInfo(prev => ({ ...prev, contactEmail: e.target.value }))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. (555) 123-4567" 
                        value={countyInfo.contactPhone}
                        onChange={(e) => setCountyInfo(prev => ({ ...prev, contactPhone: e.target.value }))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {/* Data Import Step */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Parcel Data</h3>
                <p className="text-sm text-gray-500">
                  Upload a CSV file containing parcel data for the county
                </p>
                <Input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => handleFileChange('parcels', e.target.files?.[0] || null)} 
                />
                {dataFiles.parcels && (
                  <p className="text-sm text-green-600">
                    Selected: {dataFiles.parcels.name}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Tax Codes</h3>
                <p className="text-sm text-gray-500">
                  Upload a CSV file containing tax code information
                </p>
                <Input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => handleFileChange('taxcodes', e.target.files?.[0] || null)} 
                />
                {dataFiles.taxcodes && (
                  <p className="text-sm text-green-600">
                    Selected: {dataFiles.taxcodes.name}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Sales History</h3>
                <p className="text-sm text-gray-500">
                  Upload a CSV file containing sales history data
                </p>
                <Input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => handleFileChange('sales', e.target.files?.[0] || null)} 
                />
                {dataFiles.sales && (
                  <p className="text-sm text-green-600">
                    Selected: {dataFiles.sales.name}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Plat Maps</h3>
                <p className="text-sm text-gray-500">
                  Upload a CSV file containing plat map information
                </p>
                <Input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => handleFileChange('plats', e.target.files?.[0] || null)} 
                />
                {dataFiles.plats && (
                  <p className="text-sm text-green-600">
                    Selected: {dataFiles.plats.name}
                  </p>
                )}
              </div>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <p className="text-sm text-gray-600 mt-1">
                    Uploading: {uploadProgress.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Validation Step */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {validationResults ? (
                <div className="space-y-6">
                  {Object.entries(validationResults).map(([type, result]) => (
                    <div key={type} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold capitalize mb-2">{type} Data</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-100 p-3 rounded">
                          <p className="text-sm text-gray-500">Total Records</p>
                          <p className="text-2xl font-bold">{result.recordCount}</p>
                        </div>
                        
                        <div className="bg-gray-100 p-3 rounded">
                          <p className="text-sm text-gray-500">Issues Found</p>
                          <p className="text-2xl font-bold">{result.errorCount}</p>
                        </div>
                      </div>
                      
                      {result.errorCount > 0 && (
                        <div className="mt-4">
                          <h4 className="text-md font-medium mb-2">Issues to Resolve:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {result.issues.map((issue: any, i: number) => (
                              <li key={i} className="text-sm text-red-600">
                                {issue.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg mb-4">No validation results available</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Please complete the data import step first
                  </p>
                  <Button onClick={() => setCurrentStep(1)}>
                    Go to Data Import
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Configuration Step */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Coordinate Reference System</h3>
                <p className="text-sm text-gray-500">
                  Select the CRS used for this county's data
                </p>
                <select
                  className="w-full p-2 border rounded-md"
                  value={countyConfig.useCrs}
                  onChange={(e) => handleConfigChange('useCrs', e.target.value)}
                >
                  <option value="EPSG:4326">EPSG:4326 (WGS 84)</option>
                  <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
                  <option value="EPSG:2927">EPSG:2927 (NAD83 Washington South)</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Primary ID Field</h3>
                <p className="text-sm text-gray-500">
                  Field name used as the primary identifier for parcels
                </p>
                <Input 
                  value={countyConfig.primaryIdField}
                  onChange={(e) => handleConfigChange('primaryIdField', e.target.value)}
                  placeholder="e.g. parcel_id, pin, apn"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Features</h3>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="ai-valuation"
                    checked={countyConfig.enableAiValuation}
                    onChange={(e) => handleConfigChange('enableAiValuation', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="ai-valuation" className="text-sm">
                    Enable AI-powered valuation
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="public-access"
                    checked={countyConfig.enablePublicAccess}
                    onChange={(e) => handleConfigChange('enablePublicAccess', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="public-access" className="text-sm">
                    Enable public data access portal
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Review Step */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">County Information</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">County Name</p>
                  <p>{countyInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">State</p>
                  <p>{countyInfo.state}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">FIPS Code</p>
                  <p>{countyInfo.fips}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Primary Contact</p>
                  <p>{countyInfo.contactName}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-bold">Data Files</h3>
              <div className="space-y-2 mb-6">
                {Object.entries(dataFiles).map(([type, file]) => (
                  <div key={type} className="flex items-center">
                    <div className="w-24 capitalize font-medium">{type}</div>
                    <div>{file ? file.name : 'No file uploaded'}</div>
                  </div>
                ))}
              </div>
              
              <h3 className="text-lg font-bold">Configuration</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center">
                  <div className="w-48 font-medium">Coordinate System</div>
                  <div>{countyConfig.useCrs}</div>
                </div>
                <div className="flex items-center">
                  <div className="w-48 font-medium">Primary ID Field</div>
                  <div>{countyConfig.primaryIdField}</div>
                </div>
                <div className="flex items-center">
                  <div className="w-48 font-medium">AI Valuation</div>
                  <div>{countyConfig.enableAiValuation ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div className="flex items-center">
                  <div className="w-48 font-medium">Public Access</div>
                  <div>{countyConfig.enablePublicAccess ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Activating this county will make it live on the platform. All imported data will be accessible to authorized users.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 0 || isLoading}
          >
            Back
          </Button>
          
          {currentStep < WORKFLOW_STEPS.length - 1 ? (
            <Button
              onClick={() => {
                if (currentStep === 0) {
                  handleCountyInfoSubmit(countyInfo);
                } else if (currentStep === 1) {
                  handleDataImport();
                } else {
                  goToNextStep();
                }
              }}
              disabled={
                (currentStep === 0 && (!countyInfo.name || !countyInfo.state)) ||
                (currentStep === 1 && !Object.values(dataFiles).some(Boolean)) ||
                isLoading
              }
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </Button>
          ) : (
            <Button
              onClick={completeOnboarding}
              disabled={isLoading}
            >
              {isLoading ? 'Activating...' : 'Activate County'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}