import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  LinkIcon, 
  Map, 
  Search, 
  AlertTriangle, 
  Home,
  User, 
  Unlink
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Document, Parcel } from '@shared/schema';

interface DocumentParcelManagerProps {
  document: Document;
}

export function DocumentParcelManager({ document }: DocumentParcelManagerProps) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcelToUnlink, setSelectedParcelToUnlink] = useState<Parcel | null>(null);
  const { toast } = useToast();
  
  // Fetch linked parcels
  const { 
    data: linkedParcels = [], 
    isLoading: isLoadingLinkedParcels,
    error: linkedParcelsError 
  } = useQuery({
    queryKey: [`/api/documents/${document.id}/parcels`],
    enabled: !!document.id,
  });
  
  // Parcel search query
  const { 
    data: searchResults = [], 
    isLoading: isSearching,
    refetch: performSearch,
    isFetching: isSearchFetching
  } = useQuery({
    queryKey: ['/api/parcels/search', searchQuery],
    enabled: false, // Don't run automatically
  });
  
  // Link document to parcel mutation
  const linkParcelMutation = useMutation({
    mutationFn: async ({
      documentId,
      parcelId
    }: {
      documentId: number;
      parcelId: number;
    }) => {
      const res = await apiRequest(
        'POST',
        `/api/documents/${documentId}/parcels`,
        { parcelIds: [parcelId] }
      );
      return res.json();
    },
    onSuccess: () => {
      // Refresh linked parcels
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/parcels`] });
      
      // Show success toast
      toast({
        title: 'Parcel Linked',
        description: 'Successfully linked document to parcel'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Linking Parcel',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Unlink document from parcel mutation
  const unlinkParcelMutation = useMutation({
    mutationFn: async ({
      documentId,
      parcelId
    }: {
      documentId: number;
      parcelId: number;
    }) => {
      const res = await apiRequest(
        'DELETE',
        `/api/documents/${documentId}/parcels`,
        { parcelIds: [parcelId] }
      );
      return res.json();
    },
    onSuccess: () => {
      // Reset selected parcel
      setSelectedParcelToUnlink(null);
      
      // Refresh linked parcels
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/parcels`] });
      
      // Show success toast
      toast({
        title: 'Parcel Unlinked',
        description: 'Successfully removed link between document and parcel'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Unlinking Parcel',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search Query Required',
        description: 'Please enter a parcel number or address to search',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await performSearch();
    } catch (error) {
      toast({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'Failed to search parcels',
        variant: 'destructive'
      });
    }
  };
  
  const handleLinkParcel = async (parcelId: number) => {
    try {
      await linkParcelMutation.mutateAsync({
        documentId: document.id,
        parcelId
      });
    } catch (error) {
      console.error('Error linking parcel:', error);
    }
  };
  
  const handleUnlinkParcel = async () => {
    if (!selectedParcelToUnlink) return;
    
    try {
      await unlinkParcelMutation.mutateAsync({
        documentId: document.id,
        parcelId: selectedParcelToUnlink.id
      });
    } catch (error) {
      console.error('Error unlinking parcel:', error);
    }
  };
  
  const isParcelLinked = (parcelId: number) => {
    return linkedParcels.some(p => p.id === parcelId);
  };
  
  if (isLoadingLinkedParcels) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (linkedParcelsError) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading linked parcels</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Linked Parcels
            </CardTitle>
            <CardDescription>
              Manage parcel associations for this document
            </CardDescription>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => setIsSearchDialogOpen(true)}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Add Parcel Link
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {linkedParcels.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcel Number</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedParcels.map((parcel) => (
                  <TableRow key={parcel.id}>
                    <TableCell className="font-medium">{parcel.parcelNumber}</TableCell>
                    <TableCell>{parcel.address || 'No address'}</TableCell>
                    <TableCell>{parcel.owner || 'Unknown'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedParcelToUnlink(parcel)}
                      >
                        <Unlink className="h-3.5 w-3.5 mr-1" />
                        Unlink
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <Map className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
              No Linked Parcels
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              This document isn't linked to any parcels yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSearchDialogOpen(true)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Add Parcel Link
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Parcel Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Link Document to Parcels</DialogTitle>
            <DialogDescription>
              Search for parcels to associate with this document
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Search Form */}
            <div className="flex gap-3">
              <div className="flex-grow">
                <Label htmlFor="parcel-search" className="sr-only">
                  Search Parcels
                </Label>
                <Input
                  id="parcel-search"
                  placeholder="Search by parcel number or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isSearchFetching || !searchQuery.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearchFetching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Search Results */}
            {(searchResults.length > 0 || isSearchFetching) && (
              <div>
                <h3 className="text-sm font-medium mb-3">Search Results</h3>
                
                {isSearchFetching ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parcel Number</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead className="w-24 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((parcel) => (
                          <TableRow key={parcel.id}>
                            <TableCell className="font-medium">{parcel.parcelNumber}</TableCell>
                            <TableCell>{parcel.address || 'No address'}</TableCell>
                            <TableCell>{parcel.owner || 'Unknown'}</TableCell>
                            <TableCell className="text-right">
                              {isParcelLinked(parcel.id) ? (
                                <Badge variant="secondary">Linked</Badge>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleLinkParcel(parcel.id)}
                                  disabled={linkParcelMutation.isPending}
                                >
                                  <LinkIcon className="h-3.5 w-3.5 mr-1" />
                                  Link
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
            
            {searchQuery && !isSearchFetching && searchResults.length === 0 && (
              <div className="text-center py-8 border rounded-md">
                <Search className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No Results Found
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try a different search term or parcel number
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSearchDialogOpen(false);
                setSearchQuery('');
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unlink Confirmation Dialog */}
      <AlertDialog 
        open={selectedParcelToUnlink !== null} 
        onOpenChange={(open) => !open && setSelectedParcelToUnlink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Unlink</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this document from parcel{' '}
              <span className="font-semibold">{selectedParcelToUnlink?.parcelNumber}</span>?
              This action does not delete the parcel or document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnlinkParcel}
              disabled={unlinkParcelMutation.isPending}
            >
              {unlinkParcelMutation.isPending ? 'Unlinking...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}