import { useState } from 'react';
import useMapPreferences from '@/hooks/use-map-preferences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Settings, RotateCcw, Eye, EyeOff, Layers, Ruler, Compass, SunMoon, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface MapPreferencesPanelProps {
  className?: string;
}

export function MapPreferencesPanel({ className }: MapPreferencesPanelProps) {
  const { 
    preferences, 
    isLoading,
    updatePreferencesMutation,
    updateLayerOpacity,
    toggleLayerVisibility,
    updateUISettings,
    toggleMeasurement,
    resetToDefaults
  } = useMapPreferences();

  const [activeTab, setActiveTab] = useState<'general' | 'layers' | 'ui'>('general');

  if (isLoading) {
    return (
      <Card className={cn("w-full backdrop-blur-md bg-white/60 dark:bg-black/60 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg", className)}>
        <CardHeader className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 dark:from-teal-900/20 dark:to-blue-900/20 py-3">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
            <Settings className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
            Map Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            Loading preferences...
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleThemeChange = (value: string) => {
    updatePreferencesMutation.mutate({ theme: value as 'light' | 'dark' | 'system' });
  };

  const handleBaseLayerChange = (value: string) => {
    updatePreferencesMutation.mutate({ baseLayer: value as 'streets' | 'satellite' | 'terrain' | 'light' | 'dark' | 'custom' });
  };

  const handleMeasurementUnitChange = (value: string) => {
    toggleMeasurement(preferences?.measurement?.enabled || false, value as 'imperial' | 'metric');
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: 'Preferences Reset',
      description: 'Map preferences have been reset to default settings.'
    });
  };

  return (
    <Card className={cn("w-full backdrop-blur-md bg-white/60 dark:bg-black/60 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg", className)}>
      <CardHeader className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 dark:from-teal-900/20 dark:to-blue-900/20 py-3">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
          <Settings className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
          Map Preferences
        </CardTitle>
      </CardHeader>

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors", 
            activeTab === 'general' 
              ? "bg-gradient-to-r from-teal-500/10 to-blue-500/10 dark:from-teal-900/20 dark:to-blue-900/20 text-teal-700 dark:text-teal-300" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          )}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors", 
            activeTab === 'layers' 
              ? "bg-gradient-to-r from-teal-500/10 to-blue-500/10 dark:from-teal-900/20 dark:to-blue-900/20 text-teal-700 dark:text-teal-300" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          )}
          onClick={() => setActiveTab('layers')}
        >
          Layers
        </button>
        <button
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors", 
            activeTab === 'ui' 
              ? "bg-gradient-to-r from-teal-500/10 to-blue-500/10 dark:from-teal-900/20 dark:to-blue-900/20 text-teal-700 dark:text-teal-300" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          )}
          onClick={() => setActiveTab('ui')}
        >
          UI Options
        </button>
      </div>

      <CardContent className="p-4">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Theme</h3>
              <RadioGroup 
                value={preferences?.theme || 'light'} 
                onValueChange={handleThemeChange}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                  <Label
                    htmlFor="theme-light"
                    className={cn(
                      "flex items-center justify-center w-20 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer",
                      preferences?.theme === 'light' ? "bg-white shadow-md" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    <Sun className="h-4 w-4 mr-1 text-amber-500" />
                    Light
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                  <Label
                    htmlFor="theme-dark"
                    className={cn(
                      "flex items-center justify-center w-20 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer",
                      preferences?.theme === 'dark' ? "bg-gray-800 shadow-md text-white" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    <Moon className="h-4 w-4 mr-1 text-blue-400" />
                    Dark
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                  <Label
                    htmlFor="theme-system"
                    className={cn(
                      "flex items-center justify-center w-20 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer",
                      preferences?.theme === 'system' ? "bg-gradient-to-r from-gray-100 to-gray-700 shadow-md" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    <SunMoon className="h-4 w-4 mr-1 text-purple-500" />
                    Auto
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Base Map Style</h3>
              <RadioGroup 
                value={preferences?.baseLayer || 'streets'} 
                onValueChange={handleBaseLayerChange}
                className="grid grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="streets" id="base-streets" className="sr-only" />
                  <Label
                    htmlFor="base-streets"
                    className={cn(
                      "flex items-center justify-center w-full h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.baseLayer === 'streets' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Streets
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="satellite" id="base-satellite" className="sr-only" />
                  <Label
                    htmlFor="base-satellite"
                    className={cn(
                      "flex items-center justify-center w-full h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.baseLayer === 'satellite' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Satellite
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="terrain" id="base-terrain" className="sr-only" />
                  <Label
                    htmlFor="base-terrain"
                    className={cn(
                      "flex items-center justify-center w-full h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.baseLayer === 'terrain' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Terrain
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="light" id="base-light" className="sr-only" />
                  <Label
                    htmlFor="base-light"
                    className={cn(
                      "flex items-center justify-center w-full h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.baseLayer === 'light' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Light
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="dark" id="base-dark" className="sr-only" />
                  <Label
                    htmlFor="base-dark"
                    className={cn(
                      "flex items-center justify-center w-full h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.baseLayer === 'dark' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Dark
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="custom" id="base-custom" className="sr-only" />
                  <Label
                    htmlFor="base-custom"
                    className={cn(
                      "flex items-center justify-center w-full h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.baseLayer === 'custom' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Custom
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Map Features</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Compass className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <Label htmlFor="snap-to-feature" className="text-sm text-gray-700 dark:text-gray-300">
                      Snap to feature
                    </Label>
                  </div>
                  <Switch
                    id="snap-to-feature"
                    checked={preferences?.snapToFeature || false}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({ snapToFeature: checked });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <Label htmlFor="show-labels" className="text-sm text-gray-700 dark:text-gray-300">
                      Show map labels
                    </Label>
                  </div>
                  <Switch
                    id="show-labels"
                    checked={preferences?.showLabels || false}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({ showLabels: checked });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <Label htmlFor="measurement" className="text-sm text-gray-700 dark:text-gray-300">
                      Enable measurement
                    </Label>
                  </div>
                  <Switch
                    id="measurement"
                    checked={preferences?.measurement?.enabled || false}
                    onCheckedChange={(checked) => {
                      toggleMeasurement(checked);
                    }}
                  />
                </div>
              </div>
            </div>

            {preferences?.measurement?.enabled && (
              <>
                <div className="pl-6 -mt-1">
                  <h4 className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">Measurement Units</h4>
                  <RadioGroup 
                    value={preferences?.measurement?.unit || 'imperial'} 
                    onValueChange={handleMeasurementUnitChange}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="imperial" id="unit-imperial" />
                      <Label htmlFor="unit-imperial" className="text-xs">Imperial (ft)</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="metric" id="unit-metric" />
                      <Label htmlFor="unit-metric" className="text-xs">Metric (m)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Layer Visibility</h3>
            
            <div className="space-y-4">
              {/* Example layer - Parcel Boundaries */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Parcel Boundaries
                    </Label>
                  </div>
                  <Switch
                    checked={((preferences?.layerSettings || {})['parcel-boundaries'] || {}).visible !== false}
                    onCheckedChange={(checked) => {
                      toggleLayerVisibility('parcel-boundaries', checked);
                    }}
                  />
                </div>
                
                {((preferences?.layerSettings || {})['parcel-boundaries'] || {}).visible !== false && (
                  <div className="pl-6">
                    <div className="flex items-center space-x-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400 min-w-[50px]">
                        Opacity:
                      </Label>
                      <Slider
                        value={[(((preferences?.layerSettings || {})['parcel-boundaries'] || {}).opacity || 1) * 100]}
                        min={0}
                        max={100}
                        step={1}
                        className="w-[120px]"
                        onValueChange={(value) => {
                          updateLayerOpacity('parcel-boundaries', value[0] / 100);
                        }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {Math.round(((preferences?.layerSettings || {})['parcel-boundaries'] || {}).opacity * 100 || 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Example layer - Property Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Property Lines
                    </Label>
                  </div>
                  <Switch
                    checked={((preferences?.layerSettings || {})['property-lines'] || {}).visible !== false}
                    onCheckedChange={(checked) => {
                      toggleLayerVisibility('property-lines', checked);
                    }}
                  />
                </div>
                
                {((preferences?.layerSettings || {})['property-lines'] || {}).visible !== false && (
                  <div className="pl-6">
                    <div className="flex items-center space-x-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400 min-w-[50px]">
                        Opacity:
                      </Label>
                      <Slider
                        value={[(((preferences?.layerSettings || {})['property-lines'] || {}).opacity || 1) * 100]}
                        min={0}
                        max={100}
                        step={1}
                        className="w-[120px]"
                        onValueChange={(value) => {
                          updateLayerOpacity('property-lines', value[0] / 100);
                        }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {Math.round(((preferences?.layerSettings || {})['property-lines'] || {}).opacity * 100 || 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Example layer - Zoning */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Zoning
                    </Label>
                  </div>
                  <Switch
                    checked={((preferences?.layerSettings || {})['zoning'] || {}).visible !== false}
                    onCheckedChange={(checked) => {
                      toggleLayerVisibility('zoning', checked);
                    }}
                  />
                </div>
                
                {((preferences?.layerSettings || {})['zoning'] || {}).visible !== false && (
                  <div className="pl-6">
                    <div className="flex items-center space-x-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400 min-w-[50px]">
                        Opacity:
                      </Label>
                      <Slider
                        value={[(((preferences?.layerSettings || {})['zoning'] || {}).opacity || 1) * 100]}
                        min={0}
                        max={100}
                        step={1}
                        className="w-[120px]"
                        onValueChange={(value) => {
                          updateLayerOpacity('zoning', value[0] / 100);
                        }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {Math.round(((preferences?.layerSettings || {})['zoning'] || {}).opacity * 100 || 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ui' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">User Interface Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-hide-controls" className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-hide controls
                </Label>
                <Switch
                  id="auto-hide-controls"
                  checked={preferences?.uiSettings?.autoHideControls || false}
                  onCheckedChange={(checked) => {
                    updateUISettings({ autoHideControls: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="minimal-ui" className="text-sm text-gray-700 dark:text-gray-300">
                  Minimal interface
                </Label>
                <Switch
                  id="minimal-ui"
                  checked={preferences?.uiSettings?.minimalUI || false}
                  onCheckedChange={(checked) => {
                    updateUISettings({ minimalUI: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="animation" className="text-sm text-gray-700 dark:text-gray-300">
                  Map animations
                </Label>
                <Switch
                  id="animation"
                  checked={preferences?.animation !== false}
                  onCheckedChange={(checked) => {
                    updatePreferencesMutation.mutate({ animation: checked });
                  }}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Info Bar Position</h3>
              <RadioGroup 
                value={preferences?.uiSettings?.infoBarPosition || 'bottom'} 
                onValueChange={(value) => {
                  updateUISettings({ infoBarPosition: value as 'top' | 'bottom' | 'hidden' });
                }}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="top" id="infobar-top" className="sr-only" />
                  <Label
                    htmlFor="infobar-top"
                    className={cn(
                      "flex items-center justify-center w-full px-3 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.uiSettings?.infoBarPosition === 'top' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Top
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="bottom" id="infobar-bottom" className="sr-only" />
                  <Label
                    htmlFor="infobar-bottom"
                    className={cn(
                      "flex items-center justify-center w-full px-3 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.uiSettings?.infoBarPosition === 'bottom' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Bottom
                  </Label>
                </div>

                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="hidden" id="infobar-hidden" className="sr-only" />
                  <Label
                    htmlFor="infobar-hidden"
                    className={cn(
                      "flex items-center justify-center w-full px-3 h-8 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs",
                      preferences?.uiSettings?.infoBarPosition === 'hidden' ? "bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    Hidden
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50/80 dark:bg-gray-900/50 p-3 flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset to Defaults
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="h-8 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full shadow-md"
          onClick={() => {
            toast({
              title: 'Preferences Applied',
              description: 'Your map preferences have been saved and applied.'
            });
          }}
        >
          Apply Changes
        </Button>
      </CardFooter>
    </Card>
  );
}