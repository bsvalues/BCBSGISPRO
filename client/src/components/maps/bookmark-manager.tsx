import React, { useState } from 'react';
import useMapBookmarks from '@/hooks/use-map-bookmarks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CirclePlus, Bookmark, MapPin, Trash2, Edit, Pin, Star, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkManagerProps {
  onApplyBookmark?: (bookmark: { latitude: number; longitude: number; zoom: number }) => void;
  currentMapState?: { center: [number, number]; zoom: number };
  className?: string;
}

export function BookmarkManager({ onApplyBookmark, currentMapState, className }: BookmarkManagerProps) {
  const { bookmarks, isLoading, createBookmarkMutation, updateBookmarkMutation, deleteBookmarkMutation } = useMapBookmarks();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<number | null>(null);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [newBookmarkDescription, setNewBookmarkDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const pinnedBookmarks = bookmarks.filter(b => b.isPinned);
  const regularBookmarks = bookmarks.filter(b => !b.isPinned);
  
  // Function to open the create dialog with current map state
  const openCreateDialog = () => {
    if (currentMapState) {
      setNewBookmarkName('');
      setNewBookmarkDescription('');
      setIsDefault(false);
      setIsPinned(false);
      setTags([]);
      setIsCreateOpen(true);
    }
  };
  
  // Function to handle creating a new bookmark
  const handleCreateBookmark = () => {
    if (!currentMapState || !newBookmarkName.trim()) return;
    
    const [latitude, longitude] = currentMapState.center;
    
    createBookmarkMutation.mutate({
      name: newBookmarkName.trim(),
      description: newBookmarkDescription.trim() || undefined,
      latitude,
      longitude,
      zoom: currentMapState.zoom,
      isDefault,
      isPinned,
      tags: tags.length > 0 ? tags : undefined
    });
    
    setIsCreateOpen(false);
  };
  
  // Function to open edit dialog
  const openEditDialog = (bookmark: any) => {
    setSelectedBookmark(bookmark.id);
    setNewBookmarkName(bookmark.name);
    setNewBookmarkDescription(bookmark.description || '');
    setIsDefault(!!bookmark.isDefault);
    setIsPinned(!!bookmark.isPinned);
    setTags(bookmark.tags || []);
    setIsEditOpen(true);
  };
  
  // Function to handle updating a bookmark
  const handleUpdateBookmark = () => {
    if (!selectedBookmark || !newBookmarkName.trim()) return;
    
    updateBookmarkMutation.mutate({
      id: selectedBookmark,
      name: newBookmarkName.trim(),
      description: newBookmarkDescription.trim() || undefined,
      isDefault,
      isPinned,
      tags: tags.length > 0 ? tags : undefined
    });
    
    setIsEditOpen(false);
  };
  
  // Function to handle applying a bookmark (navigating to it)
  const handleApplyBookmark = (bookmark: any) => {
    if (onApplyBookmark) {
      onApplyBookmark({
        latitude: bookmark.latitude,
        longitude: bookmark.longitude,
        zoom: bookmark.zoom
      });
    }
  };
  
  // Function to add a tag
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  // Function to remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            <span>Saved Locations</span>
          </div>
          <Button variant="ghost" size="icon" onClick={openCreateDialog} disabled={!currentMapState}>
            <CirclePlus className="h-5 w-5" />
          </Button>
        </CardTitle>
        <CardDescription>Save and manage your favorite map locations</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">Loading bookmarks...</div>
        ) : bookmarks.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No saved locations yet.</p>
            <p className="text-sm">Use the + button to save your current view.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            {pinnedBookmarks.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Pin className="h-3.5 w-3.5" />
                  <span>Pinned Locations</span>
                </div>
                
                {pinnedBookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    onApply={() => handleApplyBookmark(bookmark)}
                    onEdit={() => openEditDialog(bookmark)}
                    onDelete={() => deleteBookmarkMutation.mutate(bookmark.id)}
                  />
                ))}
                
                <Separator className="my-4" />
              </>
            )}
            
            {regularBookmarks.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Saved Locations</span>
                </div>
                
                {regularBookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    onApply={() => handleApplyBookmark(bookmark)}
                    onEdit={() => openEditDialog(bookmark)}
                    onDelete={() => deleteBookmarkMutation.mutate(bookmark.id)}
                  />
                ))}
              </>
            )}
          </ScrollArea>
        )}
      </CardContent>
      
      {/* Create Bookmark Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Bookmark</DialogTitle>
            <DialogDescription>
              Save your current map view as a bookmark.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Favorite Location"
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={newBookmarkDescription}
                onChange={(e) => setNewBookmarkDescription(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="h-3 w-3 rounded-full text-xs"
                        aria-label={`Remove ${tag} tag`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isDefault" 
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(!!checked)} 
                />
                <Label htmlFor="isDefault" className="cursor-pointer">Set as default</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isPinned" 
                  checked={isPinned}
                  onCheckedChange={(checked) => setIsPinned(!!checked)} 
                />
                <Label htmlFor="isPinned" className="cursor-pointer">Pin to top</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              onClick={handleCreateBookmark}
              disabled={!newBookmarkName.trim() || createBookmarkMutation.isPending}
            >
              {createBookmarkMutation.isPending ? 'Saving...' : 'Save Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Bookmark Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
            <DialogDescription>
              Update the details of your saved location.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="My Favorite Location"
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add a description..."
                value={newBookmarkDescription}
                onChange={(e) => setNewBookmarkDescription(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-tags"
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="h-3 w-3 rounded-full text-xs"
                        aria-label={`Remove ${tag} tag`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-isDefault" 
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(!!checked)} 
                />
                <Label htmlFor="edit-isDefault" className="cursor-pointer">Set as default</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-isPinned" 
                  checked={isPinned}
                  onCheckedChange={(checked) => setIsPinned(!!checked)} 
                />
                <Label htmlFor="edit-isPinned" className="cursor-pointer">Pin to top</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              onClick={handleUpdateBookmark}
              disabled={!newBookmarkName.trim() || updateBookmarkMutation.isPending}
            >
              {updateBookmarkMutation.isPending ? 'Saving...' : 'Update Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Individual bookmark item component
interface BookmarkItemProps {
  bookmark: any;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BookmarkItem({ bookmark, onApply, onEdit, onDelete }: BookmarkItemProps) {
  return (
    <div className="group relative bg-card hover:bg-accent p-3 rounded-lg mb-2 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-2">
          <div className="flex items-center">
            <h4 className="text-sm font-medium">{bookmark.name}</h4>
            {bookmark.isDefault && (
              <Star className="h-3.5 w-3.5 ml-1 text-amber-500" />
            )}
          </div>
          
          {bookmark.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {bookmark.description}
            </p>
          )}
          
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {bookmark.tags.map((tag: string) => (
                <div key={tag} className="flex items-center bg-muted px-1.5 py-0.5 rounded text-[10px]">
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      
      <Button variant="secondary" size="sm" className="w-full mt-2" onClick={onApply}>
        Go to location
      </Button>
    </div>
  );
}

export default BookmarkManager;