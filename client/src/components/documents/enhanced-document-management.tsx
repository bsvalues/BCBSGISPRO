import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BatchDocumentProcessor } from './batch-document-processor';
import { DocumentVersionControl } from './document-version-control';
import { DocumentParcelManager } from './document-parcel-manager';
import { DocumentClassificationResult } from './document-classification-result';
import { getDocumentTypeLabel } from '@shared/document-types';
import { formatDistanceToNow } from 'date-fns';
import { 
  FileText, 
  Upload, 
  Clock, 
  Tag, 
  Search, 
  Eye, 
  History, 
  Map, 
  AlertTriangle, 
  UploadCloud
} from 'lucide-react';
import { Document, Workflow } from '@shared/schema';

interface EnhancedDocumentManagementProps {
  workflow: Workflow;
}

export function EnhancedDocumentManagement({ workflow }: EnhancedDocumentManagementProps) {
  const [showBatchUploader, setShowBatchUploader] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // Fetch documents for the workflow
  const { 
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/workflows/${workflow.id}/documents`],
    enabled: !!workflow.id,
  });
  
  const handleBatchUploaderComplete = () => {
    setShowBatchUploader(false);
    refetch();
  };
  
  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Documents</h3>
        <p className="text-slate-500">
          There was a problem fetching documents for this workflow
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Document Management</h2>
          <p className="text-muted-foreground">
            Manage documents for {workflow.title}
          </p>
        </div>
        
        <Button onClick={() => setShowBatchUploader(true)}>
          <UploadCloud className="h-4 w-4 mr-2" />
          Batch Upload
        </Button>
      </div>
      
      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Workflow Documents
          </CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} in this workflow
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {documents.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
                      <TableCell 
                        className="font-medium"
                        onClick={() => handleViewDocument(document)}
                      >
                        {document.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {document.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          {formatDistanceToNow(new Date(document.uploadedAt))} ago
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-md">
              <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
              <p className="text-slate-500 mb-6">
                This workflow doesn't have any documents yet
              </p>
              <Button onClick={() => setShowBatchUploader(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Batch Document Uploader Dialog */}
      <Dialog 
        open={showBatchUploader} 
        onOpenChange={setShowBatchUploader}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Document Upload</DialogTitle>
            <DialogDescription>
              Upload and classify multiple documents at once
            </DialogDescription>
          </DialogHeader>
          
          <BatchDocumentProcessor 
            workflowId={workflow.id} 
            onComplete={handleBatchUploaderComplete} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Document Detail View */}
      <Dialog 
        open={selectedDocument !== null} 
        onOpenChange={(open) => !open && setSelectedDocument(null)}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="details" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-1">
                  <History className="h-4 w-4" />
                  <span>Version History</span>
                </TabsTrigger>
                <TabsTrigger value="parcels" className="flex items-center gap-1">
                  <Map className="h-4 w-4" />
                  <span>Linked Parcels</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Document Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Name</h4>
                        <p className="text-slate-800 dark:text-slate-200">
                          {selectedDocument.name}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Type</h4>
                          <Badge className="capitalize">
                            {getDocumentTypeLabel(selectedDocument.type)}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Content Type</h4>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {selectedDocument.contentType}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Uploaded</h4>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(selectedDocument.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Last Updated</h4>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(selectedDocument.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        Classification Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDocument.classification ? (
                        <DocumentClassificationResult 
                          classification={{
                            documentType: selectedDocument.classification.documentType,
                            confidence: selectedDocument.classification.confidence,
                            documentTypeLabel: getDocumentTypeLabel(selectedDocument.classification.documentType),
                            wasManuallyClassified: selectedDocument.classification.wasManuallyClassified
                          }}
                        />
                      ) : (
                        <div className="text-center py-6">
                          <Tag className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                          <h3 className="text-base font-medium mb-1">Not Classified</h3>
                          <p className="text-sm text-slate-500">
                            This document hasn't been classified yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Document Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                      <FileText className="h-12 w-12 text-slate-400" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button variant="outline">
                      Download Document
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="versions">
                <DocumentVersionControl document={selectedDocument} />
              </TabsContent>
              
              <TabsContent value="parcels">
                <DocumentParcelManager document={selectedDocument} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}