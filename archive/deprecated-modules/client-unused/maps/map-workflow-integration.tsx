import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRbacAuth } from '../../context/rbac-auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Workflow } from '@/lib/workflow-types';
import { Document } from '@/shared/schema';
import { FileText, MapPin, Plus, Map, Clock, CheckCircle2, ClipboardList, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

interface MapWorkflowIntegrationProps {
  parcelId: string;
  parcelAddress?: string;
  parcelOwner?: string;
  position: [number, number]; // [lat, lng]
}

const MapWorkflowIntegration: React.FC<MapWorkflowIntegrationProps> = ({
  parcelId,
  parcelAddress,
  parcelOwner,
  position
}) => {
  const { user, hasRole } = useRbacAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Get workflows for parcel
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['/api/workflows/parcel', parcelId],
    enabled: !!parcelId && isDialogOpen,
  });

  // Get documents for parcel
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents/parcel', parcelId],
    enabled: !!parcelId && isDialogOpen,
  });

  // Function to get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500';
      case 'in_progress': return 'bg-blue-500';
      case 'review': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-slate-500';
    }
  };

  // Function to format document type
  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Function to get document type icon
  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'deed':
      case 'legal_description':
        return <FileText className="h-4 w-4" />;
      case 'survey':
      case 'plat_map':
        return <Map className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Function to handle starting a new workflow
  const handleStartWorkflow = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start a new workflow",
        variant: "destructive"
      });
      return;
    }

    if (!hasRole(['admin', 'staff'])) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to start a new workflow",
        variant: "destructive"
      });
      return;
    }

    // Navigate to workflow creation page with parcel info
    setLocation(`/workflows/new?parcelId=${parcelId}`);
  };

  // Function to handle document upload
  const handleUploadDocument = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload documents",
        variant: "destructive"
      });
      return;
    }

    if (!hasRole(['admin', 'staff'])) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to upload documents",
        variant: "destructive"
      });
      return;
    }

    // Navigate to document upload page with parcel info
    setLocation(`/documents/upload?parcelId=${parcelId}`);
  };

  // Function to view workflow details
  const handleViewWorkflow = (workflow: Workflow) => {
    setLocation(`/workflows/${workflow.id}`);
  };

  // Function to view document details
  const handleViewDocument = (document: Document) => {
    setLocation(`/documents/${document.id}`);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-white"
        onClick={() => setIsDialogOpen(true)}
      >
        <MapPin className="h-4 w-4 text-primary" />
        View Parcel Data
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Parcel Information
            </DialogTitle>
            <DialogDescription>
              View and manage workflows and documents for this parcel.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 p-3 rounded-md mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Parcel ID</p>
                <p className="font-medium">{parcelId}</p>
              </div>
              {parcelAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{parcelAddress}</p>
                </div>
              )}
              {parcelOwner && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-medium">{parcelOwner}</p>
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="workflows" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="workflows" className="flex items-center gap-1">
                <ClipboardList className="h-4 w-4" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workflows">
              <div className="mb-4">
                {hasRole(['admin', 'staff']) && (
                  <Button 
                    className="w-full flex items-center gap-2 mt-2" 
                    onClick={handleStartWorkflow}
                  >
                    <Plus className="h-4 w-4" />
                    Start New Workflow
                  </Button>
                )}
              </div>

              {workflowsLoading ? (
                <div className="text-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading workflows...</p>
                </div>
              ) : workflows && workflows.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {workflows.map((workflow: Workflow) => (
                    <Card key={workflow.id} className="relative overflow-hidden border-l-4" style={{ borderLeftColor: getPriorityColor(workflow.priority).replace('bg-', '#').replace('hover:bg-', '#') }}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{workflow.title}</CardTitle>
                          <Badge className={getStatusColor(workflow.status)}>
                            {workflow.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workflow.dueDate ? (
                            <>Due {new Date(workflow.dueDate).toLocaleDateString()}</>
                          ) : (
                            <>Created {new Date(workflow.createdAt).toLocaleDateString()}</>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="py-0 px-4">
                        <p className="text-sm line-clamp-2">{workflow.description}</p>
                      </CardContent>
                      <CardFooter className="pt-2 pb-3 px-4 flex justify-between">
                        <Badge variant="outline">{workflow.type.replace('_', ' ')}</Badge>
                        <Button size="sm" onClick={() => handleViewWorkflow(workflow)}>
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border rounded-lg">
                  <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">No Workflows Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    There are no workflows associated with this parcel.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents">
              <div className="mb-4">
                {hasRole(['admin', 'staff']) && (
                  <Button 
                    className="w-full flex items-center gap-2 mt-2" 
                    onClick={handleUploadDocument}
                  >
                    <Plus className="h-4 w-4" />
                    Upload New Document
                  </Button>
                )}
              </div>

              {documentsLoading ? (
                <div className="text-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading documents...</p>
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {documents.map((document: Document) => (
                    <Card key={document.id} className="relative overflow-hidden">
                      <CardHeader className="py-3 px-4">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{document.name}</CardTitle>
                          <Badge variant="outline">
                            {document.fileType.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(document.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="py-0 px-4 flex items-center justify-between">
                        <Badge className="flex items-center gap-1">
                          {getDocumentTypeIcon(document.documentType)}
                          {formatDocumentType(document.documentType)}
                        </Badge>
                      </CardContent>
                      <CardFooter className="pt-2 pb-3 px-4 flex justify-end">
                        <Button size="sm" onClick={() => handleViewDocument(document)}>
                          View Document
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border rounded-lg">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">No Documents Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    There are no documents associated with this parcel.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Parcel Location: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MapWorkflowIntegration;