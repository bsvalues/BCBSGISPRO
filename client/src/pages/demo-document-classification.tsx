import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  ChevronLeft, 
  Plus,
  Clock,
  RotateCcw,
  BookOpen,
  MapPin,
  BarChart,
  Clipboard,
  FileInput,
  ScanLine
} from 'lucide-react';
import { demoDocuments } from '@/data/demo-property-data';

const DOCUMENT_TYPES = [
  'DEED',
  'PLAT',
  'SURVEY',
  'EASEMENT',
  'TAX_RECORD',
  'LEGAL_DESCRIPTION',
  'PERMIT',
  'COVENANT',
  'ASSESSMENT',
  'TITLE_REPORT',
  'COURT_ORDER',
  'CORRESPONDENCE'
];

interface ClassificationResult {
  documentType: string;
  confidence: number;
  extractedEntities: {
    parcelNumbers?: string[];
    ownerNames?: string[];
    addresses?: string[];
    dates?: string[];
    legalDescriptions?: string[];
  };
  suggestedTags: string[];
  processingSteps: {
    step: string;
    status: 'complete' | 'pending' | 'failed';
    message?: string;
  }[];
}

const DemoDocumentClassification: React.FC = () => {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [documentText, setDocumentText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [recentDocuments, setRecentDocuments] = useState(demoDocuments.slice(0, 3));

  // Sample document text for demonstration purposes
  const sampleBLAText = `BOUNDARY LINE ADJUSTMENT
FILE NO. BLA-2025-042
BENTON COUNTY COMMUNITY DEVELOPMENT DEPARTMENT

LEGAL DESCRIPTION OF ORIGINAL PARCELS:

PARCEL A (PARCEL NO. 1-2345-401-1670-001):
THE EAST 125 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION,
AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY,
WASHINGTON.

PARCEL B (PARCEL NO. 1-0495-203-0072-003):
THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8, BLOCK 3, SUNNYDALE ADDITION,
AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY,
WASHINGTON.

LEGAL DESCRIPTION OF ADJUSTMENT AREA:
THE EAST 25 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION.`;

  const sampleDeedText = `STATUTORY WARRANTY DEED
Recording Requested By:
First Benton Title Company
When Recorded Return To:
Rodriguez Family Trust
1470 Brentwood Drive
Richland, WA 99352

GRANTOR: John Smith and Mary Smith, husband and wife
GRANTEE: Rodriguez Family Trust
Abbreviated Legal Description: LOT 16, BLOCK 7, MEADOW SPRINGS ADDITION NO. 4
Full Legal Description: LOT 16, BLOCK 7, MEADOW SPRINGS ADDITION NO. 4, CITY OF RICHLAND, BENTON COUNTY, WASHINGTON.
Assessor's Tax Parcel ID#: 1-2345-401-1670-001

THE GRANTOR John Smith and Mary Smith, husband and wife, for and in consideration of Ten Dollars and Other Good and Valuable Consideration, conveys and warrants to Rodriguez Family Trust, the following described real estate, situated in the County of Benton, State of Washington:

LOT 16, BLOCK 7, MEADOW SPRINGS ADDITION NO. 4, CITY OF RICHLAND, BENTON COUNTY, WASHINGTON.

Subject to: Covenants, conditions, restrictions and easements of record.

Dated this 12th day of December, 2023.`;

  const handleUseSampleText = (type: 'bla' | 'deed') => {
    setDocumentText(type === 'bla' ? sampleBLAText : sampleDeedText);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const simulateProcessing = () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newValue = prev + Math.random() * 15;
        return newValue > 100 ? 100 : newValue;
      });
    }, 300);
    
    // After 3 seconds, complete the process and show a result
    setTimeout(() => {
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      // Set a simulated result
      const result: ClassificationResult = documentText.includes('BOUNDARY LINE ADJUSTMENT')
        ? {
            documentType: 'LEGAL_DESCRIPTION',
            confidence: 91.2,
            extractedEntities: {
              parcelNumbers: ['1-2345-401-1670-001', '1-0495-203-0072-003'],
              ownerNames: [],
              addresses: [],
              dates: [],
              legalDescriptions: [
                'THE EAST 125 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION',
                'THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8, BLOCK 3, SUNNYDALE ADDITION'
              ]
            },
            suggestedTags: ['boundary adjustment', 'sunnydale', 'lot adjustment'],
            processingSteps: [
              { step: 'Document Scanning', status: 'complete' },
              { step: 'Text Extraction', status: 'complete' },
              { step: 'Classification', status: 'complete' },
              { step: 'Entity Extraction', status: 'complete' },
              { step: 'Parcel Association', status: 'complete' }
            ]
          }
        : {
            documentType: 'DEED',
            confidence: 95.7,
            extractedEntities: {
              parcelNumbers: ['1-2345-401-1670-001'],
              ownerNames: ['John Smith', 'Mary Smith', 'Rodriguez Family Trust'],
              addresses: ['1470 Brentwood Drive, Richland, WA 99352'],
              dates: ['12th day of December, 2023'],
              legalDescriptions: ['LOT 16, BLOCK 7, MEADOW SPRINGS ADDITION NO. 4, CITY OF RICHLAND, BENTON COUNTY, WASHINGTON']
            },
            suggestedTags: ['warranty deed', 'meadow springs', 'property transfer'],
            processingSteps: [
              { step: 'Document Scanning', status: 'complete' },
              { step: 'Text Extraction', status: 'complete' },
              { step: 'Classification', status: 'complete' },
              { step: 'Entity Extraction', status: 'complete' },
              { step: 'Parcel Association', status: 'complete' }
            ]
          };
      
      setClassificationResult(result);
      setIsProcessing(false);
      
      // Add to recent documents
      const newDocument = {
        id: Math.random().toString(36).substring(2, 11),
        name: selectedFile ? selectedFile.name : `${result.documentType} - ${new Date().toLocaleString()}`,
        type: result.documentType,
        parcelId: result.extractedEntities.parcelNumbers?.[0] || '',
        uploadDate: new Date().toISOString(),
        size: 1250000,
        isArchived: false,
        metadata: {
          documentNumber: `DOC-${Math.floor(Math.random() * 1000000)}`,
          recordingDate: new Date().toISOString().split('T')[0],
          parties: result.extractedEntities.ownerNames || [],
          description: result.documentType
        }
      };
      
      setRecentDocuments([newDocument, ...recentDocuments.slice(0, 2)]);
      
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (documentText || selectedFile) {
      simulateProcessing();
    }
  };

  const handleReset = () => {
    setDocumentText('');
    setSelectedFile(null);
    setClassificationResult(null);
    setProcessingProgress(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center mb-2">
            <Button 
              variant="ghost" 
              className="p-0 mr-2" 
              onClick={() => setLocation('/demo-dashboard')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Document Classification</h1>
          </div>
          <p className="text-muted-foreground">
            Automatically classify, extract data, and organize property documents
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classification Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Document Processing</CardTitle>
                <CardDescription>Upload or paste document text to classify and extract information</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="upload">Upload Document</TabsTrigger>
                    <TabsTrigger value="paste">Paste Text</TabsTrigger>
                    <TabsTrigger value="sample">Sample Documents</TabsTrigger>
                  </TabsList>

                  {/* Upload Tab */}
                  <TabsContent value="upload">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      {selectedFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <p className="text-lg font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {selectedFile.type || 'Unknown type'}
                          </p>
                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              className="mr-2"
                              onClick={() => setSelectedFile(null)}
                            >
                              Change File
                            </Button>
                            <Button onClick={handleSubmit}>
                              Process Document
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center">
                            <div className="p-3 bg-primary/10 rounded-full">
                              <Upload className="h-8 w-8 text-primary" />
                            </div>
                          </div>
                          <h3 className="text-lg font-medium">Drop files here or click to upload</h3>
                          <p className="text-sm text-muted-foreground">
                            Support for PDF, DOCX, JPEG, and PNG files. Maximum size 10MB.
                          </p>
                          <div className="pt-4">
                            <Label 
                              htmlFor="file-upload" 
                              className="inline-flex h-9 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium cursor-pointer hover:bg-primary/90"
                            >
                              Select File
                            </Label>
                            <Input 
                              id="file-upload" 
                              type="file" 
                              className="hidden" 
                              onChange={handleFileChange}
                              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Paste Text Tab */}
                  <TabsContent value="paste">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary/10 rounded-md mr-3">
                          <FileInput className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Paste Document Text</h3>
                          <p className="text-xs text-muted-foreground">
                            Paste the text content from your document for classification
                          </p>
                        </div>
                      </div>
                      <Textarea 
                        placeholder="Paste document text here..." 
                        className="min-h-[300px]" 
                        value={documentText}
                        onChange={(e) => setDocumentText(e.target.value)}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={handleReset}
                          disabled={!documentText}
                        >
                          Clear
                        </Button>
                        <Button 
                          onClick={handleSubmit}
                          disabled={!documentText}
                        >
                          Process Text
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Sample Documents Tab */}
                  <TabsContent value="sample">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Use one of these sample documents to test the classification system.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleUseSampleText('bla')}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center">
                              <BookOpen className="h-5 w-5 mr-2 text-primary" />
                              <CardTitle className="text-base">Boundary Line Adjustment</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Sample boundary line adjustment document with parcel details and legal descriptions.
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button variant="secondary" size="sm">Use Sample</Button>
                          </CardFooter>
                        </Card>
                        
                        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleUseSampleText('deed')}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-primary" />
                              <CardTitle className="text-base">Statutory Warranty Deed</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Sample deed document with property transfer information and legal description.
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button variant="secondary" size="sm">Use Sample</Button>
                          </CardFooter>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Processing Status */}
                {isProcessing && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Processing Document</h3>
                      <span className="text-sm">{Math.round(processingProgress)}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2" />
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {['Scanning', 'OCR', 'Classification', 'Extraction', 'Linking'].map((step, index) => (
                        <div 
                          key={step} 
                          className={`text-center text-xs ${
                            processingProgress >= (index + 1) * 20 ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Classification Result */}
                {classificationResult && (
                  <div className="mt-6 space-y-4">
                    <Alert className="bg-primary/10 border-primary/30">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertTitle>Document Processed Successfully</AlertTitle>
                      <AlertDescription>
                        Classification and extraction completed with {classificationResult.confidence.toFixed(1)}% confidence.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Document Type</h3>
                        <div className="flex items-center">
                          <Badge className="bg-primary text-primary-foreground text-sm mr-2">
                            {classificationResult.documentType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {classificationResult.confidence.toFixed(1)}% confidence
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Suggested Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {classificationResult.suggestedTags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Extracted Entities</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classificationResult.extractedEntities.parcelNumbers && classificationResult.extractedEntities.parcelNumbers.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Parcel Numbers</p>
                            <div className="flex flex-col space-y-1">
                              {classificationResult.extractedEntities.parcelNumbers.map(parcel => (
                                <Badge key={parcel} variant="outline" className="justify-start text-xs py-1 px-2 w-fit">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {parcel}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {classificationResult.extractedEntities.ownerNames && classificationResult.extractedEntities.ownerNames.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Owner Names</p>
                            <div className="flex flex-col space-y-1">
                              {classificationResult.extractedEntities.ownerNames.map(name => (
                                <span key={name} className="text-sm">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {classificationResult.extractedEntities.addresses && classificationResult.extractedEntities.addresses.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Addresses</p>
                            <div className="flex flex-col space-y-1">
                              {classificationResult.extractedEntities.addresses.map(address => (
                                <span key={address} className="text-sm">
                                  {address}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {classificationResult.extractedEntities.dates && classificationResult.extractedEntities.dates.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Dates</p>
                            <div className="flex flex-col space-y-1">
                              {classificationResult.extractedEntities.dates.map(date => (
                                <span key={date} className="text-sm">
                                  {date}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {classificationResult.extractedEntities.legalDescriptions && classificationResult.extractedEntities.legalDescriptions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Legal Descriptions</p>
                          <div className="space-y-2">
                            {classificationResult.extractedEntities.legalDescriptions.map((desc, index) => (
                              <div key={index} className="p-2 bg-secondary/20 rounded-md text-sm">
                                {desc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Processing Steps</h3>
                      <div className="space-y-2">
                        {classificationResult.processingSteps.map((step, index) => (
                          <div key={index} className="flex items-center">
                            {step.status === 'complete' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            ) : step.status === 'pending' ? (
                              <Clock className="h-4 w-4 text-amber-500 mr-2" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm">{step.step}</span>
                            {step.message && (
                              <span className="text-xs text-muted-foreground ml-2">
                                - {step.message}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <Button 
                        variant="outline" 
                        onClick={handleReset}
                        className="flex items-center"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Process Another Document
                      </Button>
                      <Button>Save and Catalog Document</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Document Types Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document Types</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 px-4">
                  <div className="space-y-2 pb-4">
                    {DOCUMENT_TYPES.map(type => (
                      <div key={type} className="flex items-center py-2">
                        <div className="p-1.5 rounded-md bg-primary/10 mr-3">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Documents</CardTitle>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {recentDocuments.map(doc => (
                    <div key={doc.id} className="border-b last:border-0 px-4 py-3 hover:bg-secondary/10 cursor-pointer">
                      <div className="flex items-start">
                        <div className="p-1.5 rounded-md bg-primary/10 mr-3">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{doc.name}</p>
                          <div className="flex items-center mt-1">
                            <Badge variant="secondary" className="text-xs mr-2">
                              {doc.type}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  View All Documents
                </Button>
              </CardFooter>
            </Card>
            
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Classification Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Average Accuracy</span>
                      <span className="font-medium">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Entity Extraction</span>
                      <span className="font-medium">87.5%</span>
                    </div>
                    <Progress value={87.5} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Processing Time</span>
                      <span className="font-medium">2.4s avg</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center gap-4 text-center text-sm">
                      <div>
                        <p className="font-medium">342</p>
                        <p className="text-xs text-muted-foreground">Documents Processed</p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <p className="font-medium">11</p>
                        <p className="text-xs text-muted-foreground">Document Types</p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <p className="font-medium">98.2%</p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoDocumentClassification;