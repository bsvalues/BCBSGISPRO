import { useState } from 'react';
import useMapBookmarks, { BookmarkInput } from '@/hooks/use-map-bookmarks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bookmark, Map, Pin, Star, Trash2, Edit2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkManagerProps {
  onApplyBookmark?: (bookmark: { latitude: number; longitude: number; zoom: number }) => void;
  currentMapState?: { center: [number, number]; zoom: number };
  className?: string;
}

export function BookmarkManager({ onApplyBookmark, currentMapState, className }: BookmarkManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentBookmark, setCurrentBookmark] = useState<any>(null);
  const [formData, setFormData] = useState<BookmarkInput>({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    zoom: 10,
    icon: 'map-pin',
    color: '#3b82f6',
    tags: [],
    isDefault: false,
    isPinned: false
  });
  const [newTag, setNewTag] = useState('');

  const { 
    bookmarks,
    isLoading,
    createBookmarkMutation,
    updateBookmarkMutation,
    deleteBookmarkMutation,
    togglePinMutation,
    setDefaultBookmarkMutation
  } = useMapBookmarks();

  // Handle new bookmark creation
  const handleCreate = () => {
    if (currentMapState) {
      setFormData({
        ...formData,
        latitude: currentMapState.center[0],
        longitude: currentMapState.center[1],
        zoom: currentMapState.zoom
      });
    }
    setCreateDialogOpen(true);
  };

  // Handle bookmark edit
  const handleEdit = (bookmark: any) => {
    setCurrentBookmark(bookmark);
    setFormData({
      name: bookmark.name,
      description: bookmark.description || '',
      latitude: bookmark.latitude,
      longitude: bookmark.longitude,
      zoom: bookmark.zoom,
      icon: bookmark.icon || 'map-pin',
      color: bookmark.color || '#3b82f6',
      tags: bookmark.tags || [],
      isDefault: bookmark.isDefault,
      isPinned: bookmark.isPinned
    });
    setEditDialogOpen(true);
  };

  // Handle form submission for create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBookmarkMutation.mutate(formData);
    setCreateDialogOpen(false);
    resetForm();
  };

  // Handle form submission for edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentBookmark) {
      updateBookmarkMutation.mutate({
        id: currentBookmark.id,
        ...formData
      });
    }
    setEditDialogOpen(false);
    resetForm();
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      latitude: 0,
      longitude: 0,
      zoom: 10,
      icon: 'map-pin',
      color: '#3b82f6',
      tags: [],
      isDefault: false,
      isPinned: false
    });
    setCurrentBookmark(null);
  };

  // Add tag to bookmark
  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  // Remove tag from bookmark
  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    });
  };

  return (
    <Card className={cn("w-full backdrop-blur-md bg-white/60 dark:bg-black/60 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg", className)}>
      <CardHeader className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 dark:from-teal-900/20 dark:to-blue-900/20 py-3">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
          <Bookmark className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
          Map Bookmarks
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3">
        {isLoading ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">Loading bookmarks...</div>
        ) : bookmarks.length === 0 ? (
          <div className="py-8 text-center">
            <Map className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No saved locations yet</p>
            <Button 
              variant="outline" 
              className="rounded-full bg-white/70 dark:bg-gray-900/70 hover:bg-white dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700"
              onClick={handleCreate}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Current Location
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <BookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onApply={() => onApplyBookmark && onApplyBookmark(bookmark)}
                  onEdit={() => handleEdit(bookmark)}
                  onDelete={() => deleteBookmarkMutation.mutate(bookmark.id)}
                  onTogglePin={() => togglePinMutation.mutate({ id: bookmark.id, isPinned: !bookmark.isPinned })}
                  onSetDefault={() => setDefaultBookmarkMutation.mutate(bookmark.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50/80 dark:bg-gray-900/50 p-3 flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
        </div>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full shadow-md"
          onClick={handleCreate}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Bookmark
        </Button>
      </CardFooter>

      {/* Create Bookmark Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-gray-800 dark:text-gray-200">Save Map Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3 bg-white/70 dark:bg-gray-800/70"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3 h-20 bg-white/70 dark:bg-gray-800/70"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">Color</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.color}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">Tags</Label>
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {tag}
                        <button 
                          type="button" 
                          className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => removeTag(tag)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      className="bg-white/70 dark:bg-gray-800/70 flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isPinned" className="text-right">Pin to top</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Checkbox
                    id="isPinned"
                    checked={formData.isPinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked === true })}
                  />
                  <Label htmlFor="isPinned" className="text-sm font-normal cursor-pointer">
                    Show this bookmark at the top of the list
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isDefault" className="text-right">Set as default</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked === true })}
                  />
                  <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                    Use this location when opening the map
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
              >
                Save Location
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Bookmark Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-gray-800 dark:text-gray-200">Edit Bookmark</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3 bg-white/70 dark:bg-gray-800/70"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3 h-20 bg-white/70 dark:bg-gray-800/70"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-color" className="text-right">Color</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.color}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tags" className="text-right">Tags</Label>
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {tag}
                        <button 
                          type="button" 
                          className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => removeTag(tag)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="edit-tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      className="bg-white/70 dark:bg-gray-800/70 flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-isPinned" className="text-right">Pin to top</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Checkbox
                    id="edit-isPinned"
                    checked={formData.isPinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked === true })}
                  />
                  <Label htmlFor="edit-isPinned" className="text-sm font-normal cursor-pointer">
                    Show this bookmark at the top of the list
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-isDefault" className="text-right">Set as default</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Checkbox
                    id="edit-isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked === true })}
                  />
                  <Label htmlFor="edit-isDefault" className="text-sm font-normal cursor-pointer">
                    Use this location when opening the map
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="destructive" 
                className="mr-auto"
                onClick={() => {
                  if (currentBookmark) {
                    deleteBookmarkMutation.mutate(currentBookmark.id);
                    setEditDialogOpen(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface BookmarkItemProps {
  bookmark: any;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onSetDefault: () => void;
}

function BookmarkItem({ bookmark, onApply, onEdit, onDelete, onTogglePin, onSetDefault }: BookmarkItemProps) {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 border border-gray-200 dark:border-gray-800 transition-all",
        bookmark.isPinned && "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        bookmark.isDefault && "bg-teal-50/50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1">
          <div className="flex items-center">
            <h3 
              className="font-medium text-gray-800 dark:text-gray-200 mr-1 cursor-pointer hover:underline" 
              onClick={onApply}
              style={{ color: bookmark.color }}
            >
              {bookmark.name}
            </h3>
            {bookmark.isPinned && (
              <Pin className="h-3 w-3 text-blue-500 dark:text-blue-400" />
            )}
            {bookmark.isDefault && (
              <Star className="h-3 w-3 text-amber-500 dark:text-amber-400 ml-1" />
            )}
          </div>
          
          {bookmark.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{bookmark.description}</p>
          )}
          
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {bookmark.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4 bg-gray-50 dark:bg-gray-900">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
            onClick={onEdit}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {bookmark.latitude.toFixed(5)}, {bookmark.longitude.toFixed(5)}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-xs rounded-full"
          onClick={onApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}