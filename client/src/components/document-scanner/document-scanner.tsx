import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { useToast } from '../../hooks/use-toast';
import { Upload, FileText, Eye, AlertTriangle, RotateCw, CheckCircle2, X } from 'lucide-react';

interface DocumentScannerProps {
  onDocumentAnalyzed?: (results: DocumentAnalysisResult) => void;
}

interface DocumentAnalysisResult {
  title: string;
  propertyInfo: {
    parcelNumber?: string;
    legalDescription?: string;
    owner?: string;
    address?: string;
  };
  extractedText: string;
  confidence: number;
  metadata: {
    documentType: string;
    pageCount: number;
    createdAt: Date;
  };
}

export function DocumentScanner({ onDocumentAnalyzed }: DocumentScannerProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Check file type and size
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    const maxSize = 20 * 1024 * 1024; // 20MB

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or image file (JPEG, PNG, TIFF)',
        variant: 'destructive'
      });
      return;
    }

    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 20MB',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      // For PDFs, use a placeholder
      setPreview('/pdf-preview.png');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeDocument = async () => {
    if (!file) return;

    setAnalyzing(true);
    setUploadProgress(0);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('document', file);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Promise-based XHR request
      const response = await new Promise<DocumentAnalysisResult>((resolve, reject) => {
        xhr.open('POST', '/api/documents/analyze', true);
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.data);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      // Process and display results
      setAnalysisResult(response);
      setActiveTab('results');
      
      // Call the callback if provided
      if (onDocumentAnalyzed) {
        onDocumentAnalyzed(response);
      }

      toast({
        title: 'Document analyzed successfully',
        description: `Extracted information from ${file.name}`,
      });
    } catch (error) {
      console.error('Document analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze document',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      // Simulate file input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
    }
  };

  const preventDefault = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Document Scanner</CardTitle>
        <CardDescription>
          Upload and analyze property documents, title reports, and legal descriptions
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!analysisResult}>
            <FileText className="h-4 w-4 mr-2" />
            Analysis Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={preventDefault}
                onDragEnter={preventDefault}
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Document preview" 
                      className="max-h-[300px] mx-auto rounded-md object-contain"
                    />
                    <Button 
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop a document here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported formats: PDF, JPEG, PNG, TIFF (max 20MB)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </div>

              {file && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Document ready for analysis</AlertTitle>
                  <AlertDescription>
                    <p className="text-sm mb-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</p>
                    <p className="text-xs text-muted-foreground">
                      The document will be analyzed to extract property information, legal descriptions, and other relevant data.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {analyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading document...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={clearFile}
              disabled={!file || analyzing}
            >
              Clear
            </Button>
            <Button
              onClick={analyzeDocument}
              disabled={!file || analyzing}
            >
              {analyzing ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Analyze Document
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>

        <TabsContent value="results">
          {analysisResult && (
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{analysisResult.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Document Type: {analysisResult.metadata.documentType} ({analysisResult.metadata.pageCount} pages)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Confidence Score</span>
                    <span className="text-sm font-medium">{analysisResult.confidence}%</span>
                  </div>
                  <Progress 
                    value={analysisResult.confidence} 
                    className={analysisResult.confidence > 80 ? "bg-green-500" : 
                              analysisResult.confidence > 60 ? "bg-yellow-500" : "bg-red-500"}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Extracted Property Information</h4>
                  <div className="bg-slate-50 rounded-md p-4 space-y-3">
                    {analysisResult.propertyInfo.parcelNumber && (
                      <div>
                        <p className="text-xs text-muted-foreground">Parcel Number</p>
                        <p className="text-sm font-medium">{analysisResult.propertyInfo.parcelNumber}</p>
                      </div>
                    )}
                    
                    {analysisResult.propertyInfo.owner && (
                      <div>
                        <p className="text-xs text-muted-foreground">Owner</p>
                        <p className="text-sm font-medium">{analysisResult.propertyInfo.owner}</p>
                      </div>
                    )}
                    
                    {analysisResult.propertyInfo.address && (
                      <div>
                        <p className="text-xs text-muted-foreground">Property Address</p>
                        <p className="text-sm font-medium">{analysisResult.propertyInfo.address}</p>
                      </div>
                    )}
                    
                    {analysisResult.propertyInfo.legalDescription && (
                      <div>
                        <p className="text-xs text-muted-foreground">Legal Description</p>
                        <p className="text-sm font-mono whitespace-pre-wrap">{analysisResult.propertyInfo.legalDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Full Extracted Text</h4>
                  <div className="bg-slate-50 rounded-md p-4 max-h-[300px] overflow-y-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">{analysisResult.extractedText}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab('upload')}
            >
              Upload Another Document
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}