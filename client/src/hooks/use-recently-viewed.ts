import { useQuery, useMutation } from '@tanstack/react-query';
import { RecentlyViewedParcel } from '../../shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';

export interface ViewParcelInput {
  parcelId: number;
}

export default function useRecentlyViewed() {
  const [limit, setLimit] = useState(20);
  
  // Fetch recently viewed parcels
  const { 
    data = [], 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/recently-viewed-parcels'],
    select: (data: RecentlyViewedParcel[]) => {
      // Sort by viewedAt in descending order (newest first)
      return [...data].sort((a, b) => 
        new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
      );
    }
  });
  
  // Add parcel to recently viewed
  const viewParcelMutation = useMutation({
    mutationFn: async ({ parcelId }: ViewParcelInput) => {
      return apiRequest('/api/recently-viewed-parcels', {
        method: 'POST',
        body: JSON.stringify({ parcelId })
      });
    },
    onSuccess: () => {
      // Invalidate the recently viewed parcels query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/recently-viewed-parcels'] });
    }
  });
  
  // Clear all recently viewed parcels
  const clearRecentlyViewedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/recently-viewed-parcels', {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      // Invalidate the recently viewed parcels query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/recently-viewed-parcels'] });
    }
  });
  
  // Handle function to mark a parcel as viewed
  const markParcelAsViewed = (parcelId: number) => {
    viewParcelMutation.mutate({ parcelId });
  };
  
  return {
    recentlyViewed: data,
    isLoading,
    isError,
    error,
    markParcelAsViewed,
    clearRecentlyViewedMutation,
    viewParcelMutation,
    refetch,
    setLimit
  };
}