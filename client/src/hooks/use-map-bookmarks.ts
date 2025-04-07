import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapBookmark } from '../../shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export interface CreateBookmarkInput {
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
  description?: string;
  icon?: string;
  color?: string;
  tags?: string[];
  isDefault?: boolean;
  isPinned?: boolean;
}

export interface UpdateBookmarkInput extends Partial<CreateBookmarkInput> {
  id: number;
}

export function useMapBookmarks() {
  const queryClient = useQueryClient();
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<number | null>(null);

  // Get all bookmarks
  const bookmarksQuery = useQuery({
    queryKey: ['/api/map-bookmarks'],
    queryFn: async () => {
      const response = await fetch('/api/map-bookmarks');
      if (!response.ok) {
        if (response.status === 401) {
          return []; // Return empty array when not logged in
        }
        throw new Error('Failed to fetch bookmarks');
      }
      return await response.json() as MapBookmark[];
    }
  });

  // Get single bookmark by ID
  const bookmarkQuery = useQuery({
    queryKey: ['/api/map-bookmarks', selectedBookmarkId],
    queryFn: async () => {
      if (!selectedBookmarkId) return null;
      
      const response = await fetch(`/api/map-bookmarks/${selectedBookmarkId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bookmark');
      }
      return await response.json() as MapBookmark;
    },
    enabled: !!selectedBookmarkId
  });

  // Create new bookmark
  const createBookmarkMutation = useMutation({
    mutationFn: async (newBookmark: CreateBookmarkInput) => {
      return apiRequest('/api/map-bookmarks', {
        method: 'POST',
        body: JSON.stringify(newBookmark),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
      toast({
        title: 'Bookmark created',
        description: 'Your map location has been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating bookmark',
        description: error instanceof Error ? error.message : 'Failed to create bookmark',
        variant: 'destructive',
      });
    }
  });

  // Update bookmark
  const updateBookmarkMutation = useMutation({
    mutationFn: async (bookmark: UpdateBookmarkInput) => {
      return apiRequest(`/api/map-bookmarks/${bookmark.id}`, {
        method: 'PATCH',
        body: JSON.stringify(bookmark),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks', variables.id] });
      toast({
        title: 'Bookmark updated',
        description: 'Your bookmark has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating bookmark',
        description: error instanceof Error ? error.message : 'Failed to update bookmark',
        variant: 'destructive',
      });
    }
  });

  // Delete bookmark
  const deleteBookmarkMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/map-bookmarks/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks', id] });
      if (selectedBookmarkId === id) {
        setSelectedBookmarkId(null);
      }
      toast({
        title: 'Bookmark deleted',
        description: 'Your bookmark has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting bookmark',
        description: error instanceof Error ? error.message : 'Failed to delete bookmark',
        variant: 'destructive',
      });
    }
  });

  // Helper function to create a bookmark from the current map view
  const createBookmarkFromMapView = (
    mapState: { center: [number, number]; zoom: number }, 
    name: string,
    options: Omit<CreateBookmarkInput, 'name' | 'latitude' | 'longitude' | 'zoom'> = {}
  ) => {
    const [latitude, longitude] = mapState.center;
    
    return createBookmarkMutation.mutate({
      name,
      latitude,
      longitude,
      zoom: mapState.zoom,
      ...options
    });
  };

  // Get default/pinned bookmarks
  const getDefaultBookmark = () => {
    if (!bookmarksQuery.data) return null;
    return bookmarksQuery.data.find(bookmark => bookmark.isDefault) || null;
  };

  const getPinnedBookmarks = () => {
    if (!bookmarksQuery.data) return [];
    return bookmarksQuery.data.filter(bookmark => bookmark.isPinned);
  };

  const getBookmarksByTag = (tag: string) => {
    if (!bookmarksQuery.data) return [];
    return bookmarksQuery.data.filter(bookmark => {
      if (!bookmark.tags) return false;
      return (bookmark.tags as string[]).includes(tag);
    });
  };

  return {
    // Queries
    bookmarksQuery,
    bookmarkQuery,
    
    // State
    selectedBookmarkId,
    setSelectedBookmarkId,
    
    // Mutations
    createBookmarkMutation,
    updateBookmarkMutation,
    deleteBookmarkMutation,
    
    // Helpers
    createBookmarkFromMapView,
    getDefaultBookmark,
    getPinnedBookmarks,
    getBookmarksByTag,
    
    // Combined data
    bookmarks: bookmarksQuery.data || [],
    selectedBookmark: bookmarkQuery.data,
    isLoading: bookmarksQuery.isLoading || (!!selectedBookmarkId && bookmarkQuery.isLoading),
    error: bookmarksQuery.error || bookmarkQuery.error,
  };
}

export default useMapBookmarks;