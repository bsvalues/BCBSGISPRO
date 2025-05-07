import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '../../components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  Button 
} from '../../components/ui/button';
import { 
  Badge 
} from '../../components/ui/badge';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '../../components/ui/alert';
import { 
  FileUpload, 
  Upload, 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  ArrowDownToLine, 
  Diff, 
  CheckSquare 
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';

// Types
type SyncImportResult = {
  status: string;
  filename: string;
  prop_id: string;
  sha256: string;
  risk_flag: string;
};

type StagedUpload = {
  upload_id: string;
  timestamp: string;
  filename: string;
  sha256: string;
  prop_id: string;
  status: 'PENDING' | 'APPROVED';
};

type DiffResult = {
  prop_id: string;
  fields: {
    field: string;
    current: number;
    proposed: number;
    delta: number;
  }[];
};

// API Service
const syncService = {
  importFile: async (file: File): Promise<SyncImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/sync/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer secure-sync-token` // In a real app, this would be stored securely
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Import failed');
    }
    
    return response.json();
  },
  
  stageFile: async (file: File): Promise<StagedUpload> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/sync/stage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer secure-sync-token`
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Staging failed');
    }
    
    return response.json();
  },
  
  getStagedUploads: async (): Promise<StagedUpload[]> => {
    const response = await fetch('/api/sync/staging-data', {
      headers: {
        'Authorization': `Bearer secure-sync-token`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch staged uploads');
    }
    
    return response.json();
  },
  
  getDiff: async (uploadId: string): Promise<DiffResult> => {
    const response = await fetch(`/api/sync/diff/${uploadId}`, {
      headers: {
        'Authorization': `Bearer secure-sync-token`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get diff');
    }
    
    return response.json();
  },
  
  approveUpload: async (uploadId: string): Promise<{ status: string }> => {
    const response = await fetch(`/api/sync/approve/${uploadId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer secure-sync-token`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to approve upload');
    }
    
    return response.json();
  },
  
  exportLogs: async (): Promise<Blob> => {
    const response = await fetch('/api/sync/export', {
      headers: {
        'Authorization': `Bearer secure-sync-token`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export logs');
    }
    
    return response.blob();
  }
};

// Component
const SyncDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [viewingDiff, setViewingDiff] = useState(false);

  // Queries
  const stagedUploadsQuery = useQuery({
    queryKey: ['/api/sync/staging-data'],
    queryFn: syncService.getStagedUploads,
    enabled: activeTab === 'staged' || activeTab === 'approve'
  });

  const diffQuery = useQuery({
    queryKey: ['/api/sync/diff', selectedUploadId],
    queryFn: () => syncService.getDiff(selectedUploadId!),
    enabled: !!selectedUploadId && viewingDiff
  });

  // Mutations
  const importMutation = useMutation({
    mutationFn: syncService.importFile,
    onSuccess: () => {
      // Handle success
      setSelectedFile(null);
    }
  });

  const stageMutation = useMutation({
    mutationFn: syncService.stageFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sync/staging-data'] });
      setSelectedFile(null);
      setActiveTab('staged');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (uploadId: string) => syncService.approveUpload(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sync/staging-data'] });
      setSelectedUploadId(null);
      setViewingDiff(false);
    }
  });

  // File input handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Import handler
  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  // Stage handler
  const handleStage = () => {
    if (selectedFile) {
      stageMutation.mutate(selectedFile);
    }
  };

  // View diff handler
  const handleViewDiff = (uploadId: string) => {
    setSelectedUploadId(uploadId);
    setViewingDiff(true);
  };

  // Approve handler
  const handleApprove = (uploadId: string) => {
    approveMutation.mutate(uploadId);
  };

  // Export logs handler
  const handleExportLogs = async () => {
    try {
      const blob = await syncService.exportLogs();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sync_import_log.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ICSF Sync Dashboard</CardTitle>
          <CardDescription>
            Manage property data synchronization between systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="staged">Staged</TabsTrigger>
              <TabsTrigger value="approve">Approve</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            {/* Import Tab */}
            <TabsContent value="import">
              <Card>
                <CardHeader>
                  <CardTitle>Import ICSF XML Data</CardTitle>
                  <CardDescription>
                    Upload property data XML files for validation and processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <FileUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={handleFileChange}
                        accept=".xml"
                      />
                    </div>
                    {selectedFile && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileCheck className="text-green-500" />
                        <span>{selectedFile.name}</span>
                        <span className="text-xs text-gray-500">({Math.round(selectedFile.size / 1024)} KB)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setSelectedFile(null)} disabled={!selectedFile}>
                    Cancel
                  </Button>
                  <div className="space-x-2">
                    <Button 
                      variant="secondary" 
                      onClick={handleStage} 
                      disabled={!selectedFile || stageMutation.isPending}
                    >
                      {stageMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Stage for Review
                    </Button>
                    <Button 
                      onClick={handleImport} 
                      disabled={!selectedFile || importMutation.isPending}
                    >
                      {importMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileUpload className="mr-2 h-4 w-4" />}
                      Direct Import
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              {importMutation.isSuccess && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription>
                    File {importMutation.data.filename} was successfully imported.
                    Property ID: {importMutation.data.prop_id}
                  </AlertDescription>
                </Alert>
              )}
              {importMutation.isError && (
                <Alert className="mt-4 bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertTitle>Import Failed</AlertTitle>
                  <AlertDescription>
                    There was an error importing the file. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Staged Tab */}
            <TabsContent value="staged">
              <Card>
                <CardHeader>
                  <CardTitle>Staged Updates</CardTitle>
                  <CardDescription>
                    Review updates before applying to the production system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stagedUploadsQuery.isLoading ? (
                    <div className="flex justify-center p-4">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : stagedUploadsQuery.isError ? (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Failed to load staged updates. Please try again.
                      </AlertDescription>
                    </Alert>
                  ) : stagedUploadsQuery.data?.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      No staged updates found. Import files first.
                    </div>
                  ) : (
                    <Table>
                      <TableCaption>List of staged updates pending approval</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Upload ID</TableHead>
                          <TableHead>Filename</TableHead>
                          <TableHead>Property ID</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stagedUploadsQuery.data?.map((upload) => (
                          <TableRow key={upload.upload_id}>
                            <TableCell className="font-mono text-xs">{upload.upload_id.substring(0, 8)}...</TableCell>
                            <TableCell>{upload.filename}</TableCell>
                            <TableCell>{upload.prop_id}</TableCell>
                            <TableCell>{new Date(upload.timestamp).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={upload.status === 'APPROVED' ? 'default' : 'secondary'}>
                                {upload.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewDiff(upload.upload_id)}
                                className="mr-2"
                              >
                                <Diff className="h-4 w-4 mr-1" />
                                View Diff
                              </Button>
                              <Button 
                                size="sm" 
                                disabled={upload.status === 'APPROVED'}
                                onClick={() => handleApprove(upload.upload_id)}
                              >
                                <CheckSquare className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Approve Tab with Diff Viewer */}
            <TabsContent value="approve">
              {viewingDiff && selectedUploadId ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Diff Viewer</CardTitle>
                    <CardDescription>
                      Comparing property data changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {diffQuery.isLoading ? (
                      <div className="flex justify-center p-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : diffQuery.isError ? (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          Failed to load diff data. Please try again.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium mb-4">
                          Property ID: {diffQuery.data?.prop_id}
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Field</TableHead>
                              <TableHead>Current Value</TableHead>
                              <TableHead>Proposed Value</TableHead>
                              <TableHead>Delta</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {diffQuery.data?.fields.map((field) => (
                              <TableRow key={field.field}>
                                <TableCell className="font-medium">{field.field}</TableCell>
                                <TableCell>{field.current}</TableCell>
                                <TableCell>{field.proposed}</TableCell>
                                <TableCell className={
                                  field.delta > 0 
                                    ? 'text-green-600' 
                                    : field.delta < 0 
                                    ? 'text-red-600' 
                                    : ''
                                }>
                                  {field.delta > 0 ? '+' : ''}{field.delta}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => {
                      setViewingDiff(false);
                      setSelectedUploadId(null);
                    }}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => handleApprove(selectedUploadId)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Approve Changes
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Approve Updates</CardTitle>
                    <CardDescription>
                      Select an upload to review and approve changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stagedUploadsQuery.isLoading ? (
                      <div className="flex justify-center p-4">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : stagedUploadsQuery.data?.filter(u => u.status === 'PENDING').length === 0 ? (
                      <div className="text-center p-8 text-gray-500">
                        No pending updates to approve.
                      </div>
                    ) : (
                      <Table>
                        <TableCaption>Pending updates requiring approval</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property ID</TableHead>
                            <TableHead>Filename</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stagedUploadsQuery.data?.filter(u => u.status === 'PENDING').map((upload) => (
                            <TableRow key={upload.upload_id}>
                              <TableCell>{upload.prop_id}</TableCell>
                              <TableCell>{upload.filename}</TableCell>
                              <TableCell>{new Date(upload.timestamp).toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewDiff(upload.upload_id)}
                                  className="mr-2"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApprove(upload.upload_id)}
                                >
                                  <CheckSquare className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Sync Logs</CardTitle>
                  <CardDescription>
                    View and export sync operation logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4">
                    <p className="mb-4">Export logs for auditing and record-keeping</p>
                    <Button onClick={handleExportLogs}>
                      <ArrowDownToLine className="mr-2 h-4 w-4" />
                      Export Logs (CSV)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncDashboard;