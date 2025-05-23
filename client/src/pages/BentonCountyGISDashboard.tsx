import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Map, 
  FileText, 
  Workflow, 
  Search, 
  Database, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Home 
} from 'lucide-react';

// Import our enhanced components
import { EnhancedParcelViewer } from '@/components/maps/enhanced-parcel-viewer';
import { EnhancedWorkflowManager } from '@/components/workflow/enhanced-workflow-manager';
import enhancedDocumentClassifier, { DocumentContent } from '@/services/enhanced-document-classifier';

export default function BentonCountyGISDashboard() {
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [documentText, setDocumentText] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  
  const { toast } = useToast();
  
  // Handle document classification
  const handleClassifyDocument = async () => {
    if (!documentText.trim()) {
      toast({
        title: "Error",
        description: "Please enter document text to classify",
        variant: "destructive"
      });
      return;
    }
    
    setIsClassifying(true);
    
    try {
      const content: DocumentContent = {
        text: documentText,
        title: documentTitle
      };
      
      const result = await enhancedDocumentClassifier.classifyDocument(content);
      setClassificationResult(result);
      
      toast({
        title: "Classification Complete",
        description: `Document classified as ${result.documentType} with ${Math.round(result.confidence * 100)}% confidence`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Classification Error",
        description: "Failed to classify document",
        variant: "destructive"
      });
      console.error("Classification error:", error);
    } finally {
      setIsClassifying(false);
    }
  };
  
  // Handle parcel selection from the map
  const handleParcelSelect = (parcelData: any) => {
    setSelectedParcel(parcelData);
    
    toast({
      title: "Parcel Selected",
      description: `Parcel ID: ${parcelData.properties?.PARCELNBR || parcelData.id}`,
      variant: "default"
    });
  };
  
  // Handle workflow selection
  const handleWorkflowSelect = (workflow: any) => {
    setSelectedWorkflow(workflow);
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Benton County GIS Dashboard</h1>
          <p className="text-muted-foreground">
            Geographic Information System for the Benton County Assessor's Office
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </header>
      
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="map">
            <Map className="mr-2 h-4 w-4" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Workflow className="mr-2 h-4 w-4" />
            Workflows
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Interactive Map</CardTitle>
                  <CardDescription>
                    View and interact with Benton County parcel data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedParcelViewer 
                    height={600}
                    showControls={true}
                    showLayers={true}
                    showTools={true}
                    showSearch={true}
                    showAnalytics={true}
                    onParcelSelect={handleParcelSelect}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Parcel Information</CardTitle>
                  <CardDescription>
                    {selectedParcel ? 
                      `Parcel ID: ${selectedParcel.properties?.PARCELNBR || 'N/A'}` : 
                      'Select a parcel on the map'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedParcel ? (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Owner:</span>
                        <span>{selectedParcel.properties?.OWNER_NAME || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Address:</span>
                        <span>{selectedParcel.properties?.FULLADDRESS || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Land Use:</span>
                        <span>{selectedParcel.properties?.LANDUSE || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Acres:</span>
                        <span>{selectedParcel.properties?.ACRES || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Zoning:</span>
                        <span>{selectedParcel.properties?.ZONING || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Tax Code:</span>
                        <span>{selectedParcel.properties?.TAXCODE || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Land Value:</span>
                        <span>${selectedParcel.properties?.LAND_VALUE || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Improvement Value:</span>
                        <span>${selectedParcel.properties?.IMPR_VALUE || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Total Value:</span>
                        <span>${selectedParcel.properties?.TOTAL_VALUE || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <Search className="h-8 w-8 text-muted-foreground mb-2" />
                      <h3 className="font-medium">No parcel selected</h3>
                      <p className="text-sm text-muted-foreground">
                        Click on a parcel on the map to view details
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {selectedParcel && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Button>
                      <Button className="w-full">
                        <Workflow className="mr-2 h-4 w-4" />
                        Create Workflow
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Database className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Classification</CardTitle>
              <CardDescription>
                Identify document types using advanced classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Title (Optional)</label>
                <Input
                  placeholder="Enter document title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Text</label>
                <Textarea
                  placeholder="Paste document text here to classify"
                  className="min-h-[200px]"
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleClassifyDocument} 
                disabled={isClassifying || !documentText.trim()}
              >
                {isClassifying ? 'Classifying...' : 'Classify Document'}
              </Button>
              
              {classificationResult && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle>Classification Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Document Type</h4>
                          <p className="font-medium">{classificationResult.documentType}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Confidence</h4>
                          <p className="font-medium">{Math.round(classificationResult.confidence * 100)}%</p>
                        </div>
                      </div>
                      
                      {classificationResult.alternateTypes && classificationResult.alternateTypes.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Alternate Types</h4>
                          <ul className="text-sm">
                            {classificationResult.alternateTypes.map((alt: any, index: number) => (
                              <li key={index} className="flex justify-between">
                                <span>{alt.documentType}</span>
                                <span>{Math.round(alt.confidence * 100)}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {classificationResult.keywords && classificationResult.keywords.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Matching Keywords</h4>
                          <div className="flex flex-wrap gap-1">
                            {classificationResult.keywords.map((keyword: string, index: number) => (
                              <span 
                                key={index}
                                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {classificationResult.parcelReferences && classificationResult.parcelReferences.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Parcel References</h4>
                          <ul className="text-sm">
                            {classificationResult.parcelReferences.map((parcel: string, index: number) => (
                              <li key={index}>{parcel}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workflows" className="space-y-4">
          <EnhancedWorkflowManager 
            showCompleted={true}
            defaultFilter="all"
            onWorkflowSelect={handleWorkflowSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}