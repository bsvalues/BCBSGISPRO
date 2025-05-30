/**
 * Map Editor Page
 * 
 * This page provides a full screen map editor with AI-powered tools and Benton County GIS data.
 * It integrates with the agent system to provide intelligent assistance for map creation and editing.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  Save, 
  Download, 
  Share2, 
  Info, 
  HelpCircle, 
  Settings, 
  LayoutGrid
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import ModernLayout from '../components/layout/modern-layout';
import MapEditor from '../components/maps/map-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AgentSystemProvider } from '../context/agent-system-context';
import { WebSocketProvider } from '../context/websocket-context';

// Interface for saved map state
interface SavedMap {
  id: string;
  name: string;
  date: Date;
  features: any;
}

const MapEditorPage: React.FC = () => {
  // State
  const [currentTab, setCurrentTab] = useState<string>('edit');
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<SavedMap | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  
  // Hooks
  const { toast } = useToast();
  
  // Sample data for saved maps (in a real app, this would come from an API)
  useEffect(() => {
    // Simulate loading saved maps
    const loadSavedMaps = () => {
      setSavedMaps([
        {
          id: '1',
          name: 'Benton County Parcels',
          date: new Date(2025, 4, 5),
          features: {}
        },
        {
          id: '2',
          name: 'Downtown Analysis',
          date: new Date(2025, 4, 7),
          features: {}
        },
        {
          id: '3',
          name: 'Floodplain Assessment',
          date: new Date(2025, 4, 8),
          features: {}
        }
      ]);
    };
    
    loadSavedMaps();
  }, []);
  
  // Handle saving the map
  const handleSaveMap = (mapData: any) => {
    // In a real app, this would save to a database
    console.log('Saving map:', mapData);
    
    // Generate a unique ID
    const newMap: SavedMap = {
      id: Date.now().toString(),
      name: `Map ${savedMaps.length + 1}`,
      date: new Date(),
      features: mapData
    };
    
    // Add to saved maps
    setSavedMaps(prev => [newMap, ...prev]);
    
    // Show confirmation
    toast({
      title: 'Map Saved',
      description: `Your map "${newMap.name}" has been saved successfully.`,
    });
  };
  
  return (
    <WebSocketProvider>
      <AgentSystemProvider>
        <ModernLayout>
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold">Map Editor</h1>
                <p className="text-muted-foreground">Create and edit GIS maps with AI assistance</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Info className="h-4 w-4 mr-2" />
                      About
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>About Map Editor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p>This advanced map editor provides GIS tools for Benton County Assessor's Office staff.</p>
                      
                      <h3 className="font-medium">Features:</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Draw and edit property boundaries</li>
                        <li>Measure distances and areas</li>
                        <li>Toggle GIS layers</li>
                        <li>AI-powered map intelligence</li>
                        <li>Save and share maps</li>
                      </ul>
                      
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-sm font-medium">Data Sources:</p>
                        <p className="text-xs text-muted-foreground">Benton County GIS Services, Washington State GIS, USGS</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Map Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm">Map display and tool settings will be available here.</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs 
              defaultValue="edit" 
              value={currentTab}
              onValueChange={setCurrentTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="edit">Edit Map</TabsTrigger>
                <TabsTrigger value="saved">Saved Maps</TabsTrigger>
              </TabsList>
              
              {/* Edit tab content */}
              <TabsContent value="edit" className="flex-1 p-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 relative">
                  <MapEditor 
                    height="100%"
                    onSave={handleSaveMap}
                    showAI={true}
                  />
                </div>
              </TabsContent>
              
              {/* Saved maps tab content */}
              <TabsContent value="saved" className="p-0 data-[state=active]:block">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {savedMaps.map((map) => (
                    <Card 
                      key={map.id} 
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedMap(map)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{map.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {map.date.toLocaleDateString()}
                        </Badge>
                      </div>
                      
                      <div className="h-32 bg-accent/20 rounded-md flex items-center justify-center mb-3">
                        <LayoutGrid className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentTab('edit')}>
                          Open
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {savedMaps.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No saved maps yet. Create a new map to get started.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setCurrentTab('edit')}
                    >
                      Create New Map
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ModernLayout>
      </AgentSystemProvider>
    </WebSocketProvider>
  );
};

export default MapEditorPage;