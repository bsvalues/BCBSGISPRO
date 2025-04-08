import { useLocalStorage } from './use-local-storage';

export interface MapBookmark {
  id?: string;
  name: string;
  description?: string;
  center: [number, number];
  zoom: number;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  layerState?: {
    visibleLayers: string[];
    baseMap: string;
  };
}

export function useMapBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<MapBookmark[]>('map-bookmarks', []);
  
  const addBookmark = (bookmark: Omit<MapBookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newBookmark: MapBookmark = {
      ...bookmark,
      id: `bookmark-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    
    setBookmarks(prev => [...prev, newBookmark]);
    return newBookmark;
  };
  
  const updateBookmark = (id: string, updates: Partial<Omit<MapBookmark, 'id' | 'createdAt'>>) => {
    setBookmarks(prev => {
      return prev.map(bookmark => {
        if (bookmark.id === id) {
          return {
            ...bookmark,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return bookmark;
      });
    });
  };
  
  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  };
  
  const getBookmark = (id: string) => {
    return bookmarks.find(bookmark => bookmark.id === id);
  };
  
  const clearBookmarks = () => {
    setBookmarks([]);
  };
  
  const addTagToBookmark = (id: string, tag: string) => {
    setBookmarks(prev => {
      return prev.map(bookmark => {
        if (bookmark.id === id) {
          const tags = bookmark.tags || [];
          if (!tags.includes(tag)) {
            return {
              ...bookmark,
              tags: [...tags, tag],
              updatedAt: new Date().toISOString()
            };
          }
        }
        return bookmark;
      });
    });
  };
  
  const removeTagFromBookmark = (id: string, tag: string) => {
    setBookmarks(prev => {
      return prev.map(bookmark => {
        if (bookmark.id === id && bookmark.tags) {
          return {
            ...bookmark,
            tags: bookmark.tags.filter(t => t !== tag),
            updatedAt: new Date().toISOString()
          };
        }
        return bookmark;
      });
    });
  };
  
  const getBookmarksByTag = (tag: string) => {
    return bookmarks.filter(bookmark => bookmark.tags?.includes(tag));
  };
  
  return {
    bookmarks,
    addBookmark,
    updateBookmark,
    removeBookmark,
    getBookmark,
    clearBookmarks,
    addTagToBookmark,
    removeTagFromBookmark,
    getBookmarksByTag
  };
}

// Export as both default and named export to prevent import issues
export default useMapBookmarks;