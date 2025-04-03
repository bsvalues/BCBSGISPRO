import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tag, CircleCheck } from 'lucide-react';

interface ClassificationResult {
  documentType: string;
  documentTypeLabel: string;
  confidence: number;
  wasManuallyClassified: boolean;
}

interface DocumentClassificationResultProps {
  classification: ClassificationResult;
}

export function DocumentClassificationResult({ classification }: DocumentClassificationResultProps) {
  // Progress bar fill animation
  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${classification.confidence * 100}%`,
      transition: { 
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };
  
  // Get progress color based on confidence
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-blue-500';
    if (confidence >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Get confidence text
  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.85) return 'High Confidence';
    if (confidence >= 0.7) return 'Medium Confidence';
    if (confidence >= 0.5) return 'Low Confidence';
    return 'Very Low Confidence';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-medium mb-1">Document Type</h3>
          <div className="flex items-center space-x-2">
            <Badge className="capitalize px-3 py-1">{classification.documentTypeLabel}</Badge>
            
            {classification.wasManuallyClassified && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <CircleCheck className="h-3 w-3 text-green-500 mr-1" />
                <span>Manually Classified</span>
              </Badge>
            )}
          </div>
        </div>
        
        {classification.wasManuallyClassified ? (
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
            <CircleCheck className="h-4 w-4 text-green-500 mr-1" />
            Verified
          </div>
        ) : (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            AI Classification
          </div>
        )}
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Confidence Score</span>
          <span className="text-sm font-medium">{Math.round(classification.confidence * 100)}%</span>
        </div>
        
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${getConfidenceColor(classification.confidence)}`}
            initial="initial"
            animate="animate"
            variants={progressVariants}
          />
        </div>
        
        <div className="mt-1 text-xs text-slate-500 text-right">
          {getConfidenceText(classification.confidence)}
        </div>
      </div>
    </div>
  );
}