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

interface AnimatedListCardProps {
  document: DocumentWithClassification;
  onView: (document: DocumentWithClassification) => void;
}

export function AnimatedListCard({ document, onView }: AnimatedListCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Card animation variants
  const cardVariants = {
    initial: { 
      y: 0,
      backgroundColor: 'rgba(255, 255, 255, 0)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    hover: { 
      y: -2, 
      backgroundColor: 'rgba(241, 245, 249, 0.5)',
      boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 17
      }
    }
  };

  // Badge animation variants
  const badgeVariants = {
    initial: { 
      scale: 1
    },
    hover: { 
      scale: 1.05,
      transition: { 
        duration: 0.2
      }
    }
  };

  // Button animation variants
  const buttonVariants = {
    initial: { 
      opacity: 0,
      scale: 0.8
    },
    hover: { 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.2
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
      className="mb-2 rounded-md"
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              
              <div>
                <h3 className="font-medium text-base">{document.name}</h3>
                
                <div className="flex items-center gap-3 mt-0.5">
                  <motion.div variants={badgeVariants}>
                    <Badge variant="outline" className="capitalize text-xs">
                      {document.type.replace(/_/g, ' ')}
                    </Badge>
                  </motion.div>
                  
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(document.uploadedAt))} ago
                  </div>
                  
                  {document.classification && (
                    <div className="flex items-center text-xs text-slate-500">
                      <Tag className="h-3 w-3 mr-1" />
                      <span className="font-medium">{Math.round(document.classification.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <motion.div variants={buttonVariants}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => onView(document)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}