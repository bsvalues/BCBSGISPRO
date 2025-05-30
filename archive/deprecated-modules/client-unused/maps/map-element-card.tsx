import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapElementSuggestion } from '@/lib/map-elements-api';
import { Collapse } from '@/components/ui/collapse';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  List,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapElementCardProps {
  element: MapElementSuggestion;
  onRequestSuggestions?: (elementId: string) => void;
  isFetchingSuggestions?: boolean;
  aiSuggestions?: string | null;
}

export function MapElementCard({ 
  element, 
  onRequestSuggestions,
  isFetchingSuggestions,
  aiSuggestions 
}: MapElementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine the status icon and color based on implementation status and importance
  const getStatusDetails = () => {
    const status = element.implementationStatus || 'missing';
    
    switch (status) {
      case 'implemented':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          color: 'bg-green-50 text-green-700 border-green-200',
          label: 'Implemented'
        };
      case 'partial':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Partial'
        };
      case 'missing':
        return element.importance === 'critical' 
          ? {
              icon: <AlertCircle className="h-5 w-5 text-red-500" />,
              color: 'bg-red-50 text-red-700 border-red-200',
              label: 'Missing'
            }
          : {
              icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
              color: 'bg-gray-50 text-gray-700 border-gray-200',
              label: 'Missing'
            };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          label: 'Unknown'
        };
    }
  };

  // Determine importance badge color
  const getImportanceBadgeColor = () => {
    switch (element.importance) {
      case 'critical':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'recommended':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'optional':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Determine category badge color
  const getCategoryBadgeColor = () => {
    switch (element.category) {
      case 'structure':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'information':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'design':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-100';
      case 'technical':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'legal':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <Card className={cn(
      "transition-all duration-200 overflow-hidden",
      statusDetails.color,
      isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {statusDetails.icon}
            <CardTitle className="text-base font-medium">{element.name}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="secondary" className={getImportanceBadgeColor()}>
              {element.importance}
            </Badge>
            <Badge variant="secondary" className={getCategoryBadgeColor()}>
              {element.category}
            </Badge>
          </div>
        </div>
        <CardDescription className="mt-1">{element.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-xs w-full justify-between p-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="flex items-center gap-1">
            <List className="h-4 w-4" />
            {isExpanded ? "Hide details" : "Show details"}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {isExpanded && (
          <div className="mt-2 space-y-4 animate-in fade-in-50 duration-200">
            <div>
              <h4 className="text-sm font-medium mb-1">Best Practices</h4>
              <ul className="text-sm space-y-1 list-disc pl-5">
                {element.bestPractices.map((practice, index) => (
                  <li key={index}>{practice}</li>
                ))}
              </ul>
            </div>
            
            {element.aiTips && (
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700">AI Suggestions</span>
                </h4>
                <p className="text-sm text-blue-700">{element.aiTips}</p>
              </div>
            )}
            
            {aiSuggestions && (
              <div className="bg-indigo-50 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  <span className="text-indigo-700">Detailed Implementation Advice</span>
                </h4>
                <p className="text-sm text-indigo-700 whitespace-pre-line">{aiSuggestions}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {isExpanded && onRequestSuggestions && (
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onRequestSuggestions(element.id)}
            disabled={isFetchingSuggestions}
          >
            {isFetchingSuggestions ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Getting AI recommendations...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Get AI recommendations
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}