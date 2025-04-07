import { useQuery, useMutation } from '@tanstack/react-query';
import { RecentlyViewedParcel } from '../../shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function useRecentlyViewedParcels() {
  // Get all recently viewed parcels
  const { 
    data: recentParcels = [], 
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery<RecentlyViewedParcel[]>({
    queryKey: ['/api/recently-viewed-parcels'],
  });

  // Add a parcel to recently viewed
  const addRecentlyViewedMutation = useMutation({
    mutationFn: async (parcelId: number) => {
      return apiRequest('/api/recently-viewed-parcels', {
        method: 'POST',
        body: JSON.stringify({ parcelId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recently-viewed-parcels'] });
    },
    onError: (error) => {
      console.error('Error adding recently viewed parcel:', error);
    }
  });

  // Remove a parcel from recently viewed
  const removeRecentlyViewedMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/recently-viewed-parcels/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recently-viewed-parcels'] });
    },
    onError: (error) => {
      console.error('Error removing recently viewed parcel:', error);
    }
  });

  // Clear all recently viewed parcels
  const clearRecentlyViewedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/recently-viewed-parcels/clear', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recently-viewed-parcels'] });
    },
    onError: (error) => {
      console.error('Error clearing recently viewed parcels:', error);
    }
  });

  return {
    recentParcels,
    isLoading,
    isError,
    error,
    refetch,
    addRecentlyViewedMutation,
    removeRecentlyViewedMutation,
    clearRecentlyViewedMutation
  };
}