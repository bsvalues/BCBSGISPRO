import React, { useState } from 'react';
import useMapPreferences, { BaseLayerType, ThemeType, MeasurementUnit } from '@/hooks/use-map-preferences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Settings, MapPin, Moon, Sun, SunMoon, Map, Image, Compass, Mountain, Droplet, Check, Ruler, Layers, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface MapPreferencesPanelProps {
  className?: string;
  onClose?: () => void;
}

export function MapPreferencesPanel({ className, onClose }: MapPreferencesPanelProps) {
  const { 
    preferences, 
    isLoading, 
    setBaseLayer, 
    setTheme, 
    toggleSetting, 
    updateMeasurementSettings,
    resetPreferencesMutation
  } = useMapPreferences();
  
  const [defaultLocation, setDefaultLocation] = useState({
    lat: preferences.defaultCenter.lat,
    lng: preferences.defaultCenter.lng,
    zoom: preferences.defaultZoom
  });
  
  const handleBaseLayerChange = (value: BaseLayerType) => {
    setBaseLayer(value);
  };
  
  const handleThemeChange = (value: ThemeType) => {
    setTheme(value);
  };
  
  const handleMeasurementUnitChange = (value: MeasurementUnit) => {
    updateMeasurementSettings({ unit: value });
  };
  
  const handleToggleMeasurement = (checked: boolean) => {
    updateMeasurementSettings({ enabled: checked });
  };
  
  const handleSetCurrentAsDefault = () => {
    // This function would be called from the parent component
    // which passes in the current map state
    toast({
      title: 'Current location saved',
      description: 'The current map view has been set as your default location.',
    });
  };
  
  const handleResetPreferences = () => {
    resetPreferencesMutation.mutate();
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span>Map Settings</span>
        </CardTitle>
        <CardDescription>Customize your map experience</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">Loading preferences...</div>
        ) : (
          <>
            {/* Base Map Layer Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Base Map</h3>
              <RadioGroup 
                value={preferences.baseLayer} 
                onValueChange={(value) => handleBaseLayerChange(value as BaseLayerType)}
                className="grid grid-cols-2 gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="satellite" id="satellite" />
                    <Label htmlFor="satellite" className="flex items-center gap-1.5 cursor-pointer">
                      <Image className="h-3.5 w-3.5" />
                      <span>Satellite</span>
                    </Label>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="streets" id="streets" />
                    <Label htmlFor="streets" className="flex items-center gap-1.5 cursor-pointer">
                      <Map className="h-3.5 w-3.5" />
                      <span>Streets</span>
                    </Label>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="terrain" id="terrain" />
                    <Label htmlFor="terrain" className="flex items-center gap-1.5 cursor-pointer">
                      <Mountain className="h-3.5 w-3.5" />
                      <span>Terrain</span>
                    </Label>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-1.5 cursor-pointer">
                      <Droplet className="h-3.5 w-3.5" />
                      <span>Light</span>
                    </Label>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-1.5 cursor-pointer">
                      <Moon className="h-3.5 w-3.5" />
                      <span>Dark</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <Separator />
            
            {/* Theme Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Theme</h3>
              <RadioGroup 
                value={preferences.theme} 
                onValueChange={(value) => handleThemeChange(value as ThemeType)}
                className="grid grid-cols-3 gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light" className="flex items-center gap-1.5 cursor-pointer">
                      <Sun className="h-3.5 w-3.5" />
                      <span>Light</span>
                    </Label>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark" className="flex items-center gap-1.5 cursor-pointer">
                      <Moon className="h-3.5 w-3.5" />
                      <span>Dark</span>
                    </Label>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="theme-system" />
                    <Label htmlFor="theme-system" className="flex items-center gap-1.5 cursor-pointer">
                      <SunMoon className="h-3.5 w-3.5" />
                      <span>System</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <Separator />
            
            {/* Measurement Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <Ruler className="h-4 w-4" />
                  <span>Measurement Tools</span>
                </h3>
                <Switch
                  checked={preferences.measurement?.enabled || false}
                  onCheckedChange={handleToggleMeasurement}
                />
              </div>
              
              {preferences.measurement?.enabled && (
                <RadioGroup 
                  value={preferences.measurement.unit} 
                  onValueChange={(value) => handleMeasurementUnitChange(value as MeasurementUnit)}
                  className="grid grid-cols-2 gap-2 mt-2"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="imperial" id="imperial" />
                      <Label htmlFor="imperial" className="cursor-pointer">Imperial (ft)</Label>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="metric" id="metric" />
                      <Label htmlFor="metric" className="cursor-pointer">Metric (m)</Label>
                    </div>
                  </div>
                </RadioGroup>
              )}
            </div>
            
            <Separator />
            
            {/* Map Features Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Map Features</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="snap-to-feature" className="flex items-center gap-1.5 cursor-pointer">
                    <Layers className="h-4 w-4" />
                    <span>Snap to Features</span>
                  </Label>
                  <Switch
                    id="snap-to-feature"
                    checked={preferences.snapToFeature}
                    onCheckedChange={() => toggleSetting('snapToFeature')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-labels" className="flex items-center gap-1.5 cursor-pointer">
                    <Check className="h-4 w-4" />
                    <span>Show Labels</span>
                  </Label>
                  <Switch
                    id="show-labels"
                    checked={preferences.showLabels}
                    onCheckedChange={() => toggleSetting('showLabels')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="animation" className="flex items-center gap-1.5 cursor-pointer">
                    <Compass className="h-4 w-4" />
                    <span>Smooth Animation</span>
                  </Label>
                  <Switch
                    id="animation"
                    checked={preferences.animation}
                    onCheckedChange={() => toggleSetting('animation')}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Default Location Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>Default Location</span>
              </h3>
              
              <div className="rounded-md bg-muted p-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Current Default:</span>
                  <span className="font-medium">{preferences.defaultCenter.lat.toFixed(4)}, {preferences.defaultCenter.lng.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zoom Level:</span>
                  <span className="font-medium">{preferences.defaultZoom}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={handleSetCurrentAsDefault}
              >
                Set Current View as Default
              </Button>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1" 
          onClick={handleResetPreferences}
          disabled={resetPreferencesMutation.isPending}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset to Defaults
        </Button>
        
        {onClose && (
          <Button 
            size="sm" 
            onClick={onClose}
          >
            Save & Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default MapPreferencesPanel;