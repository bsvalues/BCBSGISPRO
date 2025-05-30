import { useLocalStorage } from './use-local-storage';

export interface RecentlyViewedItem {
  id: string;
  timestamp?: string;
  address?: string;
  owner?: string;
  coordinates?: [number, number];
  taxLot?: string;
  assessedValue?: number;
  marketValue?: number;
  propertyType?: string;
  acres?: number;
  yearBuilt?: number;
  lastViewedAt?: string;
  viewCount?: number;
}

const MAX_RECENT_ITEMS = 20;

export function useRecentlyViewed() {
  const [recentItems, setRecentItems] = useLocalStorage<RecentlyViewedItem[]>('recently-viewed-parcels', []);

  const addRecentItem = (item: RecentlyViewedItem) => {
    setRecentItems(prev => {
      // Check if item already exists
      const existingIndex = prev.findIndex(i => i.id === item.id);
      const now = new Date().toISOString();
      
      if (existingIndex >= 0) {
        // Item exists, update it and move to top
        const existingItem = prev[existingIndex];
        const updatedItem = {
          ...existingItem,
          ...item,
          lastViewedAt: now,
          viewCount: (existingItem.viewCount || 0) + 1
        };
        
        // Create new array without the existing item
        const filteredItems = prev.filter(i => i.id !== item.id);
        
        // Add updated item to the beginning
        return [updatedItem, ...filteredItems].slice(0, MAX_RECENT_ITEMS);
      }
      
      // New item, add to beginning
      const newItem = {
        ...item,
        timestamp: now,
        lastViewedAt: now,
        viewCount: 1
      };
      
      return [newItem, ...prev].slice(0, MAX_RECENT_ITEMS);
    });
  };

  const removeRecentItem = (id: string) => {
    setRecentItems(prev => prev.filter(item => item.id !== id));
  };

  const clearRecentItems = () => {
    setRecentItems([]);
  };

  const getRecentItem = (id: string) => {
    return recentItems.find(item => item.id === id);
  };

  const getRecentItemsByType = (propertyType: string) => {
    return recentItems.filter(item => item.propertyType === propertyType);
  };

  const getTopViewedItems = (count = 5) => {
    return [...recentItems]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, count);
  };

  const getRecentItemsByDateRange = (startDate: Date, endDate: Date) => {
    return recentItems.filter(item => {
      if (!item.lastViewedAt) return false;
      const viewedAt = new Date(item.lastViewedAt);
      return viewedAt >= startDate && viewedAt <= endDate;
    });
  };

  return {
    recentItems,
    addRecentItem,
    removeRecentItem,
    clearRecentItems,
    getRecentItem,
    getRecentItemsByType,
    getTopViewedItems,
    getRecentItemsByDateRange
  };
}

// Export as both default and named export to prevent import issues
export default useRecentlyViewed;