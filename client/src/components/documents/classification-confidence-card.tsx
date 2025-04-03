import React from 'react';
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentConfidenceIndicator } from './document-confidence-indicator';
import { ClassificationResult } from '@/hooks/use-document-classifier';
import { formatDistanceToNow } from 'date-fns';
import { getDocumentTypeIcon, getDocumentTypeLabel } from '@/lib/document-utils';
import { Brain, Edit, AlertCircle, RotateCw } from 'lucide-react';

interface ClassificationConfidenceCardProps {
  classification: ClassificationResult;
  onUpdateClassification?: () => void;
  onReprocessDocument?: () => void;
  className?: string;
}

export function ClassificationConfidenceCard({
  classification,
  onUpdateClassification,
  onReprocessDocument,
  className
}: ClassificationConfidenceCardProps) {
  const {
    documentType,
    documentTypeLabel = getDocumentTypeLabel(documentType),
    confidence,
    wasManuallyClassified,
    classifiedAt
  } = classification;
  
  // Format the document classification time
  const classificationTime = classifiedAt 
    ? formatDistanceToNow(new Date(classifiedAt), { addSuffix: true }) 
    : 'recently';
  
  // Get icon component for the document type
  const DocumentTypeIcon = getDocumentTypeIcon(documentType);
  
  // Determine if this is a low confidence classification
  const isLowConfidence = confidence && confidence < 0.6;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <DocumentTypeIcon className="h-5 w-5 text-primary" />
          {documentTypeLabel}
        </CardTitle>
        <CardDescription>
          {wasManuallyClassified 
            ? 'Manually classified by a user' 
            : 'Auto-classified by the system'}
          {' '}{classificationTime}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Confidence
              </span>
              <DocumentConfidenceIndicator 
                confidence={confidence} 
                showLabel 
                size="lg"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Method
              </span>
              <div className="flex items-center gap-1 text-sm">
                {wasManuallyClassified 
                  ? <Edit className="h-4 w-4 text-blue-500" />
                  : <Brain className="h-4 w-4 text-purple-500" />
                }
                <span>
                  {wasManuallyClassified ? 'Manual' : 'Automatic'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {isLowConfidence && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-950 rounded-md flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Low confidence classification
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Consider manual review to ensure this document is properly classified.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {onUpdateClassification && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onUpdateClassification}
          >
            <Edit className="h-4 w-4 mr-2" />
            Update
          </Button>
        )}
        
        {onReprocessDocument && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onReprocessDocument}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Reprocess
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}