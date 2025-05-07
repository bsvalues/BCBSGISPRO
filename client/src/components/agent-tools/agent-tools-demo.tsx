/**
 * Agent Tools Demo Component
 * 
 * This component demonstrates how to use the agent tools hooks to interact
 * with the agent framework.
 */

import React, { useState } from 'react';
import { 
  useAgents, 
  useLayerRecommendations, 
  useEntityQualityEvaluation,
  useDocumentComplianceCheck
} from '@/hooks/use-agent-tools';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { MapIntelligenceIcon, DataValidationIcon, LegalComplianceIcon } from './agent-icons';

export function AgentToolsDemo() {
  const [tab, setTab] = useState('map-intelligence');
  const [location, setLocation] = useState({ lat: 46.25, lng: -119.25 });
  const [task, setTask] = useState('property-assessment');
  const [entityId, setEntityId] = useState(1001);
  const [entityType, setEntityType] = useState('parcel');
  const [documentId, setDocumentId] = useState(2001);
  const [documentType, setDocumentType] = useState('plat');
  
  // Use the agent tools hooks
  const { data: agents, isLoading: isLoadingAgents } = useAgents();
  const layerRecommendations = useLayerRecommendations();
  const entityQualityEvaluation = useEntityQualityEvaluation();
  const documentComplianceCheck = useDocumentComplianceCheck();
  
  // State for responses
  const [mapResponse, setMapResponse] = useState<any>(null);
  const [dataResponse, setDataResponse] = useState<any>(null);
  const [legalResponse, setLegalResponse] = useState<any>(null);
  
  // Handle layer recommendations request
  const handleLayerRecommendations = async () => {
    try {
      const response = await layerRecommendations.getRecommendations({
        task,
        location,
      });
      setMapResponse(response);
    } catch (error) {
      console.error('Error getting layer recommendations:', error);
    }
  };
  
  // Handle entity quality evaluation request
  const handleEntityQualityEvaluation = async () => {
    try {
      const response = await entityQualityEvaluation.evaluateEntity({
        entityType,
        entityId: parseInt(entityId.toString()),
      });
      setDataResponse(response);
    } catch (error) {
      console.error('Error evaluating entity quality:', error);
    }
  };
  
  // Handle document compliance check request
  const handleDocumentComplianceCheck = async () => {
    try {
      const response = await documentComplianceCheck.checkCompliance({
        documentId: parseInt(documentId.toString()),
        documentType,
      });
      setLegalResponse(response);
    } catch (error) {
      console.error('Error checking document compliance:', error);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Agent Tools Demo</h1>
      
      {/* Agents Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Agents</CardTitle>
          <CardDescription>
            These are the AI agents available in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAgents ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {agents?.map((agent) => (
                <Card key={agent.id} className="bg-primary-50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                      <Badge variant={agent.isActive ? "default" : "destructive"}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <div className="text-xs text-muted-foreground">
                      Version: {agent.version} | Type: {agent.type}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Agent Tools Demos */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="map-intelligence" className="flex items-center gap-2">
            <MapIntelligenceIcon className="w-4 h-4" />
            <span>Map Intelligence</span>
          </TabsTrigger>
          <TabsTrigger value="data-validation" className="flex items-center gap-2">
            <DataValidationIcon className="w-4 h-4" />
            <span>Data Validation</span>
          </TabsTrigger>
          <TabsTrigger value="legal-compliance" className="flex items-center gap-2">
            <LegalComplianceIcon className="w-4 h-4" />
            <span>Legal Compliance</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Map Intelligence Tab */}
        <TabsContent value="map-intelligence">
          <Card>
            <CardHeader>
              <CardTitle>Map Layer Recommendations</CardTitle>
              <CardDescription>
                Get intelligent map layer recommendations based on task and location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task">Task</Label>
                    <Input 
                      id="task" 
                      value={task} 
                      onChange={(e) => setTask(e.target.value)} 
                      placeholder="Enter task (e.g., property-assessment)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="location-lat" 
                        value={location.lat} 
                        onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) })} 
                        placeholder="Latitude"
                      />
                      <Input 
                        id="location-lng" 
                        value={location.lng} 
                        onChange={(e) => setLocation({ ...location, lng: parseFloat(e.target.value) })} 
                        placeholder="Longitude"
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleLayerRecommendations} 
                  disabled={layerRecommendations.isLoading}
                >
                  {layerRecommendations.isLoading ? 'Loading...' : 'Get Layer Recommendations'}
                </Button>
                
                {layerRecommendations.isLoading && (
                  <Progress value={45} className="w-full" />
                )}
                
                {mapResponse && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Response:</h3>
                    <ScrollArea className="h-64 w-full rounded-md border p-4">
                      <pre className="text-sm">
                        {JSON.stringify(mapResponse, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Data Validation Tab */}
        <TabsContent value="data-validation">
          <Card>
            <CardHeader>
              <CardTitle>Entity Quality Evaluation</CardTitle>
              <CardDescription>
                Evaluate the data quality of an entity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity-type">Entity Type</Label>
                    <Input 
                      id="entity-type" 
                      value={entityType} 
                      onChange={(e) => setEntityType(e.target.value)} 
                      placeholder="Enter entity type (e.g., parcel)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-id">Entity ID</Label>
                    <Input 
                      id="entity-id" 
                      value={entityId} 
                      onChange={(e) => setEntityId(parseInt(e.target.value || '0'))} 
                      placeholder="Enter entity ID"
                      type="number"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleEntityQualityEvaluation} 
                  disabled={entityQualityEvaluation.isLoading}
                >
                  {entityQualityEvaluation.isLoading ? 'Loading...' : 'Evaluate Entity Quality'}
                </Button>
                
                {entityQualityEvaluation.isLoading && (
                  <Progress value={45} className="w-full" />
                )}
                
                {dataResponse && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Response:</h3>
                    <ScrollArea className="h-64 w-full rounded-md border p-4">
                      <pre className="text-sm">
                        {JSON.stringify(dataResponse, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Legal Compliance Tab */}
        <TabsContent value="legal-compliance">
          <Card>
            <CardHeader>
              <CardTitle>Document Compliance Check</CardTitle>
              <CardDescription>
                Check if a document complies with regulatory requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <Input 
                      id="document-type" 
                      value={documentType} 
                      onChange={(e) => setDocumentType(e.target.value)} 
                      placeholder="Enter document type (e.g., plat)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-id">Document ID</Label>
                    <Input 
                      id="document-id" 
                      value={documentId} 
                      onChange={(e) => setDocumentId(parseInt(e.target.value || '0'))} 
                      placeholder="Enter document ID"
                      type="number"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleDocumentComplianceCheck} 
                  disabled={documentComplianceCheck.isLoading}
                >
                  {documentComplianceCheck.isLoading ? 'Loading...' : 'Check Document Compliance'}
                </Button>
                
                {documentComplianceCheck.isLoading && (
                  <Progress value={45} className="w-full" />
                )}
                
                {legalResponse && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Response:</h3>
                    <ScrollArea className="h-64 w-full rounded-md border p-4">
                      <pre className="text-sm">
                        {JSON.stringify(legalResponse, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}