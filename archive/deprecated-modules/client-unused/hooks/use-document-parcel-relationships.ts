import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types
export interface DocumentParcelRelationship {
  id: number;
  documentId: number;
  parcelId: number;
  relationshipType: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
}

export interface CreateRelationshipData {
  documentId: number;
  parcelId: number;
  relationshipType: string;
  status?: string;
  notes?: string;
  createdBy?: number;
}

export interface UpdateRelationshipData {
  relationshipType?: string;
  status?: string;
  notes?: string;
}

/**
 * Hook to manage document-parcel relationships
 */
export function useDocumentParcelRelationships(documentId?: number, parcelId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Function to build the query key based on documentId and parcelId
  const getQueryKey = () => {
    if (documentId && parcelId) {
      return ['/api/document-parcel-relationships', { documentId, parcelId }];
    } else if (documentId) {
      return ['/api/document-parcel-relationships', { documentId }];
    } else if (parcelId) {
      return ['/api/document-parcel-relationships', { parcelId }];
    }
    return ['/api/document-parcel-relationships'];
  };

  // Fetch relationships
  const { data: relationships, isLoading, error, refetch } = useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (documentId) queryParams.append('documentId', documentId.toString());
      if (parcelId) queryParams.append('parcelId', parcelId.toString());
      
      const url = `/api/document-parcel-relationships${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiRequest<DocumentParcelRelationship[]>(url);
      return response;
    },
    enabled: !!(documentId || parcelId)
  });

  // Create relationship mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateRelationshipData) => {
      const response = await apiRequest<DocumentParcelRelationship>('/api/document-parcel-relationships', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/document-parcel-relationships'] });
      toast({
        title: 'Success',
        description: 'Relationship created successfully',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      console.error('Error creating relationship:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create relationship',
        variant: 'destructive'
      });
    }
  });

  // Update relationship mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRelationshipData }) => {
      const response = await apiRequest<DocumentParcelRelationship>(`/api/document-parcel-relationships/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-parcel-relationships'] });
      toast({
        title: 'Success',
        description: 'Relationship updated successfully',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      console.error('Error updating relationship:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update relationship',
        variant: 'destructive'
      });
    }
  });

  // Delete relationship mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest<{ success: boolean; message: string }>(`/api/document-parcel-relationships/${id}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-parcel-relationships'] });
      toast({
        title: 'Success',
        description: 'Relationship deleted successfully',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      console.error('Error deleting relationship:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete relationship',
        variant: 'destructive'
      });
    }
  });

  return {
    relationships,
    isLoading,
    error,
    refetch,
    createRelationship: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateRelationship: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteRelationship: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending
  };
}

export default useDocumentParcelRelationships;