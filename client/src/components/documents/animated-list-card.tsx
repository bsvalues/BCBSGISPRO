import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDocumentTypeColor, getDocumentTypeIcon } from '@/lib/document-utils';
import { Eye, FileText, Tag, Clock } from 'lucide-react';

interface Document {
  id: number;
  name: string;
  type: string;
  uploadedAt: string;
  classification?: {
    documentType: string;
    confidence: number;
    wasManuallyClassified: boolean;
    classifiedAt: string;
  };
  updatedAt?: Date;
  contentType?: string;
}

interface AnimatedListCardProps {
  document: Document;
  onView: (document: Document) => void;
}

export function AnimatedListCard({ document, onView }: AnimatedListCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const DocumentTypeIcon = getDocumentTypeIcon(document.type);
  const typeColor = getDocumentTypeColor(document.type);
  
  return (
    <motion.div
      className={`bg-white dark:bg-slate-800 border rounded-lg overflow-hidden transition-all duration-200 ${
        isHovered ? 'shadow-md' : 'shadow-sm'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -3 }}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${typeColor}`}>
            <DocumentTypeIcon className="h-5 w-5 text-white" />
          </div>
          
          <div>
            <h3 className="font-medium text-lg">{document.name}</h3>
            <div className="flex items-center space-x-3 mt-1">
              <Badge variant="outline" className="capitalize">
                {document.type.replace(/_/g, ' ')}
              </Badge>
              
              <div className="flex items-center text-xs text-slate-500">
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(document.uploadedAt))} ago
              </div>
              
              {document.classification && (
                <div className="flex items-center text-xs">
                  <Tag className="h-3 w-3 mr-1 text-slate-500" />
                  <span className="text-slate-500">
                    Confidence: {(document.classification.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => onView(document)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>
    </motion.div>
  );
}