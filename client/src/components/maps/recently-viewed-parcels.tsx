import React from 'react';
import useRecentlyViewed from '@/hooks/use-recently-viewed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, MapPin, Trash2, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface RecentlyViewedParcelsProps {
  className?: string;
  onSelectParcel?: (parcelId: number) => void;
}

export function RecentlyViewedParcels({ className, onSelectParcel }: RecentlyViewedParcelsProps) {
  const { recentlyViewed, isLoading, clearRecentlyViewedMutation } = useRecentlyViewed();
  
  // Group parcels by date
  const groupedParcels = recentlyViewed.reduce((groups, parcel) => {
    const date = new Date(parcel.viewedAt);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    
    groups[dateStr].push(parcel);
    return groups;
  }, {} as Record<string, any[]>);
  
  // Get dates and sort them in descending order
  const dates = Object.keys(groupedParcels).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  const handleClearAll = () => {
    clearRecentlyViewedMutation.mutate();
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (dateStr === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <span>Recently Viewed</span>
          </div>
          
          {recentlyViewed.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClearAll}
              disabled={clearRecentlyViewedMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
        <CardDescription>Parcels you've recently viewed</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">Loading...</div>
        ) : recentlyViewed.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No recently viewed parcels</p>
            <p className="text-sm">Viewed parcels will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            {dates.map(date => (
              <div key={date} className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{formatDate(date)}</h3>
                
                {groupedParcels[date].map(parcel => (
                  <ParcelItem 
                    key={parcel.id} 
                    parcel={parcel} 
                    onSelect={() => onSelectParcel?.(parcel.parcelId)} 
                  />
                ))}
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface ParcelItemProps {
  parcel: any;
  onSelect: () => void;
}

function ParcelItem({ parcel, onSelect }: ParcelItemProps) {
  // In a real implementation, you might fetch more parcel details
  // or have them included in the response
  
  // Calculate relative time (e.g., "2 hours ago")
  const relativeTime = formatDistanceToNow(new Date(parcel.viewedAt), { addSuffix: true });
  
  return (
    <div 
      className="group relative bg-card hover:bg-accent p-3 rounded-lg mb-2 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <h4 className="text-sm font-medium">Parcel #{parcel.parcelId}</h4>
          </div>
          
          {parcel.parcelDetails && parcel.parcelDetails.address && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {parcel.parcelDetails.address}
            </p>
          )}
          
          <div className="text-xs text-muted-foreground mt-1">
            {relativeTime}
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default RecentlyViewedParcels;