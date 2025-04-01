import { useState } from 'react';
import { 
  ClassificationResult, 
  getConfidenceLabel, 
  getConfidenceColor 
} from '@/hooks/use-document-classifier';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DocumentClassificationResultProps {
  classification: ClassificationResult;
  compact?: boolean;
}

export function DocumentClassificationResult({ 
  classification, 
  compact = false 
}: DocumentClassificationResultProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const { documentType, documentTypeLabel, confidence, alternativeTypes, keywords } = classification;
  
  // Format confidence as percentage
  const confidencePercent = Math.round(confidence * 100);
  const confidenceLabel = getConfidenceLabel(confidence);
  const confidenceColor = getConfidenceColor(confidence);
  
  // Color-code the confidence based on threshold
  const isHighConfidence = confidence >= 0.7;

  const renderConfidenceIndicator = () => (
    <div className="flex items-center gap-2">
      <span className={`font-medium ${confidenceColor}`}>
        {confidenceLabel} ({confidencePercent}%)
      </span>
      {isHighConfidence ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{documentTypeLabel}</span>
          </div>
          {renderConfidenceIndicator()}
        </div>
        
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-7">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isExpanded ? 'Hide details' : 'Show details'}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-2">
            <div className="space-y-2">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Confidence
                </div>
                <Progress value={confidencePercent} className="h-2" />
              </div>
              
              {alternativeTypes && alternativeTypes.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Alternative classifications
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {alternativeTypes.map((alt) => (
                      <TooltipProvider key={alt.documentType}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs">
                              {alt.documentType.replace('_', ' ')}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Confidence: {Math.round(alt.confidence * 100)}%</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}
              
              {keywords && keywords.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Keywords detected
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Document Classification
            </h3>
            <p className="text-sm text-muted-foreground">
              Machine learning-based document type detection
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Document classification analyzes text content to automatically categorize documents.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium mb-1 flex justify-between">
              <span>Document Type</span>
              {renderConfidenceIndicator()}
            </div>
            <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3">
              <span className="text-lg font-medium">{documentTypeLabel}</span>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Confidence</div>
            <div className="flex items-center gap-2">
              <Progress value={confidencePercent} className="flex-1 h-2" />
              <span className="text-sm font-medium">{confidencePercent}%</span>
            </div>
          </div>
          
          {alternativeTypes && alternativeTypes.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-1">
                Alternative Classifications
              </div>
              <div className="flex flex-wrap gap-2">
                {alternativeTypes.map((alt) => (
                  <TooltipProvider key={alt.documentType}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline">
                          {alt.documentType.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Confidence: {Math.round(alt.confidence * 100)}%</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
          
          {keywords && keywords.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-1">Keywords Detected</div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}