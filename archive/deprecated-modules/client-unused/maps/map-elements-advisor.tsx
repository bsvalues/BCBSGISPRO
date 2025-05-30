import React, { useState } from 'react';
import { useStandardMapElements, useMapEvaluation, useElementSuggestions } from '../../hooks/use-map-elements-advisor';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { MapElement, MapEvaluationResult } from '../../lib/map-elements-api';
import { calculatePercentage } from '../../lib/utils';

// Force timeout for fake data (remove in production)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface MapElementsAdvisorProps {
  defaultMapDescription?: string;
  defaultMapPurpose?: string;
}

export function MapElementsAdvisor({ 
  defaultMapDescription = '', 
  defaultMapPurpose = ''
}: MapElementsAdvisorProps) {
  // State for form inputs
  const [mapDescription, setMapDescription] = useState(defaultMapDescription);
  const [mapPurpose, setMapPurpose] = useState(defaultMapPurpose);
  const [mapContext, setMapContext] = useState('');
  
  // State for selected element
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // API hooks
  const standardElementsQuery = useStandardMapElements();
  const evaluationMutation = useMapEvaluation();
  const elementSuggestionsQuery = useElementSuggestions(selectedElementId, mapDescription);
  
  // Derived state
  const evaluation = evaluationMutation.data as MapEvaluationResult | undefined;
  const isEvaluating = evaluationMutation.isPending;
  const evaluationError = evaluationMutation.error;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapDescription && mapPurpose) {
      evaluationMutation.mutate({ mapDescription, mapPurpose, mapContext });
    }
  };

  // Handle element selection
  const handleElementClick = (elementId: string) => {
    setSelectedElementId(elementId === selectedElementId ? null : elementId);
  };
  
  // Get category badges
  const getCategoryBadges = (elements: MapElement[]) => {
    const categories = [...new Set(elements.map(element => element.category))];
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {categories.map(category => (
          <Badge key={category} variant={category as any}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Badge>
        ))}
      </div>
    );
  };
  
  // Color mapping for progress bar
  const progressColorMapping = {
    threshold0: "bg-red-500",    // 0-33
    threshold1: "bg-amber-500",  // 34-66
    threshold2: "bg-green-500"   // 67-100
  };
  
  // Render element suggestions
  const renderElementSuggestions = () => {
    if (!evaluation) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {evaluation.suggestions.map((element) => (
          <div 
            key={element.id}
            className={`border rounded-lg p-4 cursor-pointer transition duration-200 hover:shadow-md ${
              selectedElementId === element.id ? 'border-primary shadow-md' : 'border-gray-200'
            }`}
            onClick={() => handleElementClick(element.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-lg">{element.name}</h3>
              <Badge variant={element.implementationStatus || 'default'}>
                {element.implementationStatus || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex gap-2 mb-2">
              <Badge variant={element.importance as any} size="sm">
                {element.importance}
              </Badge>
              <Badge variant={element.category as any} size="sm">
                {element.category}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{element.description}</p>
            
            {element.aiTips && (
              <div className="mt-2 text-sm">
                <h4 className="font-medium mb-1">AI Tips:</h4>
                <p className="text-gray-700">{element.aiTips}</p>
              </div>
            )}
            
            {selectedElementId === element.id && elementSuggestionsQuery.data && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Detailed Suggestions:</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {elementSuggestionsQuery.data.suggestions}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Map Elements Advisor</h1>
        <p className="text-gray-600">
          Analyze your map description to receive AI-powered recommendations based on 
          cartographic best practices for the 33 essential map elements.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-8 p-6 border rounded-lg bg-gray-50">
        <div className="mb-4">
          <label htmlFor="mapDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Map Description
          </label>
          <textarea
            id="mapDescription"
            value={mapDescription}
            onChange={(e) => setMapDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            rows={4}
            placeholder="Describe your map's content, features, and layout..."
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="mapPurpose" className="block text-sm font-medium text-gray-700 mb-1">
            Map Purpose
          </label>
          <input
            id="mapPurpose"
            type="text"
            value={mapPurpose}
            onChange={(e) => setMapPurpose(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="e.g., Navigation, Analysis, Education, etc."
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="mapContext" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Context (Optional)
          </label>
          <textarea
            id="mapContext"
            value={mapContext}
            onChange={(e) => setMapContext(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            rows={2}
            placeholder="Target audience, specific requirements, constraints, etc."
          />
        </div>
        
        <button
          type="submit"
          disabled={isEvaluating || !mapDescription || !mapPurpose}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEvaluating ? 'Analyzing...' : 'Analyze Map'}
        </button>
      </form>
      
      {evaluationError && (
        <div className="mb-6 p-4 border border-red-200 rounded bg-red-50 text-red-700">
          Error: {evaluationError.message || 'Failed to evaluate map description'}
        </div>
      )}
      
      {evaluation && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Map Quality Score: {evaluation.overallScore}%</h2>
            <Progress 
              value={evaluation.overallScore} 
              max={100} 
              showValue 
              size="lg"
              colorMapping={progressColorMapping}
              thresholds={[33, 66, 100]}
              className="mb-2" 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="font-medium text-green-800">Implemented Elements</div>
                <div className="text-2xl font-bold text-green-700">{evaluation.implementedElements.length}</div>
                <Progress 
                  value={calculatePercentage(
                    evaluation.implementedElements.length,
                    evaluation.suggestions.length
                  )} 
                  className="mt-2 bg-green-200" 
                  colorMapping={{ threshold0: "bg-green-500" }}
                  thresholds={[100]}
                />
              </div>
              
              <div className="p-4 border rounded-lg bg-amber-50">
                <div className="font-medium text-amber-800">Partially Implemented</div>
                <div className="text-2xl font-bold text-amber-700">{evaluation.partialElements.length}</div>
                <Progress 
                  value={calculatePercentage(
                    evaluation.partialElements.length,
                    evaluation.suggestions.length
                  )} 
                  className="mt-2 bg-amber-200" 
                  colorMapping={{ threshold0: "bg-amber-500" }}
                  thresholds={[100]}
                />
              </div>
              
              <div className="p-4 border rounded-lg bg-red-50">
                <div className="font-medium text-red-800">Missing Elements</div>
                <div className="text-2xl font-bold text-red-700">{evaluation.missingElements.length}</div>
                <Progress 
                  value={calculatePercentage(
                    evaluation.missingElements.length,
                    evaluation.suggestions.length
                  )} 
                  className="mt-2 bg-red-200" 
                  colorMapping={{ threshold0: "bg-red-500" }}
                  thresholds={[100]}
                />
              </div>
            </div>
          </div>
          
          {evaluation.improvementAreas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Key Improvement Areas</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {evaluation.improvementAreas.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Element Recommendations</h3>
            {renderElementSuggestions()}
          </div>
        </div>
      )}
    </div>
  );
}