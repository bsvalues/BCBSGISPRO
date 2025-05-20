/**
 * County Onboarding Workflow Component
 * 
 * This component guides users through the process of onboarding
 * a new county to the TerraFusion platform.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'wouter';
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../ui/use-toast';

// Define the schema for county information
const countyInfoSchema = z.object({
  name: z.string().min(2, "County name must be at least 2 characters"),
  code: z.string().min(2, "County code must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  contactEmail: z.string().email("Please provide a valid email"),
  description: z.string().optional()
});

// Define the schema for data validation
const dataValidationSchema = z.object({
  validateParcelIds: z.boolean().default(true),
  validateAddresses: z.boolean().default(true),
  validateOwnerNames: z.boolean().default(true),
  validateBoundaries: z.boolean().default(true),
  validateZoning: z.boolean().default(true)
});

type CountyInfoFormValues = z.infer<typeof countyInfoSchema>;
type DataValidationFormValues = z.infer<typeof dataValidationSchema>;

/**
 * CountyOnboardingWorkflow guides users through the process of onboarding a new county
 */
const CountyOnboardingWorkflow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [countyInfo, setCountyInfo] = useState<CountyInfoFormValues | null>(null);
  const [parcelFiles, setParcelFiles] = useState<File[]>([]);
  const [platFiles, setPlatFiles] = useState<File[]>([]);
  const [taxCodeFiles, setTaxCodeFiles] = useState<File[]>([]);
  const [validationOptions, setValidationOptions] = useState<DataValidationFormValues | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [validationResults, setValidationResults] = useState<any>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadFiles, isUploading } = useFileUpload();
  const { runETLProcess, isRunningETL } = useETLProcess();

  // Setup form for county information
  const countyInfoForm = useForm<CountyInfoFormValues>({
    resolver: zodResolver(countyInfoSchema),
    defaultValues: {
      name: '',
      code: '',
      state: '',
      contactEmail: '',
      description: ''
    }
  });

  // Setup form for data validation options
  const validationForm = useForm<DataValidationFormValues>({
    resolver: zodResolver(dataValidationSchema),
    defaultValues: {
      validateParcelIds: true,
      validateAddresses: true,
      validateOwnerNames: true,
      validateBoundaries: true,
      validateZoning: true
    }
  });

  // Handle county info form submission
  const onCountyInfoSubmit = useCallback((data: CountyInfoFormValues) => {
    setCountyInfo(data);
    setStep(1);
  }, []);

  // Handle file uploads for parcels
  const handleParcelUpload = useCallback((files: File[]) => {
    setParcelFiles(files);
  }, []);

  // Handle file uploads for plats
  const handlePlatUpload = useCallback((files: File[]) => {
    setPlatFiles(files);
  }, []);

  // Handle file uploads for tax codes
  const handleTaxCodeUpload = useCallback((files: File[]) => {
    setTaxCodeFiles(files);
  }, []);

  // Handle data upload step completion
  const handleDataUploadComplete = useCallback(() => {
    if (parcelFiles.length === 0) {
      toast({
        title: 'Required Files Missing',
        description: 'Please upload at least one parcel data file',
        variant: 'destructive'
      });
      return;
    }
    
    setStep(2);
  }, [parcelFiles.length, toast]);

  // Handle validation options form submission
  const onValidationOptionsSubmit = useCallback((data: DataValidationFormValues) => {
    setValidationOptions(data);
    setStep(3);
  }, []);

  // Handle the ETL process
  const handleRunETLProcess = useCallback(async () => {
    if (!countyInfo) return;
    
    try {
      setIsProcessing(true);
      setProcessingStatus('Creating county directory structure...');
      setProcessingProgress(5);
      
      // Create the county directories
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      
      setProcessingStatus('Uploading data files...');
      setProcessingProgress(15);
      
      // Upload the files
      const uploadResults = await uploadFiles({
        countyName: countyInfo.name,
        parcelFiles,
        platFiles,
        taxCodeFiles
      });
      
      setProcessingStatus('Running ETL process...');
      setProcessingProgress(30);
      
      // Run the ETL process
      const etlResult = await runETLProcess({
        countyName: countyInfo.name,
        countyCode: countyInfo.code,
        validationOptions: validationOptions || undefined
      }, (progress) => {
        setProcessingProgress(30 + Math.floor(progress * 0.6));
        setProcessingStatus(`Processing data (${Math.floor(progress)}%)...`);
      });
      
      setProcessingStatus('Validating data...');
      setProcessingProgress(90);
      
      // Set validation results
      setValidationResults(etlResult.validationResults);
      
      setProcessingStatus('Onboarding complete!');
      setProcessingProgress(100);
      
      // Move to final step
      setStep(4);
    } catch (error) {
      toast({
        title: 'Processing Error',
        description: `Error during ETL process: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [countyInfo, parcelFiles, platFiles, taxCodeFiles, uploadFiles, runETLProcess, validationOptions, toast]);

  // Handle completion of the workflow
  const handleComplete = useCallback(() => {
    toast({
      title: 'County Onboarded',
      description: `${countyInfo?.name} County has been successfully onboarded!`
    });
    
    // Navigate to the county dashboard
    navigate(`/counties/${countyInfo?.code}`);
  }, [countyInfo, navigate, toast]);

  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle>County Information</CardTitle>
              <CardDescription>
                Enter basic information about the county you're onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...countyInfoForm}>
                <form onSubmit={countyInfoForm.handleSubmit(onCountyInfoSubmit)} className="space-y-4">
                  <FormField
                    control={countyInfoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Benton" {...field} />
                        </FormControl>
                        <FormDescription>
                          The full name of the county
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={countyInfoForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. BEN" {...field} />
                        </FormControl>
                        <FormDescription>
                          A short code for the county (2-5 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={countyInfoForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. WA" {...field} />
                        </FormControl>
                        <FormDescription>
                          The state where the county is located
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={countyInfoForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="e.g. gis@county.gov" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email address for county data questions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={countyInfoForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description..." {...field} />
                        </FormControl>
                        <FormDescription>
                          A brief description of the county
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Next: Upload Data</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        );
        
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Upload County Data</CardTitle>
              <CardDescription>
                Upload parcel, plat, and tax code data files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="data-upload-section">
                  <h3 className="text-lg font-medium">Parcel Data (Required)</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Upload CSV, Shapefile, or GeoDatabase files with parcel data
                  </p>
                  <div className="file-upload-control">
                    {/* File upload component would go here */}
                    <Button className="mr-2" onClick={() => document.getElementById('parcel-files')?.click()}>
                      Select Files
                    </Button>
                    <span>{parcelFiles.length} files selected</span>
                    <input 
                      id="parcel-files" 
                      type="file" 
                      hidden 
                      multiple 
                      onChange={(e) => handleParcelUpload(Array.from(e.target.files || []))} 
                    />
                  </div>
                  {parcelFiles.length > 0 && (
                    <ul className="text-sm mt-2">
                      {parcelFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="data-upload-section">
                  <h3 className="text-lg font-medium">Plat Maps (Optional)</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Upload plat map files if available
                  </p>
                  <div className="file-upload-control">
                    <Button className="mr-2" onClick={() => document.getElementById('plat-files')?.click()}>
                      Select Files
                    </Button>
                    <span>{platFiles.length} files selected</span>
                    <input 
                      id="plat-files" 
                      type="file" 
                      hidden 
                      multiple 
                      onChange={(e) => handlePlatUpload(Array.from(e.target.files || []))} 
                    />
                  </div>
                  {platFiles.length > 0 && (
                    <ul className="text-sm mt-2">
                      {platFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="data-upload-section">
                  <h3 className="text-lg font-medium">Tax Code Data (Optional)</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Upload tax code data files if available
                  </p>
                  <div className="file-upload-control">
                    <Button className="mr-2" onClick={() => document.getElementById('tax-files')?.click()}>
                      Select Files
                    </Button>
                    <span>{taxCodeFiles.length} files selected</span>
                    <input 
                      id="tax-files" 
                      type="file" 
                      hidden 
                      multiple 
                      onChange={(e) => handleTaxCodeUpload(Array.from(e.target.files || []))} 
                    />
                  </div>
                  {taxCodeFiles.length > 0 && (
                    <ul className="text-sm mt-2">
                      {taxCodeFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={handleDataUploadComplete}>
                Next: Validation Options
              </Button>
            </CardFooter>
          </Card>
        );
        
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Data Validation Options</CardTitle>
              <CardDescription>
                Configure how data should be validated during processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...validationForm}>
                <form onSubmit={validationForm.handleSubmit(onValidationOptionsSubmit)} className="space-y-4">
                  <FormField
                    control={validationForm.control}
                    name="validateParcelIds"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input 
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            id="validateParcelIds"
                          />
                        </FormControl>
                        <div>
                          <FormLabel htmlFor="validateParcelIds">Validate Parcel IDs</FormLabel>
                          <FormDescription>
                            Check for valid and unique parcel identifiers
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={validationForm.control}
                    name="validateAddresses"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input 
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            id="validateAddresses"
                          />
                        </FormControl>
                        <div>
                          <FormLabel htmlFor="validateAddresses">Validate Addresses</FormLabel>
                          <FormDescription>
                            Check for valid property addresses
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={validationForm.control}
                    name="validateOwnerNames"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input 
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            id="validateOwnerNames"
                          />
                        </FormControl>
                        <div>
                          <FormLabel htmlFor="validateOwnerNames">Validate Owner Names</FormLabel>
                          <FormDescription>
                            Check for valid property owner names
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={validationForm.control}
                    name="validateBoundaries"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input 
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            id="validateBoundaries"
                          />
                        </FormControl>
                        <div>
                          <FormLabel htmlFor="validateBoundaries">Validate Boundaries</FormLabel>
                          <FormDescription>
                            Check for valid and topologically correct boundaries
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={validationForm.control}
                    name="validateZoning"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input 
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            id="validateZoning"
                          />
                        </FormControl>
                        <div>
                          <FormLabel htmlFor="validateZoning">Validate Zoning</FormLabel>
                          <FormDescription>
                            Check for valid zoning codes
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Next: Process Data</Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            </CardFooter>
          </Card>
        );
        
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Process Data</CardTitle>
              <CardDescription>
                Process and integrate the county data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="process-summary">
                  <h3 className="text-lg font-medium">Processing Summary</h3>
                  
                  <div className="mt-4 space-y-2">
                    <div>
                      <strong>County:</strong> {countyInfo?.name}, {countyInfo?.state}
                    </div>
                    <div>
                      <strong>Files:</strong> {parcelFiles.length + platFiles.length + taxCodeFiles.length} total files
                      ({parcelFiles.length} parcel, {platFiles.length} plat, {taxCodeFiles.length} tax code)
                    </div>
                    <div>
                      <strong>Validation:</strong> {Object.entries(validationOptions || {})
                        .filter(([_, value]) => value)
                        .map(([key]) => key.replace('validate', ''))
                        .join(', ')}
                    </div>
                  </div>
                </div>
                
                {isProcessing && (
                  <div className="processing-status">
                    <h3 className="text-lg font-medium mb-2">Processing Status</h3>
                    <div className="progress-bar-container h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="progress-bar h-full bg-blue-500"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm">{processingStatus}</div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button 
                onClick={handleRunETLProcess}
                disabled={isProcessing || isUploading || isRunningETL}
              >
                {isProcessing ? 'Processing...' : 'Start Processing'}
              </Button>
            </CardFooter>
          </Card>
        );
        
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Complete</CardTitle>
              <CardDescription>
                {countyInfo?.name} County has been successfully onboarded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="completion-summary">
                  <h3 className="text-lg font-medium">Summary</h3>
                  
                  <div className="mt-4 space-y-2">
                    <div>
                      <strong>County:</strong> {countyInfo?.name}, {countyInfo?.state}
                    </div>
                    <div>
                      <strong>Files Processed:</strong> {parcelFiles.length + platFiles.length + taxCodeFiles.length} total files
                    </div>
                    
                    {validationResults && (
                      <div className="validation-results mt-4">
                        <h4 className="font-medium">Validation Results</h4>
                        
                        <div className="mt-2 p-4 bg-gray-50 rounded-md">
                          <div className="mb-2">
                            <strong>Parcels:</strong> {validationResults.parcels?.total} processed
                            {validationResults.parcels?.errors > 0 && (
                              <span className="text-red-500 ml-2">
                                ({validationResults.parcels.errors} errors)
                              </span>
                            )}
                          </div>
                          
                          {validationResults.plats && (
                            <div className="mb-2">
                              <strong>Plats:</strong> {validationResults.plats.total} processed
                              {validationResults.plats.errors > 0 && (
                                <span className="text-red-500 ml-2">
                                  ({validationResults.plats.errors} errors)
                                </span>
                              )}
                            </div>
                          )}
                          
                          {validationResults.tax_codes && (
                            <div className="mb-2">
                              <strong>Tax Codes:</strong> {validationResults.tax_codes.total} processed
                              {validationResults.tax_codes.errors > 0 && (
                                <span className="text-red-500 ml-2">
                                  ({validationResults.tax_codes.errors} errors)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="next-steps">
                  <h3 className="text-lg font-medium">Next Steps</h3>
                  
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Review any validation errors and fix them in the source data</li>
                    <li>Configure map layers and styling for the county</li>
                    <li>Set up user permissions for county staff</li>
                    <li>Create workflow templates for the county</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </Button>
              <Button onClick={handleComplete}>
                Go to County Dashboard
              </Button>
            </CardFooter>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="county-onboarding-workflow">
      <div className="workflow-header mb-6">
        <h1 className="text-2xl font-bold">Onboard New County</h1>
        <p className="text-gray-500">
          Follow the steps below to onboard a new county to the TerraFusion platform
        </p>
      </div>
      
      <div className="workflow-stepper mb-8">
        <Stepper activeStep={step}>
          <Step label="County Info" />
          <Step label="Upload Data" />
          <Step label="Validation Options" />
          <Step label="Process Data" />
          <Step label="Complete" />
        </Stepper>
      </div>
      
      <div className="workflow-content">
        {renderStep()}
      </div>
    </div>
  );
};

export default CountyOnboardingWorkflow;