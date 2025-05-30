import { useState } from 'react';
import useRecentlyViewedParcels from '@/hooks/use-recently-viewed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, Map, ArrowRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentlyViewedParcelsProps {
  onSelectParcel?: (parcelId: number) => void;
  className?: string;
}

export function RecentlyViewedParcels({ onSelectParcel, className }: RecentlyViewedParcelsProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  
  const { 
    recentParcels: recentlyViewedParcels, 
    isLoading, 
    clearRecentlyViewedMutation: clearHistoryMutation
  } = useRecentlyViewedParcels();

  const handleClearHistory = () => {
    if (confirmClear) {
      clearHistoryMutation.mutate();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      // Reset confirm state after 5 seconds
      setTimeout(() => setConfirmClear(false), 5000);
    }
  };

  return (
    <Card className={cn("w-full backdrop-blur-md bg-white/60 dark:bg-black/60 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg", className)}>
      <CardHeader className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 dark:from-teal-900/20 dark:to-blue-900/20 py-3">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
          <History className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
          Recently Viewed Parcels
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3">
        {isLoading ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            Loading history...
          </div>
        ) : recentlyViewedParcels.length === 0 ? (
          <div className="py-8 text-center">
            <Map className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No recently viewed parcels</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Parcels you view will appear here for quick access
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-2">
              {recentlyViewedParcels.map((item) => (
                <ParcelItem 
                  key={item.id} 
                  parcel={item} 
                  onClick={() => onSelectParcel && onSelectParcel(item.parcelId)} 
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50/80 dark:bg-gray-900/50 p-3 flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {recentlyViewedParcels.length} {recentlyViewedParcels.length === 1 ? 'parcel' : 'parcels'} in history
        </div>
        {recentlyViewedParcels.length > 0 && (
          <Button 
            variant={confirmClear ? "destructive" : "outline"} 
            size="sm" 
            className={cn(
              "h-8",
              !confirmClear && "bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700"
            )}
            onClick={handleClearHistory}
          >
            {confirmClear ? (
              <>Confirm Clear</>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear History
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface ParcelItemProps {
  parcel: any;
  onClick: () => void;
}

function ParcelItem({ parcel, onClick }: ParcelItemProps) {
  // Format the time relative to now (like "3 hours ago")
  const timeAgo = formatDistanceToNow(new Date(parcel.viewedAt), { addSuffix: true });

  // We'll assume we have these properties in our parcel object
  // In a real app, you'd adjust based on your actual data structure
  const parcelNumber = parcel.parcel?.number || `Parcel #${parcel.parcelId}`;
  const address = parcel.parcel?.address || '123 Main St';
  const owner = parcel.parcel?.owner || 'Property Owner';
  const acres = parcel.parcel?.acres || '1.25';
  
  return (
    <div className="p-3 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 border border-gray-200 dark:border-gray-800 transition-all">
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <Home className="h-3.5 w-3.5 mr-1 text-blue-500 dark:text-blue-400" />
            {parcelNumber}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {address}
          </p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-sm text-gray-600 dark:text-gray-300">
              {owner}
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-sm text-gray-600 dark:text-gray-300">
              {acres} acres
            </span>
          </div>
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
          onClick={onClick}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex justify-end">
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {timeAgo}
        </div>
      </div>
    </div>
  );
}