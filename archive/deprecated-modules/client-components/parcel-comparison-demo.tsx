import { useState } from "react";
import { ParcelComparisonSlider } from "@/components/maps/parcel-comparison-slider";
import { Button } from "@/components/ui/button";
import { Select, SelectValue, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Demo page for the Parcel Comparison Slider component
 * 
 * This page showcases different use cases for the parcel comparison slider:
 * - Different viewing modes (satellite, zoning, tax assessment)
 * - Before/after development changes
 * - Property improvement visualization
 */
export default function ParcelComparisonDemo() {
  // State for controlling slider initial position
  const [sliderPosition, setSliderPosition] = useState(50);
  
  // State for managing selected comparison type
  const [comparisonType, setComparisonType] = useState("before-after");
  
  // Different comparison examples
  const comparisonExamples = {
    "before-after": {
      title: "Before/After Development",
      description: "Compare the parcel before and after development",
      beforeImage: "/assets/images/parcel-before-development.jpg",
      afterImage: "/assets/images/parcel-after-development.jpg",
      beforeLabel: "Before Development",
      afterLabel: "After Development"
    },
    "satellite-zoning": {
      title: "Satellite vs. Zoning Map",
      description: "Compare satellite imagery with zoning classification",
      beforeImage: "/assets/images/parcel-satellite.jpg",
      afterImage: "/assets/images/parcel-zoning.jpg",
      beforeLabel: "Satellite View",
      afterLabel: "Zoning Map"
    },
    "current-proposed": {
      title: "Current vs. Proposed",
      description: "Compare current state with proposed changes",
      beforeImage: "/assets/images/parcel-current.jpg",
      afterImage: "/assets/images/parcel-proposed.jpg",
      beforeLabel: "Current State",
      afterLabel: "Proposed Changes"
    },
    "seasonal": {
      title: "Seasonal Changes",
      description: "Compare the same property across different seasons",
      beforeImage: "/assets/images/parcel-summer.jpg",
      afterImage: "/assets/images/parcel-winter.jpg",
      beforeLabel: "Summer",
      afterLabel: "Winter"
    }
  };
  
  // For demo purposes, we'll use placeholder images if the assets aren't available
  const placeholderImages = {
    "before-after": {
      beforeImage: "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?q=80&w=2970&auto=format&fit=crop",
      afterImage: "https://images.unsplash.com/photo-1592595896616-c37162298647?q=80&w=2970&auto=format&fit=crop"
    },
    "satellite-zoning": {
      beforeImage: "https://images.unsplash.com/photo-1569336415962-a4bd9f69c07b?q=80&w=2831&auto=format&fit=crop",
      afterImage: "https://images.unsplash.com/photo-1545064187-d1ca9488dcb5?q=80&w=2664&auto=format&fit=crop"
    },
    "current-proposed": {
      beforeImage: "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=2970&auto=format&fit=crop",
      afterImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2970&auto=format&fit=crop"
    },
    "seasonal": {
      beforeImage: "https://images.unsplash.com/photo-1603460689581-abe6a73c2bf3?q=80&w=2970&auto=format&fit=crop",
      afterImage: "https://images.unsplash.com/photo-1602437038779-2a47f48a1a77?q=80&w=2971&auto=format&fit=crop"
    }
  };
  
  // Get current example
  const currentExample = comparisonExamples[comparisonType as keyof typeof comparisonExamples];
  const placeholders = placeholderImages[comparisonType as keyof typeof placeholderImages];
  
  // Use placeholders for demo
  const beforeImage = placeholders.beforeImage;
  const afterImage = placeholders.afterImage;
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold gradient-heading">Parcel Comparison Tool</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visualize differences between property states, zoning classifications, or development changes using our interactive comparison slider.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <ParcelComparisonSlider
            beforeImage={beforeImage}
            afterImage={afterImage}
            beforeLabel={currentExample.beforeLabel}
            afterLabel={currentExample.afterLabel}
            initialPosition={sliderPosition}
            className="h-[500px] mb-2"
          />
          <p className="text-sm text-muted-foreground text-center mt-2">
            Drag the slider to compare the different views
          </p>
        </div>
        
        <div className="space-y-6 glass-panel p-6 rounded-lg backdrop-blur-lg">
          <div>
            <h2 className="text-lg font-medium mb-4 readable-text">{currentExample.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{currentExample.description}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="comparison-type" className="mb-2 block">Comparison Type</Label>
              <Select 
                value={comparisonType}
                onValueChange={(value) => setComparisonType(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select comparison type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before-after">Before/After Development</SelectItem>
                  <SelectItem value="satellite-zoning">Satellite vs. Zoning</SelectItem>
                  <SelectItem value="current-proposed">Current vs. Proposed</SelectItem>
                  <SelectItem value="seasonal">Seasonal Changes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="slider-position" className="mb-2 block">Slider Position</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  id="slider-position"
                  value={[sliderPosition]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => setSliderPosition(values[0])}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-right">{sliderPosition}%</span>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="details" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="usage">Usage Guide</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-2 text-sm space-y-2">
              <p>
                <strong>View:</strong> {currentExample.title}
              </p>
              <p>
                <strong>Left Side:</strong> {currentExample.beforeLabel}
              </p>
              <p>
                <strong>Right Side:</strong> {currentExample.afterLabel}
              </p>
              <p>
                <strong>Slider Position:</strong> {sliderPosition}%
              </p>
            </TabsContent>
            <TabsContent value="usage" className="mt-2 text-sm space-y-2">
              <p>
                <strong>How to use:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Drag the slider handle left or right to reveal different views</li>
                <li>Select different comparison types from the dropdown</li>
                <li>Use the slider position control to set the default position</li>
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}