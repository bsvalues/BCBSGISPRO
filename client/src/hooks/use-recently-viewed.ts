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
    queryKey: ['/api/map/recently-viewed', { limit }],
    queryFn: async () => {
      const url = limit 
        ? `/api/map/recently-viewed?limit=${limit}` 
        : '/api/map/recently-viewed';
      
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
      apiRequest('/api/map/recently-viewed', {
        method: 'POST',
        body: JSON.stringify(parcel),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map/recently-viewed'] });
    },
  });

  // Remove a parcel from the recently viewed list
  const removeRecentParcel = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/map/recently-viewed/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map/recently-viewed'] });
    },
  });

  // Clear all parcels from recently viewed list
  const clearRecentParcels = useMutation({
    mutationFn: () => 
      apiRequest('/api/map/recently-viewed/clear', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map/recently-viewed'] });
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