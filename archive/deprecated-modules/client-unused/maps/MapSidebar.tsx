import React from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, Bookmark, Clock, Settings, History, Layers, FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface MapSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const MapSidebar: React.FC<MapSidebarProps> = ({ 
  isOpen = false, 
  onClose,
  className
}) => {
  return (
    <div 
      className={cn(
        "fixed top-16 bottom-0 right-0 w-80 bg-background/80 backdrop-blur-md z-30 transition-transform duration-300 ease-in-out border-l border-primary/10 shadow-lg",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-primary/10">
        <h2 className="text-lg font-semibold text-primary">Map Tools</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <Tabs defaultValue="layers" className="w-full">
        <TabsList className="grid grid-cols-5 p-1 m-2 bg-background/80">
          <TabsTrigger value="layers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Layers className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bookmark className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="layers" className="p-2">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-2">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Base Maps</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    <BaseMapThumbnail name="Streets" active />
                    <BaseMapThumbnail name="Satellite" />
                    <BaseMapThumbnail name="Topographic" />
                    <BaseMapThumbnail name="Light Gray" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Operational Layers</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <LayerItem name="Parcels and Assessor" active />
                  <LayerItem name="Property Lines" active />
                  <LayerItem name="Zoning Districts" />
                  <LayerItem name="Flood Zones" />
                  <LayerItem name="Elevation Contours" />
                  <LayerItem name="Street Centerlines" active />
                  <LayerItem name="Utility Networks" />
                  <LayerItem name="Aerial Imagery 2023" />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="bookmarks" className="p-2">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-2">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Saved Locations</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <BookmarkItem name="Downtown District" date="2023-05-10" />
                  <BookmarkItem name="South Ridge Development" date="2023-06-22" />
                  <BookmarkItem name="Riverfront Properties" date="2023-07-15" />
                  <BookmarkItem name="Commercial Zone A" date="2023-08-03" />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="history" className="p-2">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-2">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Recently Viewed</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <HistoryItem id="10042" address="123 Main St" time="3 hours ago" />
                  <HistoryItem id="10036" address="456 Oak Ave" time="Yesterday" />
                  <HistoryItem id="10028" address="789 Pine Dr" time="2 days ago" />
                  <HistoryItem id="10015" address="321 Cedar Ln" time="3 days ago" />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="documents" className="p-2">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-2">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Associated Documents</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <DocumentItem name="Property Deed 2023" type="PDF" date="2023-06-15" />
                  <DocumentItem name="Survey Report" type="PDF" date="2023-05-22" />
                  <DocumentItem name="Tax Assessment" type="XLS" date="2023-07-01" />
                  <DocumentItem name="Title Search" type="DOC" date="2023-04-18" />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="settings" className="p-2">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-2">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Map Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <SettingsItem name="Show Labels" on />
                  <SettingsItem name="3D Buildings" on />
                  <SettingsItem name="Drop Shadows" on />
                  <SettingsItem name="Terrain" off />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Performance</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <SettingsItem name="High Quality" on />
                  <SettingsItem name="Hardware Acceleration" on />
                  <SettingsItem name="Cache Tiles" on />
                  <SettingsItem name="Background Sync" off />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper components
const BaseMapThumbnail: React.FC<{ name: string; active?: boolean }> = ({ name, active = false }) => (
  <div className={`p-1 border rounded-md text-center ${active ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>
    <div className="h-16 bg-gray-100 rounded-sm mb-1"></div>
    <span className="text-xs">{name}</span>
  </div>
);

const LayerItem: React.FC<{ name: string; active?: boolean }> = ({ name, active = false }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center">
      <div className={`w-4 h-4 mr-2 rounded-sm ${active ? 'bg-primary' : 'bg-gray-200'}`}></div>
      <span className="text-sm">{name}</span>
    </div>
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <Settings className="h-3 w-3" />
    </Button>
  </div>
);

const BookmarkItem: React.FC<{ name: string; date: string }> = ({ name, date }) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <div className="text-sm font-medium">{name}</div>
      <div className="text-xs text-gray-500">Saved: {date}</div>
    </div>
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <Share2 className="h-3 w-3" />
    </Button>
  </div>
);

const HistoryItem: React.FC<{ id: string; address: string; time: string }> = ({ id, address, time }) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <div className="text-sm font-medium">{address}</div>
      <div className="text-xs text-gray-500">Parcel #{id} • {time}</div>
    </div>
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <Bookmark className="h-3 w-3" />
    </Button>
  </div>
);

const DocumentItem: React.FC<{ name: string; type: string; date: string }> = ({ name, type, date }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center">
      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center mr-2">
        <span className="text-xs font-bold">{type}</span>
      </div>
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-gray-500">Added: {date}</div>
      </div>
    </div>
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <FileText className="h-3 w-3" />
    </Button>
  </div>
);

const SettingsItem: React.FC<{ name: string; on?: boolean; off?: boolean }> = ({ name, on = false, off = false }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm">{name}</span>
    <div className={`w-8 h-4 rounded-full relative ${on ? 'bg-primary' : 'bg-gray-300'}`}>
      <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transform transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
    </div>
  </div>
);

export default MapSidebar;