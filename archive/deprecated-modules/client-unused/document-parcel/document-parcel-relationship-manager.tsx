import React, { useState } from 'react';
import {
  useDocumentParcelRelationships,
  DocumentParcelRelationship,
  CreateRelationshipData
} from '@/hooks/use-document-parcel-relationships';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from 'date-fns';
import { Trash2, Edit, Plus } from 'lucide-react';

// Relationship types
const RELATIONSHIP_TYPES = [
  'PRIMARY',
  'REFERENCED',
  'HISTORICAL',
  'ADJACENT',
  'ASSOCIATED',
  'DEPENDENT',
  'PARENT',
  'CHILD'
];

// Relationship statuses
const RELATIONSHIP_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'REJECTED',
  'ARCHIVED'
];

// Schema for creating a relationship
const createRelationshipSchema = z.object({
  parcelId: z.number({
    required_error: "Parcel ID is required",
  }),
  documentId: z.number({
    required_error: "Document ID is required",
  }),
  relationshipType: z.string({
    required_error: "Relationship type is required",
  }),
  status: z.string().default('ACTIVE'),
  notes: z.string().optional(),
});

// Schema for updating a relationship
const updateRelationshipSchema = z.object({
  relationshipType: z.string(),
  status: z.string(),
  notes: z.string().optional(),
});

type DocumentParcelRelationshipManagerProps = {
  documentId?: number;
  parcelId?: number;
  canEdit?: boolean;
  showTitle?: boolean;
};

export function DocumentParcelRelationshipManager({
  documentId,
  parcelId,
  canEdit = true,
  showTitle = true
}: DocumentParcelRelationshipManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<DocumentParcelRelationship | null>(null);

  const {
    relationships,
    isLoading,
    error,
    createRelationship,
    isCreating,
    updateRelationship,
    isUpdating,
    deleteRelationship,
    isDeleting
  } = useDocumentParcelRelationships(documentId, parcelId);

  // Create form
  const createForm = useForm<z.infer<typeof createRelationshipSchema>>({
    resolver: zodResolver(createRelationshipSchema),
    defaultValues: {
      documentId: documentId || 0,
      parcelId: parcelId || 0,
      relationshipType: 'PRIMARY',
      status: 'ACTIVE',
      notes: '',
    },
  });

  // Edit form
  const editForm = useForm<z.infer<typeof updateRelationshipSchema>>({
    resolver: zodResolver(updateRelationshipSchema),
    defaultValues: {
      relationshipType: '',
      status: '',
      notes: '',
    },
  });

  // Handle create form submission
  const onCreateSubmit = (values: z.infer<typeof createRelationshipSchema>) => {
    createRelationship(values as CreateRelationshipData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        createForm.reset();
      }
    });
  };

  // Handle edit form submission
  const onEditSubmit = (values: z.infer<typeof updateRelationshipSchema>) => {
    if (selectedRelationship) {
      updateRelationship({
        id: selectedRelationship.id,
        data: values
      }, {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedRelationship(null);
          editForm.reset();
        }
      });
    }
  };

  // Handle delete confirmation
  const onDeleteConfirm = () => {
    if (selectedRelationship) {
      deleteRelationship(selectedRelationship.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedRelationship(null);
        }
      });
    }
  };

  // Open edit dialog and set form values
  const handleEditClick = (relationship: DocumentParcelRelationship) => {
    setSelectedRelationship(relationship);
    editForm.reset({
      relationshipType: relationship.relationshipType,
      status: relationship.status,
      notes: relationship.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (relationship: DocumentParcelRelationship) => {
    setSelectedRelationship(relationship);
    setIsDeleteDialogOpen(true);
  };

  // Render loading state
  if (isLoading) {
    return <div className="p-4 text-center">Loading relationships...</div>;
  }

  // Render error state
  if (error) {
    return <div className="p-4 text-center text-red-500">Error loading relationships</div>;
  }

  // Get title based on what IDs we have
  const getTitle = () => {
    if (documentId && parcelId) {
      return 'Document-Parcel Relationship';
    } else if (documentId) {
      return 'Document Relationships';
    } else if (parcelId) {
      return 'Parcel Relationships';
    }
    return 'Relationships';
  };

  return (
    <div className="space-y-4">
      {showTitle && <h2 className="text-xl font-semibold">{getTitle()}</h2>}
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {relationships?.length || 0} relationship(s) found
        </p>
        
        {canEdit && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span>Add Relationship</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Relationship</DialogTitle>
                <DialogDescription>
                  Define a relationship between a document and parcel.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="documentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document ID</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            disabled={!!documentId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="parcelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcel ID</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            disabled={!!parcelId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="relationshipType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a relationship type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RELATIONSHIP_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RELATIONSHIP_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional notes about this relationship"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {relationships && relationships.length > 0 ? (
        <Table>
          <TableCaption>List of document-parcel relationships</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Document ID</TableHead>
              <TableHead>Parcel ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Notes</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {relationships.map((relationship) => (
              <TableRow key={relationship.id}>
                <TableCell>{relationship.documentId}</TableCell>
                <TableCell>{relationship.parcelId}</TableCell>
                <TableCell>
                  <Badge variant="outline">{relationship.relationshipType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={relationship.status === 'ACTIVE' ? 'default' :
                          relationship.status === 'INACTIVE' ? 'secondary' :
                          relationship.status === 'PENDING' ? 'outline' :
                          relationship.status === 'REJECTED' ? 'destructive' : 'outline'}
                  >
                    {relationship.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {relationship.createdAt &&
                    format(new Date(relationship.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {relationship.notes || '—'}
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(relationship)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(relationship)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="p-8 text-center border rounded-md bg-gray-50">
          <p className="text-gray-500">No relationships found</p>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create Relationship
            </Button>
          )}
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Relationship</DialogTitle>
            <DialogDescription>
              Update the details of this document-parcel relationship.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="relationshipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a relationship type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RELATIONSHIP_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RELATIONSHIP_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this relationship"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this relationship? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DocumentParcelRelationshipManager;