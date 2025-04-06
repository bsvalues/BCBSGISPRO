import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Bookmark {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  zoom: number;
  color: string | null;
  tags: string[] | null;
  isPinned: boolean | null;
  isDefault: boolean | null;
  userId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface CreateBookmarkInput {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  zoom: number;
  color?: string;
  tags?: string[];
  isPinned?: boolean;
  isDefault?: boolean;
}

interface UpdateBookmarkInput {
  id: number;
  name?: string;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  color?: string | null;
  tags?: string[] | null;
  isPinned?: boolean;
  isDefault?: boolean;
}

/**
 * Hook for managing map bookmarks
 */
export function useMapBookmarks() {
  const queryClient = useQueryClient();
  
  // Fetch all bookmarks
  const { data: bookmarks = [], isLoading, error } = useQuery({
    queryKey: ['/api/map-bookmarks'],
    placeholderData: [],
  });

  // Create a new bookmark
  const createBookmark = useMutation({
    mutationFn: (newBookmark: CreateBookmarkInput) => 
      apiRequest('/api/map-bookmarks', {
        method: 'POST',
        body: JSON.stringify(newBookmark),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
    },
  });

  // Update an existing bookmark
  const updateBookmark = useMutation({
    mutationFn: (updatedBookmark: UpdateBookmarkInput) => 
      apiRequest(`/api/map-bookmarks/${updatedBookmark.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedBookmark),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
    },
  });

  // Delete a bookmark
  const deleteBookmark = useMutation({
    mutationFn: (bookmarkId: number) => 
      apiRequest(`/api/map-bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/map-bookmarks'] });
    },
  });

  // Toggle pinned status
  const togglePinned = (bookmarkId: number, isPinned: boolean) => {
    updateBookmark.mutate({ id: bookmarkId, isPinned });
  };

  // Set a bookmark as default
  const setDefaultBookmark = (bookmarkId: number) => {
    // First, unset any existing default bookmark
    const existingDefault = bookmarks.find(b => b.isDefault);
    
    if (existingDefault) {
      updateBookmark.mutate({ 
        id: existingDefault.id, 
        isDefault: false 
      });
    }
    
    // Then set the new default
    updateBookmark.mutate({ id: bookmarkId, isDefault: true });
  };

  // Sort bookmarks by creation date (newest first)
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
  
  // Filter pinned bookmarks
  const pinnedBookmarks = bookmarks.filter(bookmark => bookmark.isPinned);
  
  // Get default bookmark
  const defaultBookmark = bookmarks.find(bookmark => bookmark.isDefault) || null;

  return {
    bookmarks,
    sortedBookmarks,
    pinnedBookmarks,
    defaultBookmark,
    isLoading,
    error,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    togglePinned,
    setDefaultBookmark,
  };
}