import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentLineageGraph } from '../../shared/document-lineage-schema';

/**
 * Hook for fetching and managing document lineage data
 */
export function useDocumentLineage(documentId?: string) {
  const queryClient = useQueryClient();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(documentId);
  
  // Query for fetching document list
  const documentsQuery = useQuery({
    queryKey: ['/api/document-lineage/documents'],
    queryFn: async () => {
      const response = await fetch('/api/document-lineage/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    }
  });
  
  // Query for fetching lineage data for a specific document
  const lineageQuery = useQuery({
    queryKey: ['/api/document-lineage/graph', selectedDocumentId],
    queryFn: async () => {
      if (!selectedDocumentId) return null;
      
      const response = await fetch(`/api/document-lineage/graph/${selectedDocumentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document lineage for ID: ${selectedDocumentId}`);
      }
      return response.json() as Promise<DocumentLineageGraph>;
    },
    enabled: !!selectedDocumentId
  });
  
  // Query for fetching provenance data for a specific document
  const provenanceQuery = useQuery({
    queryKey: ['/api/document-lineage/provenance', selectedDocumentId],
    queryFn: async () => {
      if (!selectedDocumentId) return null;
      
      const response = await fetch(`/api/document-lineage/provenance/${selectedDocumentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document provenance for ID: ${selectedDocumentId}`);
      }
      return response.json();
    },
    enabled: !!selectedDocumentId
  });
  
  // Fetch document history
  const historyQuery = useQuery({
    queryKey: ['/api/document-lineage/events', selectedDocumentId],
    queryFn: async () => {
      if (!selectedDocumentId) return [];
      
      const response = await fetch(`/api/document-lineage/events/${selectedDocumentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document history events for ID: ${selectedDocumentId}`);
      }
      return response.json();
    },
    enabled: !!selectedDocumentId
  });
  
  // Get document processing stages
  const processingStagesQuery = useQuery({
    queryKey: ['/api/document-lineage/stages', selectedDocumentId],
    queryFn: async () => {
      if (!selectedDocumentId) return [];
      
      const response = await fetch(`/api/document-lineage/stages/${selectedDocumentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document processing stages for ID: ${selectedDocumentId}`);
      }
      return response.json();
    },
    enabled: !!selectedDocumentId
  });
  
  // Get document relationships
  const relationshipsQuery = useQuery({
    queryKey: ['/api/document-lineage/relationships', selectedDocumentId],
    queryFn: async () => {
      if (!selectedDocumentId) return [];
      
      const response = await fetch(`/api/document-lineage/relationships/${selectedDocumentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document relationships for ID: ${selectedDocumentId}`);
      }
      return response.json();
    },
    enabled: !!selectedDocumentId
  });
  
  // Mutation for creating document relationship
  const createRelationshipMutation = useMutation({
    mutationFn: async (data: {
      sourceDocumentId: string;
      targetDocumentId: string;
      relationshipType: string;
      description?: string;
    }) => {
      const response = await fetch('/api/document-lineage/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create document relationship');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/document-lineage/graph', selectedDocumentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-lineage/provenance', selectedDocumentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-lineage/relationships', selectedDocumentId] });
    },
  });
  
  // Fetch combined document graph for multiple documents
  const fetchDocumentGraph = useCallback(async (documentIds: string[]) => {
    if (!documentIds.length) return null;
    
    try {
      const response = await fetch('/api/document-lineage/complete-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch document graph');
      }
      
      return await response.json() as DocumentLineageGraph;
    } catch (error) {
      console.error('Error fetching document graph:', error);
      return null;
    }
  }, []);
  
  return {
    // Queries
    documentsQuery,
    lineageQuery,
    provenanceQuery,
    historyQuery,
    processingStagesQuery,
    relationshipsQuery,
    
    // Mutations
    createRelationshipMutation,
    
    // State handlers
    selectedDocumentId,
    setSelectedDocumentId,
    
    // Actions
    fetchDocumentGraph,
    
    // Combined data
    isLoading: 
      documentsQuery.isLoading || 
      (!!selectedDocumentId && lineageQuery.isLoading) ||
      (!!selectedDocumentId && provenanceQuery.isLoading),
    error: 
      documentsQuery.error || 
      lineageQuery.error || 
      provenanceQuery.error,
    
    documents: documentsQuery.data,
    lineage: lineageQuery.data,
    provenance: provenanceQuery.data,
    history: historyQuery.data,
    processingStages: processingStagesQuery.data,
    relationships: relationshipsQuery.data,
  };
}

export default useDocumentLineage;