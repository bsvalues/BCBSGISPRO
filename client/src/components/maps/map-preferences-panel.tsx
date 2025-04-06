import React, { useState } from 'react';
import { useMapPreferences, MapBaseLayer, MeasurementUnit, Theme } from '@/hooks/use-map-preferences';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Map, Layers, LayoutGrid, Ruler, Compass, Palette, RotateCcw, Undo2, Laptop, Monitor, Moon, Sun, Mountain, Building2, Car, Eye, Grid3X3, Scale, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MapPreferencesPanelProps {
  className?: string;
  compact?: boolean;
}

export function MapPreferencesPanel({ className, compact = false }: MapPreferencesPanelProps) {
  const { toast } = useToast();
  const { 
    preferences, 
    isLoading, 
    updatePreferences,
    resetPreferences
  } = useMapPreferences();

  const [selectedTab, setSelectedTab] = useState('general');

  // Handle theme change
  const handleThemeChange = (value: Theme) => {
    updatePreferences.mutate({ theme: value }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Theme updated" });
      }
    });
  };

  // Handle base layer change
  const handleBaseLayerChange = (value: MapBaseLayer) => {
    updatePreferences.mutate({ baseLayer: value }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Base map updated" });
      }
    });
  };

  // Handle measurement unit change
  const handleMeasurementUnitChange = (value: MeasurementUnit) => {
    if (!preferences) return;
    
    updatePreferences.mutate({ 
      measurement: { 
        ...preferences.measurement,
        unit: value 
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Measurement unit updated" });
      }
    });
  };

  // Handle toggle switches
  const handleToggle = (setting: keyof typeof preferences, value: boolean) => {
    if (!preferences) return;

    if (setting === 'measurement') {
      updatePreferences.mutate({ 
        measurement: {
          ...preferences.measurement,
          enabled: value
        }
      }, {
        onSuccess: () => {
          toast({ title: "Success", description: `Measurement tool ${value ? 'enabled' : 'disabled'}` });
        }
      });
      return;
    }

    updatePreferences.mutate({ [setting]: value }, {
      onSuccess: () => {
        toast({ title: "Success", description: `${setting} ${value ? 'enabled' : 'disabled'}` });
      }
    });
  };

  // Handle layer opacity change
  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    if (!preferences) return;

    const updatedLayers = preferences.layers.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    );

    updatePreferences.mutate({ layers: updatedLayers }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Layer opacity updated" });
      }
    });
  };

  // Handle layer visibility toggle
  const handleLayerVisibilityToggle = (layerId: string, visible: boolean) => {
    if (!preferences) return;

    const updatedLayers = preferences.layers.map(layer => 
      layer.id === layerId ? { ...layer, visible } : layer
    );

    updatePreferences.mutate({ layers: updatedLayers }, {
      onSuccess: () => {
        toast({ title: "Success", description: `Layer ${visible ? 'shown' : 'hidden'}` });
      }
    });
  };

  // Handle reset preferences
  const handleResetPreferences = () => {
    resetPreferences.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Success", description: "Map preferences reset to defaults" });
      }
    });
  };

  return (
    <Card className={cn("w-full backdrop-blur-md bg-background/60 border border-primary/20 shadow-xl rounded-lg", className)}>
      <CardHeader className={compact ? "p-3" : "p-4"}>
        <CardTitle className="flex items-center gap-2 text-primary-foreground/90">
          <div className="bg-primary/90 p-1.5 rounded-full flex items-center justify-center shadow-sm">
            <Map className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>Map Preferences</span>
        </CardTitle>
        {!compact && (
          <CardDescription className="text-muted-foreground/90">
            Customize your map viewing experience
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={compact ? "p-3 pt-0" : "p-4 pt-0"}>
        {isLoading || !preferences ? (
          <div className="flex justify-center p-4">
            <div className="animate-pulse flex items-center gap-2">
              <span className="h-2 w-2 bg-primary/80 rounded-full animate-bounce"></span>
              <span className="h-2 w-2 bg-primary/80 rounded-full animate-bounce delay-150"></span>
              <span className="h-2 w-2 bg-primary/80 rounded-full animate-bounce delay-300"></span>
              <span className="text-muted-foreground/90">Loading preferences...</span>
            </div>
          </div>
        ) : (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 bg-background/50 backdrop-blur-sm p-1 rounded-lg border border-primary/10">
              <TabsTrigger value="general" className="flex items-center gap-1 data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-md">
                <Map className="h-4 w-4" />
                <span className={compact ? "sr-only" : ""}>General</span>
              </TabsTrigger>
              <TabsTrigger value="layers" className="flex items-center gap-1 data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-md">
                <Layers className="h-4 w-4" />
                <span className={compact ? "sr-only" : ""}>Layers</span>
              </TabsTrigger>
              <TabsTrigger value="visual" className="flex items-center gap-1 data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-md">
                <Palette className="h-4 w-4" />
                <span className={compact ? "sr-only" : ""}>Visual</span>
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <div className="bg-primary/10 p-1 rounded-full">
                        <Compass className="h-3.5 w-3.5 text-primary/80" />
                      </div>
                      Base Map
                    </Label>
                  </div>
                  <Select 
                    value={preferences.baseLayer} 
                    onValueChange={(value) => handleBaseLayerChange(value as MapBaseLayer)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select base map" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="streets">Streets</SelectItem>
                      <SelectItem value="terrain">Terrain</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <div className="bg-primary/10 p-1 rounded-full">
                      <Monitor className="h-3.5 w-3.5 text-primary/80" />
                    </div>
                    Theme
                  </Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={preferences.theme === 'light' ? 'default' : 'outline'} 
                      size="sm"
                      className="flex-1 flex items-center gap-1"
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </Button>
                    <Button 
                      variant={preferences.theme === 'dark' ? 'default' : 'outline'} 
                      size="sm"
                      className="flex-1 flex items-center gap-1"
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </Button>
                    <Button 
                      variant={preferences.theme === 'system' ? 'default' : 'outline'} 
                      size="sm"
                      className="flex-1 flex items-center gap-1"
                      onClick={() => handleThemeChange('system')}
                    >
                      <Laptop className="h-4 w-4" />
                      <span>System</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="toggle-measurement" className="text-sm font-medium flex items-center gap-1">
                      <Ruler className="h-4 w-4" />
                      Measurement Tool
                    </Label>
                    <Switch 
                      id="toggle-measurement"
                      checked={preferences.measurement.enabled}
                      onCheckedChange={(checked) => handleToggle('measurement', checked)}
                    />
                  </div>
                  
                  {preferences.measurement.enabled && (
                    <div className="pl-6 border-l-2 border-accent/20">
                      <div className="space-y-2">
                        <Label className="text-sm">Measurement Units</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant={preferences.measurement.unit === 'imperial' ? 'default' : 'outline'} 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleMeasurementUnitChange('imperial')}
                          >
                            Imperial
                          </Button>
                          <Button 
                            variant={preferences.measurement.unit === 'metric' ? 'default' : 'outline'} 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleMeasurementUnitChange('metric')}
                          >
                            Metric
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="toggle-grid" className="text-sm font-medium flex items-center gap-1">
                      <LayoutGrid className="h-4 w-4" />
                      Show Grid
                    </Label>
                    <Switch 
                      id="toggle-grid"
                      checked={preferences.grid}
                      onCheckedChange={(checked) => handleToggle('grid', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="toggle-scalebar" className="text-sm font-medium flex items-center gap-1">
                      <Scale className="h-4 w-4" />
                      Show Scale Bar
                    </Label>
                    <Switch 
                      id="toggle-scalebar"
                      checked={preferences.scalebar}
                      onCheckedChange={(checked) => handleToggle('scalebar', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="toggle-animation" className="text-sm font-medium flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      Map Animations
                    </Label>
                    <Switch 
                      id="toggle-animation"
                      checked={preferences.animation}
                      onCheckedChange={(checked) => handleToggle('animation', checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Layers Tab */}
            <TabsContent value="layers">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="toggle-labels" className="text-sm font-medium flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Map Labels
                  </Label>
                  <Switch 
                    id="toggle-labels"
                    checked={preferences.labels}
                    onCheckedChange={(checked) => handleToggle('labels', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="toggle-terrain" className="text-sm font-medium flex items-center gap-1">
                    <Mountain className="h-4 w-4" />
                    3D Terrain
                  </Label>
                  <Switch 
                    id="toggle-terrain"
                    checked={preferences.terrain}
                    onCheckedChange={(checked) => handleToggle('terrain', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="toggle-buildings" className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    3D Buildings
                  </Label>
                  <Switch 
                    id="toggle-buildings"
                    checked={preferences.buildings3D}
                    onCheckedChange={(checked) => handleToggle('buildings3D', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="toggle-traffic" className="text-sm font-medium flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    Traffic Data
                  </Label>
                  <Switch 
                    id="toggle-traffic"
                    checked={preferences.traffic}
                    onCheckedChange={(checked) => handleToggle('traffic', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Map Layers</Label>
                  
                  {preferences.layers.length === 0 ? (
                    <div className="text-center py-3 text-sm text-muted-foreground">
                      No custom layers available
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {preferences.layers.map((layer) => (
                        <div key={layer.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`toggle-layer-${layer.id}`} className="text-sm flex-1 truncate">
                              {layer.id}
                            </Label>
                            <Switch 
                              id={`toggle-layer-${layer.id}`}
                              checked={layer.visible}
                              onCheckedChange={(checked) => handleLayerVisibilityToggle(layer.id, checked)}
                            />
                          </div>
                          
                          {layer.visible && (
                            <div className="pl-6">
                              <Label htmlFor={`opacity-${layer.id}`} className="text-xs text-muted-foreground mb-1 block">
                                Opacity: {Math.round(layer.opacity * 100)}%
                              </Label>
                              <Slider
                                id={`opacity-${layer.id}`}
                                min={0}
                                max={1}
                                step={0.01}
                                value={[layer.opacity]}
                                onValueChange={([value]) => handleLayerOpacityChange(layer.id, value)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Visual Tab */}
            <TabsContent value="visual">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Compass className="h-4 w-4 text-primary/80" />
                    Default Map Position
                  </Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-primary/10 p-3 bg-background/40 backdrop-blur-sm shadow-sm">
                      <span className="text-muted-foreground/80 uppercase tracking-wide text-[10px] font-medium">Latitude</span>
                      <div className="text-sm mt-1 font-mono tracking-wide">{preferences.defaultCenter.lat.toFixed(6)}</div>
                    </div>
                    <div className="rounded-lg border border-primary/10 p-3 bg-background/40 backdrop-blur-sm shadow-sm">
                      <span className="text-muted-foreground/80 uppercase tracking-wide text-[10px] font-medium">Longitude</span>
                      <div className="text-sm mt-1 font-mono tracking-wide">{preferences.defaultCenter.lng.toFixed(6)}</div>
                    </div>
                    <div className="rounded-lg border border-primary/10 p-3 col-span-2 bg-background/40 backdrop-blur-sm shadow-sm">
                      <span className="text-muted-foreground/80 uppercase tracking-wide text-[10px] font-medium">Default Zoom</span>
                      <div className="text-sm mt-1 font-mono tracking-wide">{preferences.defaultZoom.toFixed(1)}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/90 mt-2 italic">
                    Default position is set when saving a bookmark as default.
                  </p>
                </div>

                <div className="relative">
                  <Separator className="opacity-20" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full flex items-center gap-2 bg-destructive/90 backdrop-blur-sm border border-destructive/20 shadow-md rounded-lg hover:bg-destructive/80 transition-all"
                      onClick={handleResetPreferences}
                    >
                      <div className="bg-destructive-foreground/10 p-1 rounded-full">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </div>
                      <span>Reset All Preferences</span>
                    </Button>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-destructive/40 to-transparent"></div>
                  </div>
                  <p className="text-xs text-muted-foreground/90 text-center pt-1">
                    This will restore all map preferences to their default values.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}