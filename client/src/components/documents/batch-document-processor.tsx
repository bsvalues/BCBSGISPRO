import { useState, useCallback, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDocumentClassifier, ClassificationResult } from '@/hooks/use-document-classifier';
import { CircleAlert, File, FileCheck, X, UploadCloud, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';

interface BatchDocumentProcessorProps {
  workflowId: number;
  onComplete?: () => void;
}

type FileStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface BatchFile {
  file: File;
  id: string;
  status: FileStatus;
  progress: number;
  error?: string;
  classification?: ClassificationResult;
  documentId?: number;
}

export function BatchDocumentProcessor({ workflowId, onComplete }: BatchDocumentProcessorProps) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadWithClassification } = useDocumentClassifier();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, []);
  
  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      file,
      id: crypto.randomUUID(),
      status: 'queued' as FileStatus,
      progress: 0
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);
  
  const removeFile = useCallback((id: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  }, []);
  
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);
  
  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  const processFiles = useCallback(async () => {
    if (files.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    // Process files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Skip already processed files
      if (file.status === 'completed') continue;
      
      // Mark file as processing
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing', progress: 10 } 
            : f
        )
      );
      
      try {
        // Read file as base64
        const content = await readFileAsBase64(file.file);
        
        // Update progress
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id ? { ...f, progress: 50 } : f
          )
        );
        
        // Upload and classify the document
        const result = await uploadWithClassification({
          workflowId,
          name: file.file.name,
          content
        });
        
        // Mark as completed with classification result
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: 'completed', 
                  progress: 100,
                  classification: result.classification,
                  documentId: result.document.id
                } 
              : f
          )
        );
        
      } catch (error) {
        // Mark as failed with error message
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: 'failed', 
                  progress: 100,
                  error: error instanceof Error ? error.message : 'Upload failed'
                } 
              : f
          )
        );
      }
    }
    
    // Invalidate document queries to refresh the document list
    queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documents`] });
    
    setIsProcessing(false);
    
    // Notify user
    toast({
      title: 'Batch Processing Complete',
      description: `Processed ${files.length} documents`
    });
    
    // Call completion callback if provided
    if (onComplete) {
      onComplete();
    }
  }, [files, isProcessing, workflowId, uploadWithClassification, toast, onComplete]);
  
  const retryFile = useCallback(async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    
    // Reset file status
    setFiles(prevFiles => 
      prevFiles.map(f => 
        f.id === id ? { ...f, status: 'queued', progress: 0, error: undefined } : f
      )
    );
    
    // Start processing files again
    setIsProcessing(true);
    
    try {
      // Mark file as processing
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === id ? { ...f, status: 'processing', progress: 10 } : f
        )
      );
      
      // Read file as base64
      const content = await readFileAsBase64(file.file);
      
      // Update progress
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === id ? { ...f, progress: 50 } : f
        )
      );
      
      // Upload and classify the document
      const result = await uploadWithClassification({
        workflowId,
        name: file.file.name,
        content
      });
      
      // Mark as completed with classification result
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === id
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100,
                classification: result.classification,
                documentId: result.document.id
              } 
            : f
        )
      );
      
      // Invalidate document queries
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documents`] });
      
      // Notify user
      toast({
        title: 'Document Processed',
        description: `Successfully processed ${file.file.name}`
      });
      
    } catch (error) {
      // Mark as failed with error message
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === id 
            ? { 
                ...f, 
                status: 'failed', 
                progress: 100,
                error: error instanceof Error ? error.message : 'Upload failed'
              } 
            : f
        )
      );
      
      // Notify user
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
    
    setIsProcessing(false);
  }, [files, workflowId, uploadWithClassification, toast]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" />
          Batch Document Processor
        </CardTitle>
        <CardDescription>
          Upload and classify multiple documents at once
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Drop Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            isProcessing ? "opacity-50 cursor-not-allowed" : ""
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            disabled={isProcessing}
            aria-label="upload files"
          />
          
          <UploadCloud className="h-12 w-12 mx-auto text-primary/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">Drag and drop files here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, JPEG, PNG, TIFF, Word, Excel
          </p>
        </div>
        
        {/* File Queue */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Document Queue ({files.length})</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearFiles}
                disabled={isProcessing}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto rounded-md border p-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center gap-3 p-2 rounded-md bg-slate-50 dark:bg-slate-900">
                  <div className="flex-shrink-0">
                    <File className="h-8 w-8 text-slate-400" />
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="truncate font-medium text-sm">
                        {file.file.name}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {file.status === 'queued' && (
                          <Badge variant="outline">Queued</Badge>
                        )}
                        
                        {file.status === 'processing' && (
                          <Badge variant="secondary" className="animate-pulse">
                            Processing
                          </Badge>
                        )}
                        
                        {file.status === 'completed' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <FileCheck className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        
                        {file.status === 'failed' && (
                          <Badge variant="destructive">
                            <CircleAlert className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                        
                        {file.status !== 'processing' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFile(file.id)}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {file.status === 'processing' && (
                      <Progress value={file.progress} className="h-1.5" />
                    )}
                    
                    {file.status === 'failed' && (
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-red-500 truncate">
                          {file.error}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs py-0 px-2"
                          onClick={() => retryFile(file.id)}
                          disabled={isProcessing}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    )}
                    
                    {file.status === 'completed' && file.classification && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-400">
                          Type: <span className="font-medium">{file.classification.documentTypeLabel}</span>
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          Confidence: <span className="font-medium">{Math.round(file.classification.confidence * 100)}%</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onComplete}
        >
          Cancel
        </Button>
        
        <Button
          onClick={processFiles}
          disabled={files.length === 0 || isProcessing || files.every(f => f.status === 'completed')}
        >
          {isProcessing ? 'Processing...' : 'Process Files'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper function to read a file as base64
async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      // Convert to base64 string, removing the data URL prefix
      const base64 = event.target.result.toString().split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
}