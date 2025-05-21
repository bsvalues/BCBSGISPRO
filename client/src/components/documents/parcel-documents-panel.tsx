import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../../lib/queryClient';
import { useRbacAuth } from '../../context/rbac-auth-context';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Tag,
  File,
  FilePlus,
  Search,
  FileCheck,
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Document status colors
const statusColors = {
  'draft': 'bg-gray-500',
  'pending': 'bg-yellow-500',
  'approved': 'bg-green-500',
  'rejected': 'bg-red-500',
  'archived': 'bg-purple-500',
};

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  uploadDate: string;
  size: number;
  uploadedBy: string;
  tags?: string[];
  classification?: {
    documentType: string;
    confidence: number;
  };
}

interface ParcelDocumentsPanelProps {
  parcel?: any;
}

const ParcelDocumentsPanel: React.FC<ParcelDocumentsPanelProps> = ({ parcel }) => {
  const { user, hasRole } = useRbacAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [tags, setTags] = useState('');
  const [currentTab, setCurrentTab] = useState('all');

  // Fetch documents for the parcel
  const { data: documents = [], isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents/parcel', parcel?.APN],
    enabled: !!parcel?.APN,
  });

  // Filter documents based on search and tab
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (currentTab === 'all') return matchesSearch;
    return matchesSearch && doc.status === currentTab;
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/documents', { body: formData });
    },
    onSuccess: () => {
      toast({
        title: 'Document uploaded',
        description: 'The document has been uploaded and associated with the parcel.',
      });
      setUploadFile(null);
      setDocumentType('');
      setTags('');
      // Refetch documents
      queryClient.invalidateQueries({ queryKey: ['/api/documents/parcel', parcel?.APN] });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive',
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest('DELETE', `/api/documents/${documentId}`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Document deleted',
        description: 'The document has been removed from the parcel.',
      });
      setSelectedDocument(null);
      // Refetch documents
      queryClient.invalidateQueries({ queryKey: ['/api/documents/parcel', parcel?.APN] });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'An error occurred while deleting',
        variant: 'destructive',
      });
    },
  });

  // Handle document upload
  const handleUpload = () => {
    if (!uploadFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('parcelId', parcel?.APN || '');
    formData.append('type', documentType);
    
    if (tags) {
      formData.append('tags', tags);
    }

    uploadDocumentMutation.mutate(formData);
  };

  // Handle document deletion
  const handleDelete = () => {
    if (selectedDocument) {
      deleteDocumentMutation.mutate(selectedDocument.id);
    }
  };

  // Navigate to document detail page
  const handleViewDocument = (document: Document) => {
    setLocation(`/documents/${document.id}`);
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  // If error loading documents
  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-500 font-medium">Error loading documents</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Failed to fetch documents for this parcel'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs for document filtering */}
      <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-2">
          <DocumentList 
            documents={filteredDocuments} 
            isLoading={isLoading}
            onSelect={setSelectedDocument}
            selectedDocument={selectedDocument}
            onView={handleViewDocument}
          />
        </TabsContent>
        
        {['draft', 'pending', 'approved', 'rejected'].map(status => (
          <TabsContent key={status} value={status} className="mt-2">
            <DocumentList 
              documents={filteredDocuments}
              isLoading={isLoading}
              onSelect={setSelectedDocument}
              selectedDocument={selectedDocument}
              onView={handleViewDocument}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Document Preview and Details */}
      {selectedDocument ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-medium">{selectedDocument.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedDocument.type}</p>
                </div>
              </div>
              <Badge className={`${statusColors[selectedDocument.status] || 'bg-gray-500'}`}>
                {selectedDocument.status}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium text-muted-foreground">Uploaded:</span>
                <p>{new Date(selectedDocument.uploadDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Size:</span>
                <p>{formatFileSize(selectedDocument.size)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">By:</span>
                <p>{selectedDocument.uploadedBy}</p>
              </div>
            </div>
            
            {selectedDocument.tags && selectedDocument.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedDocument.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex justify-between mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => handleViewDocument(selectedDocument)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Details
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                
                {hasRole(['admin', 'staff']) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="text-xs">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this document from the parcel association.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Upload Document */}
      {hasRole(['admin', 'staff']) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-medium flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Document
            </h3>
            
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="file-upload" className="text-xs">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="text-xs"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="doc-type" className="text-xs">Document Type</Label>
                <Input
                  id="doc-type"
                  placeholder="e.g., deed, survey, permit"
                  className="text-xs"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="doc-tags" className="text-xs">Tags (comma separated)</Label>
                <Input
                  id="doc-tags"
                  placeholder="e.g., boundary, subdivision, official"
                  className="text-xs"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              className="w-full text-xs" 
              size="sm"
              onClick={handleUpload}
              disabled={!uploadFile || uploadDocumentMutation.isPending}
            >
              {uploadDocumentMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FilePlus className="h-3 w-3 mr-2" />
                  Upload and Associate with Parcel
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Document list component
interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onSelect: (doc: Document) => void;
  selectedDocument: Document | null;
  onView: (doc: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  documents, 
  isLoading, 
  onSelect, 
  selectedDocument,
  onView
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <File className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>No documents found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-48">
      <div className="space-y-1">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
              selectedDocument?.id === doc.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent'
            }`}
            onClick={() => onSelect(doc)}
          >
            <div className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium truncate max-w-[150px]">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.type}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${statusColors[doc.status] || 'bg-gray-500'} text-[10px]`}>
                {doc.status}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={(e) => {
                  e.stopPropagation();
                  onView(doc);
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ParcelDocumentsPanel;