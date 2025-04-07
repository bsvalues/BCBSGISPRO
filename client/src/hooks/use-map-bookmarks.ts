import { useQuery, useMutation } from '@tanstack/react-query';
import { MapBookmark } from '../../shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

// Schema for validating bookmark input
export const bookmarkInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  zoom: z.number().min(1).max(22),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  isDefault: z.boolean().optional(),
  isPinned: z.boolean().optional()
});

// Type for bookmark input
export type BookmarkInput = z.infer<typeof bookmarkInputSchema>;

// Type for updating a bookmark
interface BookmarkUpdateInput extends BookmarkInput {
  id: number;
}

// Type for toggling pin status
interface TogglePinInput {
  id: number;
  isPinned: boolean;
}

export default function useMapBookmarks() {
  // Get all bookmarks
  const { 
    data: bookmarks = [], 
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery<MapBookmark[]>({
    queryKey: ['/api/map-bookmarks'],
  });

  // Create a new bookmark
  const createBookmarkMutation = useMutation({
    mutationFn: async (bookmark: BookmarkInput) => {
      return apiRequest('/api/map-bookmarks', {
        method: 'POST',
        body: JSON.stringify(bookmark)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
      toast({
        title: 'Bookmark Created',
        description: 'Your location bookmark has been saved.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create bookmark. Please try again.',
        variant: 'destructive'
      });
      console.error('Error creating bookmark:', error);
    }
  });

  // Update an existing bookmark
  const updateBookmarkMutation = useMutation({
    mutationFn: async (bookmark: BookmarkUpdateInput) => {
      const { id, ...data } = bookmark;
      return apiRequest(`/api/map-bookmarks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
      toast({
        title: 'Bookmark Updated',
        description: 'Your location bookmark has been updated.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive'
      });
      console.error('Error updating bookmark:', error);
    }
  });

  // Delete a bookmark
  const deleteBookmarkMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/map-bookmarks/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
      toast({
        title: 'Bookmark Deleted',
        description: 'Your location bookmark has been removed.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete bookmark. Please try again.',
        variant: 'destructive'
      });
      console.error('Error deleting bookmark:', error);
    }
  });

  // Toggle pin status for a bookmark
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: TogglePinInput) => {
      return apiRequest(`/api/map-bookmarks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPinned })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update bookmark pin status.',
        variant: 'destructive'
      });
      console.error('Error toggling bookmark pin:', error);
    }
  });

  // Get pinned bookmarks
  const pinnedBookmarks = bookmarks.filter(bookmark => bookmark.isPinned);
  
  // Get default bookmark if it exists
  const defaultBookmark = bookmarks.find(bookmark => bookmark.isDefault);

  return {
    bookmarks,
    pinnedBookmarks,
    defaultBookmark,
    isLoading,
    isError,
    error,
    refetch,
    createBookmarkMutation,
    updateBookmarkMutation,
    deleteBookmarkMutation,
    togglePinMutation
  };
}