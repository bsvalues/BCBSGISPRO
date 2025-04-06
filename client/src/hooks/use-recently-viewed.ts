import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface RecentParcel {
  id: number;
  parcelId: number;
  parcelNumber: string;
  address: string | null;
  center: [number, number];
  zoom: number;
  viewedAt: Date | null;
  userId: number | null;
}

/**
 * Hook for managing recently viewed parcels
 */
export function useRecentlyViewed(limit?: number) {
  const queryClient = useQueryClient();
  
  // Fetch recently viewed parcels
  const { data: recentParcels = [], isLoading, error } = useQuery({
    queryKey: ['/api/recently-viewed-parcels', { limit }],
    queryFn: async () => {
      const url = limit 
        ? `/api/recently-viewed-parcels?limit=${limit}` 
        : '/api/recently-viewed-parcels';
      
      const response = await apiRequest(url);
      return response as RecentParcel[];
    },
    placeholderData: [],
  });

  // Add parcel to recently viewed list
  const addRecentParcel = useMutation({
    mutationFn: (parcel: { 
      parcelId: number; 
      parcelNumber: string; 
      center: [number, number]; 
      zoom: number;
      address?: string | null;
    }) => 
      apiRequest('/api/recently-viewed-parcels', {
        method: 'POST',
        body: JSON.stringify(parcel),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recently-viewed-parcels'] });
    },
  });

  // Remove a parcel from the recently viewed list
  const removeRecentParcel = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/recently-viewed-parcels/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recently-viewed-parcels'] });
    },
  });

  // Clear all parcels from recently viewed list
  const clearRecentParcels = useMutation({
    mutationFn: () => 
      apiRequest('/api/recently-viewed-parcels', {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recently-viewed-parcels'] });
    },
  });

  // Sort parcels by viewed date (newest first)
  const sortedByDate = [...recentParcels].sort((a, b) => {
    const dateA = a.viewedAt ? new Date(a.viewedAt).getTime() : 0;
    const dateB = b.viewedAt ? new Date(b.viewedAt).getTime() : 0;
    return dateB - dateA;
  });

  return {
    recentParcels: sortedByDate,
    isLoading,
    error,
    addRecentParcel,
    removeRecentParcel,
    clearRecentParcels,
  };
}