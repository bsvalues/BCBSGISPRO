import React, { useState } from 'react';
import { useMapBookmarks, Bookmark } from '@/hooks/use-map-bookmarks';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Bookmark as BookmarkIcon, PlusCircle, Star, Pin, Trash, Edit, MapPin, Compass, Save } from 'lucide-react';

export interface BookmarkManagerProps {
  className?: string;
  compact?: boolean;
  onBookmarkSelect?: (lat: number, lng: number, zoom: number) => void;
}

export function BookmarkManager({ className, compact = false, onBookmarkSelect }: BookmarkManagerProps) {
  const { toast } = useToast();
  const { 
    bookmarks, 
    sortedBookmarks, 
    pinnedBookmarks,
    defaultBookmark,
    isLoading, 
    createBookmark, 
    updateBookmark, 
    deleteBookmark,
    togglePinned,
    setDefaultBookmark
  } = useMapBookmarks();

  // State for the edit/create dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<Bookmark | null>(null);
  
  // Form state
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    zoom: 14,
    color: '#3b82f6', // Default blue color
    tags: '',
    isPinned: false,
    isDefault: false
  });

  // Initialize form for new bookmark
  const initNewBookmarkForm = (defaultLocation?: { lat: number, lng: number, zoom: number }) => {
    setCurrentBookmark(null);
    setFormState({
      name: '',
      description: '',
      latitude: defaultLocation?.lat || 44.5638,
      longitude: defaultLocation?.lng || -123.2794,
      zoom: defaultLocation?.zoom || 14,
      color: '#3b82f6',
      tags: '',
      isPinned: false,
      isDefault: false
    });
    setIsDialogOpen(true);
  };

  // Initialize form for editing existing bookmark
  const initEditBookmarkForm = (bookmark: Bookmark) => {
    setCurrentBookmark(bookmark);
    setFormState({
      name: bookmark.name,
      description: bookmark.description || '',
      latitude: bookmark.latitude,
      longitude: bookmark.longitude,
      zoom: bookmark.zoom,
      color: bookmark.color || '#3b82f6',
      tags: bookmark.tags ? bookmark.tags.join(', ') : '',
      isPinned: !!bookmark.isPinned,
      isDefault: !!bookmark.isDefault
    });
    setIsDialogOpen(true);
  };

  // Update form state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const inputElement = e.target as HTMLInputElement;
      setFormState({ ...formState, [name]: inputElement.checked });
    } else {
      setFormState({ ...formState, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formState.name.trim()) {
      toast({ title: "Error", description: "Bookmark name is required", variant: "destructive" });
      return;
    }

    if (isNaN(formState.latitude) || isNaN(formState.longitude) || isNaN(formState.zoom)) {
      toast({ title: "Error", description: "Invalid coordinates or zoom level", variant: "destructive" });
      return;
    }

    // Process tags
    const tags = formState.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    // Create or update bookmark
    if (currentBookmark) {
      // Update existing bookmark
      updateBookmark.mutate({
        id: currentBookmark.id,
        name: formState.name,
        description: formState.description || null,
        latitude: formState.latitude,
        longitude: formState.longitude,
        zoom: formState.zoom,
        color: formState.color,
        tags: tags.length > 0 ? tags : null,
        isPinned: formState.isPinned,
        isDefault: formState.isDefault
      }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Bookmark updated successfully" });
          setIsDialogOpen(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update bookmark", variant: "destructive" });
        }
      });
    } else {
      // Create new bookmark
      createBookmark.mutate({
        name: formState.name,
        description: formState.description,
        latitude: formState.latitude,
        longitude: formState.longitude,
        zoom: formState.zoom,
        color: formState.color,
        tags: tags.length > 0 ? tags : undefined,
        isPinned: formState.isPinned,
        isDefault: formState.isDefault
      }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Bookmark created successfully" });
          setIsDialogOpen(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create bookmark", variant: "destructive" });
        }
      });
    }
  };

  // Handle delete confirmation
  const confirmDelete = (bookmark: Bookmark) => {
    setBookmarkToDelete(bookmark);
    setIsDeleteDialogOpen(true);
  };

  // Handle bookmark deletion
  const handleDelete = () => {
    if (bookmarkToDelete) {
      deleteBookmark.mutate(bookmarkToDelete.id, {
        onSuccess: () => {
          toast({ title: "Success", description: "Bookmark deleted successfully" });
          setIsDeleteDialogOpen(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete bookmark", variant: "destructive" });
        }
      });
    }
  };

  // Handle selecting a bookmark to center the map
  const handleBookmarkSelect = (bookmark: Bookmark) => {
    if (onBookmarkSelect) {
      onBookmarkSelect(bookmark.latitude, bookmark.longitude, bookmark.zoom);
    }
  };

  // Handle toggling pinned status
  const handleTogglePinned = (bookmark: Bookmark) => {
    togglePinned(bookmark.id, !bookmark.isPinned);
  };

  // Handle setting a bookmark as default
  const handleSetDefault = (bookmark: Bookmark) => {
    setDefaultBookmark(bookmark.id);
  };

  return (
    <Card className={cn("w-full backdrop-blur-sm bg-background/75 border border-accent shadow-md", className)}>
      <CardHeader className={compact ? "p-3" : "p-4"}>
        <CardTitle className="flex items-center gap-2">
          <BookmarkIcon className="h-5 w-5" />
          <span>Bookmarks</span>
        </CardTitle>
        {!compact && (
          <CardDescription>
            Save and manage your favorite map locations
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={compact ? "p-3 pt-0" : "p-4 pt-0"}>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-pulse">Loading bookmarks...</div>
          </div>
        ) : sortedBookmarks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <BookmarkIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No bookmarks yet</p>
            <p className="text-sm">Save your favorite locations for quick access</p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[250px]" : "h-[350px]"}>
            <div className="space-y-2">
              {defaultBookmark && (
                <div className="mb-3">
                  <div className="text-sm font-medium mb-1 flex items-center">
                    <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                    <span>Default Location</span>
                  </div>
                  <BookmarkCard 
                    bookmark={defaultBookmark} 
                    onSelect={handleBookmarkSelect}
                    onEdit={initEditBookmarkForm}
                    onDelete={confirmDelete}
                    onTogglePinned={handleTogglePinned}
                    compact={compact}
                  />
                </div>
              )}
              
              {pinnedBookmarks.length > 0 && defaultBookmark && pinnedBookmarks.some(b => b.id !== defaultBookmark.id) && (
                <div className="mb-3">
                  <div className="text-sm font-medium mb-1 flex items-center">
                    <Pin className="h-4 w-4 mr-1" />
                    <span>Pinned Locations</span>
                  </div>
                  <div className="space-y-2">
                    {pinnedBookmarks
                      .filter(b => defaultBookmark && b.id !== defaultBookmark.id)
                      .map(bookmark => (
                        <BookmarkCard 
                          key={bookmark.id} 
                          bookmark={bookmark} 
                          onSelect={handleBookmarkSelect}
                          onEdit={initEditBookmarkForm}
                          onDelete={confirmDelete}
                          onTogglePinned={handleTogglePinned}
                          compact={compact}
                        />
                      ))
                    }
                  </div>
                </div>
              )}
              
              {sortedBookmarks.some(b => !b.isPinned && (!defaultBookmark || b.id !== defaultBookmark.id)) && (
                <div>
                  {(defaultBookmark || pinnedBookmarks.length > 0) && (
                    <div className="text-sm font-medium mb-1 flex items-center">
                      <BookmarkIcon className="h-4 w-4 mr-1" />
                      <span>All Bookmarks</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {sortedBookmarks
                      .filter(b => !b.isPinned && (!defaultBookmark || b.id !== defaultBookmark.id))
                      .map(bookmark => (
                        <BookmarkCard 
                          key={bookmark.id} 
                          bookmark={bookmark} 
                          onSelect={handleBookmarkSelect}
                          onEdit={initEditBookmarkForm}
                          onDelete={confirmDelete}
                          onTogglePinned={handleTogglePinned}
                          onSetDefault={handleSetDefault}
                          compact={compact}
                        />
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className={cn("flex justify-between", compact ? "p-3 pt-0" : "p-4 pt-0")}>
        <Button 
          onClick={() => initNewBookmarkForm()} 
          className="w-full flex gap-1"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New Bookmark</span>
        </Button>
      </CardFooter>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentBookmark ? 'Edit Bookmark' : 'Create New Bookmark'}</DialogTitle>
            <DialogDescription>
              {currentBookmark 
                ? 'Update the details of your saved location' 
                : 'Save a location for quick access later'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Bookmark Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  placeholder="Home, Work, Favorite Park, etc."
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  placeholder="Add notes about this location"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formState.latitude}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formState.longitude}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="zoom">Zoom Level (1-20)</Label>
                <Input
                  id="zoom"
                  name="zoom"
                  type="number"
                  min="1"
                  max="20"
                  value={formState.zoom}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={formState.color}
                    onChange={handleInputChange}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    value={formState.color}
                    onChange={handleInputChange}
                    name="color"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formState.tags}
                  onChange={handleInputChange}
                  placeholder="work, home, favorite"
                />
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    id="isPinned"
                    name="isPinned"
                    type="checkbox"
                    checked={formState.isPinned}
                    onChange={(e) => setFormState({ ...formState, isPinned: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPinned" className="text-sm font-normal">Pin to top</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    id="isDefault"
                    name="isDefault"
                    type="checkbox"
                    checked={formState.isDefault}
                    onChange={(e) => setFormState({ ...formState, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isDefault" className="text-sm font-normal">Set as default</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentBookmark ? 'Update Bookmark' : 'Save Bookmark'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Bookmark</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the bookmark "{bookmarkToDelete?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  compact?: boolean;
  onSelect: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onTogglePinned: (bookmark: Bookmark) => void;
  onSetDefault?: (bookmark: Bookmark) => void;
}

function BookmarkCard({ 
  bookmark, 
  compact = false,
  onSelect, 
  onEdit, 
  onDelete,
  onTogglePinned,
  onSetDefault 
}: BookmarkCardProps) {
  return (
    <div 
      className={cn(
        "rounded-md border p-2 transition-colors",
        "hover:bg-accent/50 group relative",
        { "border-yellow-400": bookmark.isDefault },
        { "border-accent": !bookmark.isDefault }
      )}
      style={{ 
        borderLeftWidth: '4px',
        borderLeftColor: bookmark.color || '#3b82f6'
      }}
    >
      <div className="flex items-start justify-between">
        <div 
          className="flex-1 cursor-pointer" 
          onClick={() => onSelect(bookmark)}
        >
          <h4 className="font-medium flex items-center gap-1">
            {bookmark.isDefault && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
            {bookmark.isPinned && !bookmark.isDefault && <Pin className="h-3.5 w-3.5" />}
            {bookmark.name}
          </h4>
          
          {!compact && bookmark.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {bookmark.description}
            </p>
          )}
          
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              <span>{bookmark.latitude.toFixed(5)}, {bookmark.longitude.toFixed(5)}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Compass className="h-3 w-3" />
              <span>Zoom {bookmark.zoom}</span>
            </div>
          </div>
          
          {!compact && bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {bookmark.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => onEdit(bookmark)}
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive" 
            onClick={() => onDelete(bookmark)}
          >
            <Trash className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end gap-1 mt-1">
        {!bookmark.isDefault && onSetDefault && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs flex gap-0.5"
            onClick={() => onSetDefault(bookmark)}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Set Default</span>
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 text-xs flex gap-0.5"
          onClick={() => onTogglePinned(bookmark)}
        >
          <Pin className="h-3.5 w-3.5" />
          <span>{bookmark.isPinned ? 'Unpin' : 'Pin'}</span>
        </Button>
      </div>
    </div>
  );
}