import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Document types that match server-side DocumentType enum
export enum DocumentType {
  PLAT_MAP = 'plat_map',
  DEED = 'deed',
  SURVEY = 'survey',
  LEGAL_DESCRIPTION = 'legal_description',
  BOUNDARY_LINE_ADJUSTMENT = 'boundary_line_adjustment',
  TAX_FORM = 'tax_form',
  UNCLASSIFIED = 'unclassified'
}

// Classification result from the API
export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  documentTypeLabel: string;
  alternativeTypes?: Array<{
    documentType: DocumentType;
    confidence: number;
  }>;
  keywords?: string[];
}

// Document upload with classification result
export interface ClassifiedDocument {
  document: {
    id: number;
    workflowId: number;
    name: string;
    type: string;
    content: string;
    uploadedAt: Date;
  };
  classification: ClassificationResult;
}

/**
 * Hook for using the document classification API
 */
export function useDocumentClassifier() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Mutation for classifying document text
  const classifyMutation = useMutation({
    mutationFn: async (text: string): Promise<ClassificationResult> => {
      const res = await apiRequest('POST', '/api/documents/classify', { text });
      return res.json();
    },
    onSuccess: () => {
      // No need to invalidate any queries
    },
    onError: (error) => {
      toast({
        title: 'Classification Error',
        description: error.message || 'Could not classify document',
        variant: 'destructive',
      });
    }
  });

  // Mutation for uploading a document with automatic classification
  const uploadWithClassificationMutation = useMutation({
    mutationFn: async ({ 
      workflowId, 
      name, 
      content 
    }: { 
      workflowId: number; 
      name: string; 
      content: string;
    }): Promise<ClassifiedDocument> => {
      setIsProcessing(true);
      try {
        const res = await apiRequest(
          'POST', 
          `/api/workflows/${workflowId}/documents/auto-classify`, 
          { name, content }
        );
        return res.json();
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${data.document.workflowId}/documents`] });
      toast({
        title: 'Document Classified',
        description: `Document classified as: ${data.classification.documentTypeLabel}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload Error',
        description: error.message || 'Could not upload and classify document',
        variant: 'destructive',
      });
    }
  });

  return {
    classifyDocument: classifyMutation.mutateAsync,
    uploadWithClassification: uploadWithClassificationMutation.mutateAsync,
    isClassifying: classifyMutation.isPending,
    isUploading: uploadWithClassificationMutation.isPending,
    isProcessing
  };
}

/**
 * Returns human-readable confidence levels for displaying to users
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) {
    return 'Very High';
  } else if (confidence >= 0.7) {
    return 'High';
  } else if (confidence >= 0.5) {
    return 'Medium';
  } else if (confidence >= 0.3) {
    return 'Low';
  } else {
    return 'Very Low';
  }
}

/**
 * Returns a color based on confidence level
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) {
    return 'text-green-600 dark:text-green-400';
  } else if (confidence >= 0.7) {
    return 'text-green-500 dark:text-green-300';
  } else if (confidence >= 0.5) {
    return 'text-amber-500 dark:text-amber-300';
  } else if (confidence >= 0.3) {
    return 'text-orange-500 dark:text-orange-300';
  } else {
    return 'text-red-500 dark:text-red-300';
  }
}