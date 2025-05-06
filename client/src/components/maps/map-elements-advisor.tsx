import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMapElementsAdvisor } from '@/hooks/use-map-elements-advisor';
import { MapElementCard } from './map-element-card';
import { MapElementSuggestion, MapEvaluationResult } from '@/lib/map-elements-api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Brain, 
  Map, 
  BarChart4,
  BadgeAlert,
  BadgeCheck
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function MapElementsAdvisor() {
  const [mapDescription, setMapDescription] = useState('');
  const [mapPurpose, setMapPurpose] = useState('');
  const [mapContext, setMapContext] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<MapEvaluationResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [elementSuggestions, setElementSuggestions] = useState<Record<string, string>>({});

  const { 
    standardElements,
    isLoadingStandards,
    evaluateMap,
    isEvaluating,
    getElementSuggestions,
    isGettingSuggestions,
    getElementById
  } = useMapElementsAdvisor();

  // Handle map evaluation
  const handleEvaluateMap = async () => {
    if (!mapDescription.trim() || !mapPurpose.trim()) return;
    
    const result = await evaluateMap(
      mapDescription,
      mapPurpose,
      mapContext.trim() ? mapContext : undefined
    );
    
    if (result) {
      setEvaluationResult(result);
      setActiveTab('all');
    }
  };

  // Get AI suggestions for a specific map element
  const handleGetSuggestions = async (elementId: string) => {
    if (!mapDescription.trim()) return;
    
    setActiveElementId(elementId);
    
    const suggestions = await getElementSuggestions(elementId, mapDescription);
    
    if (suggestions) {
      setElementSuggestions(prev => ({
        ...prev,
        [elementId]: suggestions
      }));
    }
    
    setActiveElementId(null);
  };

  // Clear all fields and results
  const handleClear = () => {
    setMapDescription('');
    setMapPurpose('');
    setMapContext('');
    setEvaluationResult(null);
    setElementSuggestions({});
  };

  // Filter elements based on search term, category, importance, and status
  const getFilteredElements = () => {
    if (!evaluationResult) return [];
    
    let filtered = [...evaluationResult.suggestions];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(element => 
        element.name.toLowerCase().includes(term) || 
        element.description.toLowerCase().includes(term) ||
        element.bestPractices.some(practice => practice.toLowerCase().includes(term))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(element => element.category === selectedCategory);
    }
    
    // Filter by importance
    if (selectedImportance !== 'all') {
      filtered = filtered.filter(element => element.importance === selectedImportance);
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(element => element.implementationStatus === selectedStatus);
    }
    
    // Tab-specific filtering
    switch (activeTab) {
      case 'critical':
        return filtered.filter(element => element.importance === 'critical');
      case 'missing':
        return filtered.filter(element => element.implementationStatus === 'missing');
      case 'implemented':
        return filtered.filter(element => element.implementationStatus === 'implemented');
      case 'partial':
        return filtered.filter(element => element.implementationStatus === 'partial');
      default:
        return filtered;
    }
  };

  const filteredElements = evaluationResult ? getFilteredElements() : [];
  
  // Calculate statistics
  const getStats = () => {
    if (!evaluationResult) return { implemented: 0, missing: 0, partial: 0, total: 0 };
    
    return {
      implemented: evaluationResult.implementedElements.length,
      missing: evaluationResult.missingElements.length,
      partial: evaluationResult.partialElements.length,
      total: evaluationResult.suggestions.length
    };
  };
  
  const stats = getStats();
  
  // Get status summary for the score card
  const getScoreSummary = () => {
    if (!evaluationResult) return { color: 'bg-gray-100', icon: null, label: 'Not evaluated' };
    
    const score = evaluationResult.overallScore;
    
    if (score >= 80) {
      return { 
        color: 'bg-green-50 border-green-200', 
        icon: <CheckCircle className="h-5 w-5 text-green-500" />, 
        label: 'Excellent' 
      };
    } else if (score >= 60) {
      return { 
        color: 'bg-blue-50 border-blue-200', 
        icon: <BadgeCheck className="h-5 w-5 text-blue-500" />, 
        label: 'Good' 
      };
    } else if (score >= 40) {
      return { 
        color: 'bg-amber-50 border-amber-200', 
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, 
        label: 'Needs Improvement' 
      };
    } else {
      return { 
        color: 'bg-red-50 border-red-200', 
        icon: <BadgeAlert className="h-5 w-5 text-red-500" />, 
        label: 'Critical Issues' 
      };
    }
  };
  
  const scoreSummary = getScoreSummary();
  
  // Calculate progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Map Elements Advisor
          </CardTitle>
          <CardDescription>
            AI-powered evaluation and suggestions based on cartographic best practices
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="map-description" className="text-sm font-medium">
              Map Description
            </label>
            <Textarea
              id="map-description"
              placeholder="Describe your current map, its elements, design, and any specific issues or questions..."
              rows={4}
              value={mapDescription}
              onChange={(e) => setMapDescription(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="map-purpose" className="text-sm font-medium">
                Map Purpose
              </label>
              <Input
                id="map-purpose"
                placeholder="What is the main purpose of this map?"
                value={mapPurpose}
                onChange={(e) => setMapPurpose(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="map-context" className="text-sm font-medium">
                Additional Context (Optional)
              </label>
              <Input
                id="map-context"
                placeholder="Target audience, special requirements, etc."
                value={mapContext}
                onChange={(e) => setMapContext(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isEvaluating}
          >
            Clear
          </Button>
          
          <Button
            onClick={handleEvaluateMap}
            disabled={!mapDescription.trim() || !mapPurpose.trim() || isEvaluating}
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Evaluate Map
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {evaluationResult && (
        <div className="space-y-6">
          {/* Score Card */}
          <Card className={cn("border", scoreSummary.color)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart4 className="h-5 w-5 text-primary" />
                Map Evaluation Score
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl font-bold flex items-center gap-2">
                  {scoreSummary.icon}
                  <span>{evaluationResult.overallScore}</span>
                  <span className="text-sm text-gray-500 font-normal">/100</span>
                </div>
                <div className="text-sm text-gray-700">{scoreSummary.label}</div>
              </div>
              
              <Progress 
                value={evaluationResult.overallScore} 
                className="h-2" 
                indicatorClassName={getProgressColor(evaluationResult.overallScore)}
              />
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-md bg-green-50">
                  <div className="text-lg font-semibold text-green-700">{stats.implemented}</div>
                  <div className="text-xs text-green-600">Implemented</div>
                </div>
                
                <div className="p-2 rounded-md bg-amber-50">
                  <div className="text-lg font-semibold text-amber-700">{stats.partial}</div>
                  <div className="text-xs text-amber-600">Partial</div>
                </div>
                
                <div className="p-2 rounded-md bg-red-50">
                  <div className="text-lg font-semibold text-red-700">{stats.missing}</div>
                  <div className="text-xs text-red-600">Missing</div>
                </div>
              </div>
              
              {evaluationResult.improvementAreas.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Key Improvement Areas:</h4>
                  <ul className="text-sm space-y-1.5 list-disc pl-5">
                    {evaluationResult.improvementAreas.map((area, index) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Map Elements Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Map Elements Analysis
              </CardTitle>
              <CardDescription>
                Evaluation of the 33 essential map elements based on cartographic best practices
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                  <TabsTrigger value="missing">Missing</TabsTrigger>
                  <TabsTrigger value="implemented">Implemented</TabsTrigger>
                  <TabsTrigger value="partial">Partial</TabsTrigger>
                </TabsList>
                
                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row gap-2 mt-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search map elements..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="structure">Structure</SelectItem>
                        <SelectItem value="information">Information</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedImportance} onValueChange={setSelectedImportance}>
                      <SelectTrigger className="w-[140px]">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Importance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Importance</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="recommended">Recommended</SelectItem>
                        <SelectItem value="optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Element Cards */}
                <div className="mt-6 grid grid-cols-1 gap-4">
                  {filteredElements.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                      <SearchIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No elements found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filters to find what you're looking for.
                      </p>
                    </div>
                  ) : (
                    filteredElements.map((element) => (
                      <MapElementCard
                        key={element.id}
                        element={element}
                        onRequestSuggestions={handleGetSuggestions}
                        isFetchingSuggestions={isGettingSuggestions && activeElementId === element.id}
                        aiSuggestions={elementSuggestions[element.id]}
                      />
                    ))
                  )}
                </div>
              </Tabs>
            </CardContent>
            
            <CardFooter className="justify-between border-t pt-4">
              <div className="text-sm text-gray-500">
                Showing {filteredElements.length} of {evaluationResult.suggestions.length} elements
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedImportance('all');
                    setSelectedStatus('all');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// Search icon component
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}