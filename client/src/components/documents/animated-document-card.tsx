import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Document } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Clock, Eye, Download, Tag } from 'lucide-react';

// Extended Document type with optional classification
interface DocumentWithClassification extends Document {
  classification?: {
    documentType: string;
    confidence: number;
    wasManuallyClassified: boolean;
    classifiedAt: string;
  };
  updatedAt?: Date;
  contentType?: string;
}

interface AnimatedDocumentCardProps {
  document: DocumentWithClassification;
  onView: (document: DocumentWithClassification) => void;
}

export function AnimatedDocumentCard({ document, onView }: AnimatedDocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Card animation variants
  const cardVariants = {
    initial: { 
      scale: 1,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    hover: { 
      scale: 1.02, 
      boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 17
      }
    }
  };

  // Icon animation variants
  const iconVariants = {
    initial: { 
      rotate: 0,
      scale: 1
    },
    hover: { 
      rotate: [0, -5, 5, -5, 0],
      scale: 1.1,
      transition: { 
        duration: 0.5,
        ease: 'easeInOut',
        times: [0, 0.25, 0.5, 0.75, 1]
      }
    }
  };

  // Badge animation variants
  const badgeVariants = {
    initial: { 
      y: 0,
      opacity: 0.9,
      scale: 1
    },
    hover: { 
      y: -3,
      opacity: 1,
      scale: 1.05,
      transition: { 
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  // Button animation variants
  const buttonVariants = {
    initial: { 
      opacity: 0,
      y: 10
    },
    hover: { 
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate={isHovered ? "hover" : "initial"}
      variants={cardVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="mb-4"
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <motion.div 
                variants={iconVariants}
                className="bg-primary/10 p-3 rounded-full mt-1"
              >
                <FileText className="h-5 w-5 text-primary" />
              </motion.div>
              
              <div className="space-y-1.5">
                <h3 className="font-medium text-lg">{document.name}</h3>
                
                <div className="flex items-center gap-3">
                  <motion.div variants={badgeVariants}>
                    <Badge variant="outline" className="capitalize">
                      {document.type.replace(/_/g, ' ')}
                    </Badge>
                  </motion.div>
                  
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    {formatDistanceToNow(new Date(document.uploadedAt))} ago
                  </div>
                </div>

                {document.classification && (
                  <div className="flex items-center text-xs text-slate-500 mt-1.5">
                    <Tag className="h-3 w-3 mr-1.5" />
                    Classified as <span className="font-medium ml-1">{document.classification.documentType.replace(/_/g, ' ')}</span>
                    <span className="ml-2 text-slate-400">
                      {Math.round(document.classification.confidence * 100)}% confidence
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <motion.div className="space-x-2" variants={buttonVariants}>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onView(document)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}