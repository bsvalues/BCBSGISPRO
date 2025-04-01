import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Tag, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useState } from 'react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ClassificationResult } from '@/hooks/use-document-classifier';

interface DocumentClassificationResultProps {
  classification: ClassificationResult;
  showAlternatives?: boolean;
}

export function DocumentClassificationResult({ 
  classification, 
  showAlternatives = true 
}: DocumentClassificationResultProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Convert confidence percentage for display
  const confidencePercent = Math.round(classification.confidence * 100);
  
  // Determine confidence level for visual indicators
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  };
  
  const confidenceLevel = getConfidenceLevel(classification.confidence);
  
  // Alternative document types (would come from a more sophisticated classifier)
  const alternativeTypes = [
    {
      documentType: 'deed',
      documentTypeLabel: 'Deed',
      confidence: 0.15
    },
    {
      documentType: 'legal_description',
      documentTypeLabel: 'Legal Description',
      confidence: 0.08
    },
    {
      documentType: 'plat_map',
      documentTypeLabel: 'Plat Map',
      confidence: 0.05
    }
  ].filter(alt => alt.documentType !== classification.documentType);
  
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">
              {classification.documentTypeLabel}
            </h3>
            <p className="text-sm text-slate-500">
              Primary classification
            </p>
          </div>
          
          <Badge 
            className={`
              ${confidenceLevel === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}
              ${confidenceLevel === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : ''}
              ${confidenceLevel === 'low' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : ''}
            `}
            variant="secondary"
          >
            {confidenceLevel === 'high' && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {confidenceLevel === 'medium' && <Tag className="h-3 w-3 mr-1" />}
            {confidenceLevel === 'low' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {confidencePercent}% Confidence
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Confidence</span>
            <span className="font-medium">{confidencePercent}%</span>
          </div>
          
          <Progress 
            value={confidencePercent} 
            className={`h-2 ${
              confidenceLevel === 'high' ? 'bg-green-100 dark:bg-green-900' : 
              confidenceLevel === 'medium' ? 'bg-amber-100 dark:bg-amber-900' : 
              'bg-red-100 dark:bg-red-900'
            }`}
          />
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <Tag className="h-4 w-4 text-slate-400 mr-1.5" />
              <span className="text-sm text-slate-500">Document Type</span>
            </div>
            
            {classification.wasManuallyClassified && (
              <Badge variant="outline" className="text-xs">
                Manually Classified
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {showAlternatives && alternativeTypes.length > 0 && (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border rounded-md overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
            <div className="font-medium">Alternative Classifications</div>
            <div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-3">
              {alternativeTypes.map((altType, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="font-medium">{altType.documentTypeLabel}</div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.round(altType.confidence * 100)}
                      className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800"
                    />
                    <span className="text-xs text-slate-500 w-10 text-right">
                      {Math.round(altType.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
              
              <p className="text-xs text-slate-500 mt-3">
                Alternative classifications represent other possible document types with lower confidence scores
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}