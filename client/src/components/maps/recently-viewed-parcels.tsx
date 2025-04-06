import React, { useState } from 'react';
import { useRecentlyViewed, RecentParcel } from '@/hooks/use-recently-viewed';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MapPin, Clock, History, Trash2, Search, Home, X, BuildingEstate, Navigation, Eye } from 'lucide-react';
import { format } from 'date-fns';

export interface RecentlyViewedParcelsProps {
  className?: string;
  compact?: boolean;
  onParcelSelect?: (parcelId: number, center: [number, number], zoom: number) => void;
}

export function RecentlyViewedParcels({ className, compact = false, onParcelSelect }: RecentlyViewedParcelsProps) {
  const { toast } = useToast();
  const { 
    recentParcels, 
    isLoading, 
    removeRecentParcel,
    clearRecentParcels
  } = useRecentlyViewed();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle selecting a parcel
  const handleParcelSelect = (parcel: RecentParcel) => {
    if (onParcelSelect) {
      onParcelSelect(parcel.parcelId, parcel.center, parcel.zoom);
      toast({
        title: "Parcel Selected",
        description: `Navigating to ${parcel.parcelNumber}`,
      });
    }
  };

  // Handle removing a parcel from history
  const handleRemoveParcel = (parcel: RecentParcel, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentParcel.mutate(parcel.id, {
      onSuccess: () => {
        toast({
          title: "Removed",
          description: `Removed ${parcel.parcelNumber} from history`,
        });
      }
    });
  };

  // Handle clearing all history
  const handleClearAll = () => {
    clearRecentParcels.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "History cleared",
          description: "All recently viewed parcels have been cleared",
        });
        setIsDialogOpen(false);
      }
    });
  };

  // Filter parcels based on search term
  const filteredParcels = recentParcels.filter(parcel => {
    const searchLower = searchTerm.toLowerCase();
    return (
      parcel.parcelNumber.toLowerCase().includes(searchLower) ||
      (parcel.address && parcel.address.toLowerCase().includes(searchLower))
    );
  });

  // Format relative time for viewing
  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const viewed = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - viewed.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return format(viewed, 'MMM d, yyyy');
  };

  return (
    <Card className={cn("w-full backdrop-blur-sm bg-background/75 border border-accent shadow-md", className)}>
      <CardHeader className={compact ? "p-3" : "p-4"}>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <span>Recently Viewed</span>
        </CardTitle>
        {!compact && (
          <CardDescription>
            Parcels you have recently viewed
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={compact ? "p-3 pt-0" : "p-4 pt-0"}>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-pulse">Loading history...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentParcels.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parcels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1.5 h-7 w-7"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear</span>
                  </Button>
                )}
              </div>
            )}
            
            {recentParcels.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MapPin className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No recently viewed parcels</p>
                <p className="text-sm">Parcels you view will appear here</p>
              </div>
            ) : filteredParcels.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Search className="mx-auto h-8 w-8 opacity-20 mb-2" />
                <p>No matching parcels found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <ScrollArea className={compact ? "h-[250px]" : "h-[350px]"}>
                <div className="space-y-2">
                  {filteredParcels.map((parcel) => (
                    <div
                      key={parcel.id}
                      className="rounded-md border p-2 hover:bg-accent/50 cursor-pointer group relative transition-colors"
                      onClick={() => handleParcelSelect(parcel)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-1">
                            <BuildingEstate className="h-3.5 w-3.5" />
                            {parcel.parcelNumber}
                          </h4>
                          
                          {parcel.address && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                              {parcel.address}
                            </p>
                          )}
                          
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              <span>{formatRelativeTime(parcel.viewedAt)}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Navigation className="h-3 w-3" />
                              <span>Zoom {parcel.zoom}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => handleRemoveParcel(parcel, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-1.5 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex gap-0.5"
                          onClick={() => handleParcelSelect(parcel)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Parcel</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
      
      {recentParcels.length > 0 && (
        <CardFooter className={cn("flex justify-between", compact ? "p-3 pt-0" : "p-4 pt-0")}>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setIsDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear History</span>
          </Button>
        </CardFooter>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear History</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all recently viewed parcels? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}