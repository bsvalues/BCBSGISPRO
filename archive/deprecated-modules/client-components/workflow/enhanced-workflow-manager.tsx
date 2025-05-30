import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { 
  Workflow as WorkflowIcon, 
  Plus, 
  MoreVertical, 
  Trash, 
  Edit, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users,
  Calendar,
  ListChecks,
  MessageSquare 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useBentonArcGIS from '@/hooks/use-benton-arcgis';
import { Workflow, WorkflowEvent } from '@shared/schema';

// Define workflow status types with colors
const workflowStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-purple-100 text-purple-800',
  urgent: 'bg-red-100 text-red-800'
};

// Define workflow priority colors
const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

// Interface for the new workflow form
interface WorkflowFormData {
  name: string;
  description: string;
  workflowType: string;
  assignedTo: string;
  priority: string;
  dueDate?: string;
}

// Interface for checklist item
interface ChecklistItem {
  id?: number;
  name: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  priority?: string;
}

// Component props
interface EnhancedWorkflowManagerProps {
  showCompleted?: boolean;
  defaultFilter?: string;
  onWorkflowSelect?: (workflow: Workflow) => void;
}

export function EnhancedWorkflowManager({
  showCompleted = true,
  defaultFilter = 'all',
  onWorkflowSelect
}: EnhancedWorkflowManagerProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultFilter);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [newWorkflowData, setNewWorkflowData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    workflowType: 'assessment',
    assignedTo: '',
    priority: 'medium'
  });
  const [filterOptions, setFilterOptions] = useState({
    type: '',
    status: '',
    assignedTo: '',
    priority: '',
  });
  const [newComment, setNewComment] = useState('');
  const [newChecklist, setNewChecklist] = useState<ChecklistItem>({
    name: '',
    description: '',
    isCompleted: false,
    priority: 'medium'
  });
  
  const { toast } = useToast();
  const { searchParcelsByNumber } = useBentonArcGIS();
  
  // Fetch workflows
  const { data: workflows = [], isLoading: isLoadingWorkflows, refetch: refetchWorkflows } = useQuery({
    queryKey: ['/api/workflows'],
  });
  
  // Fetch workflow events for the selected workflow
  const { data: workflowEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/workflows', selectedWorkflow?.id, 'events'],
    enabled: !!selectedWorkflow,
  });
  
  // Fetch checklist items for the selected workflow
  const { data: checklistItems = [], isLoading: isLoadingChecklist } = useQuery({
    queryKey: ['/api/workflows', selectedWorkflow?.id, 'checklist'],
    enabled: !!selectedWorkflow,
  });
  
  // Fetch documents related to the selected workflow
  const { data: relatedDocuments = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/workflows', selectedWorkflow?.id, 'documents'],
    enabled: !!selectedWorkflow,
  });
  
  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (data: WorkflowFormData) => {
      return apiRequest('POST', '/api/workflows', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow created successfully",
        variant: "default"
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      resetNewWorkflowForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create workflow: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });
  
  // Update workflow status mutation
  const updateWorkflowStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/workflows/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow status updated",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update workflow status: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });
  
  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/workflows/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow deleted",
        variant: "default"
      });
      setIsDeleteDialogOpen(false);
      setSelectedWorkflow(null);
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete workflow: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ workflowId, comment }: { workflowId: number; comment: string }) => {
      return apiRequest('POST', `/api/workflows/${workflowId}/comments`, { comment });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment added",
        variant: "default"
      });
      setNewComment('');
      if (selectedWorkflow) {
        queryClient.invalidateQueries({ queryKey: ['/api/workflows', selectedWorkflow.id, 'events'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });
  
  // Add checklist item mutation
  const addChecklistItemMutation = useMutation({
    mutationFn: async ({ workflowId, item }: { workflowId: number; item: ChecklistItem }) => {
      return apiRequest('POST', `/api/workflows/${workflowId}/checklist`, item);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checklist item added",
        variant: "default"
      });
      setNewChecklist({
        name: '',
        description: '',
        isCompleted: false,
        priority: 'medium'
      });
      if (selectedWorkflow) {
        queryClient.invalidateQueries({ queryKey: ['/api/workflows', selectedWorkflow.id, 'checklist'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add checklist item: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });
  
  // Update checklist item mutation
  const updateChecklistItemMutation = useMutation({
    mutationFn: async ({ 
      workflowId, 
      itemId, 
      isCompleted 
    }: { 
      workflowId: number; 
      itemId: number; 
      isCompleted: boolean 
    }) => {
      return apiRequest('PATCH', `/api/workflows/${workflowId}/checklist/${itemId}`, { isCompleted });
    },
    onSuccess: () => {
      if (selectedWorkflow) {
        queryClient.invalidateQueries({ queryKey: ['/api/workflows', selectedWorkflow.id, 'checklist'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update checklist item: " + (error as Error).message,
        variant: "destructive"
      });
    }
  });
  
  // Filter workflows based on active tab and filter options
  const filteredWorkflows = workflows.filter((workflow: Workflow) => {
    // Filter by tab (status)
    if (activeTab !== 'all' && workflow.status !== activeTab) {
      return false;
    }
    
    // Hide completed workflows if showCompleted is false
    if (!showCompleted && workflow.status === 'complete') {
      return false;
    }
    
    // Apply additional filters
    if (filterOptions.type && workflow.workflowType !== filterOptions.type) {
      return false;
    }
    
    if (filterOptions.status && workflow.status !== filterOptions.status) {
      return false;
    }
    
    if (filterOptions.assignedTo && workflow.assignedTo !== filterOptions.assignedTo) {
      return false;
    }
    
    if (filterOptions.priority && workflow.priority !== filterOptions.priority) {
      return false;
    }
    
    return true;
  });
  
  // Reset the new workflow form
  const resetNewWorkflowForm = () => {
    setNewWorkflowData({
      name: '',
      description: '',
      workflowType: 'assessment',
      assignedTo: '',
      priority: 'medium'
    });
  };
  
  // Handle workflow creation submission
  const handleCreateWorkflow = () => {
    createWorkflowMutation.mutate(newWorkflowData);
  };
  
  // Handle workflow deletion
  const handleDeleteWorkflow = () => {
    if (selectedWorkflow) {
      deleteWorkflowMutation.mutate(selectedWorkflow.id);
    }
  };
  
  // Handle adding a comment
  const handleAddComment = () => {
    if (!selectedWorkflow || !newComment.trim()) return;
    
    addCommentMutation.mutate({
      workflowId: selectedWorkflow.id,
      comment: newComment
    });
  };
  
  // Handle adding a checklist item
  const handleAddChecklistItem = () => {
    if (!selectedWorkflow || !newChecklist.name.trim()) return;
    
    addChecklistItemMutation.mutate({
      workflowId: selectedWorkflow.id,
      item: newChecklist
    });
  };
  
  // Handle updating a checklist item
  const handleToggleChecklistItem = (itemId: number, isCompleted: boolean) => {
    if (!selectedWorkflow) return;
    
    updateChecklistItemMutation.mutate({
      workflowId: selectedWorkflow.id,
      itemId,
      isCompleted: !isCompleted
    });
  };
  
  // Handle selecting a workflow
  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    
    if (onWorkflowSelect) {
      onWorkflowSelect(workflow);
    }
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return `${dateObj.toLocaleDateString()} (${formatDistanceToNow(dateObj, { addSuffix: true })})`;
  };
  
  // Generate a status badge with correct color
  const StatusBadge = ({ status }: { status: string }) => (
    <Badge className={workflowStatusColors[status] || 'bg-gray-100 text-gray-800'}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </Badge>
  );
  
  // Generate a priority badge with correct color
  const PriorityBadge = ({ priority }: { priority: string }) => (
    <Badge className={priorityColors[priority] || 'bg-gray-100 text-gray-800'}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
  
  // Get the appropriate icon for a workflow type
  const getWorkflowTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileText className="h-4 w-4" />;
      case 'appeal':
        return <AlertCircle className="h-4 w-4" />;
      case 'split':
        return <MapPin className="h-4 w-4" />;
      case 'merge':
        return <Users className="h-4 w-4" />;
      default:
        return <WorkflowIcon className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflow Management</h2>
          <p className="text-muted-foreground">
            Manage assessment workflows and track progress
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Workflow
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Workflows List */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Workflows</CardTitle>
                  <CardDescription>
                    {isLoadingWorkflows ? 'Loading workflows...' : `${filteredWorkflows.length} workflows found`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 max-h-[500px] overflow-y-auto">
                  {isLoadingWorkflows ? (
                    <div className="flex justify-center p-4">
                      <p>Loading...</p>
                    </div>
                  ) : filteredWorkflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <WorkflowIcon className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="font-medium">No workflows found</h3>
                      <p className="text-sm text-muted-foreground">
                        Create a new workflow to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredWorkflows.map((workflow: Workflow) => (
                        <div
                          key={workflow.id}
                          className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedWorkflow?.id === workflow.id ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => handleSelectWorkflow(workflow)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getWorkflowTypeIcon(workflow.workflowType)}
                              <span className="ml-2 font-medium">{workflow.name}</span>
                            </div>
                            <StatusBadge status={workflow.status} />
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {workflow.description?.substring(0, 50)}
                            {workflow.description && workflow.description.length > 50 ? '...' : ''}
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(new Date(workflow.createdAt), { addSuffix: true })}
                            </div>
                            <PriorityBadge priority={workflow.priority || 'medium'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Workflow Detail */}
        <div className="lg:col-span-3">
          {selectedWorkflow ? (
            <Card>
              <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    {getWorkflowTypeIcon(selectedWorkflow.workflowType)}
                    <span className="ml-2">{selectedWorkflow.name}</span>
                  </CardTitle>
                  <CardDescription>
                    Created {formatDate(selectedWorkflow.createdAt)} by {selectedWorkflow.createdBy}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="mr-2 h-4 w-4" /> Reassign
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <Tabs defaultValue="details">
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="checklist">Checklist</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                        <StatusBadge status={selectedWorkflow.status} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Priority</h4>
                        <PriorityBadge priority={selectedWorkflow.priority || 'medium'} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                        <div className="flex items-center">
                          {getWorkflowTypeIcon(selectedWorkflow.workflowType)}
                          <span className="ml-2 capitalize">
                            {selectedWorkflow.workflowType}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {selectedWorkflow.dueDate ? formatDate(selectedWorkflow.dueDate) : 'No due date'}
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Assigned To</h4>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {selectedWorkflow.assignedTo || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                      <p className="text-sm">{selectedWorkflow.description || 'No description provided.'}</p>
                    </div>
                    
                    <div className="pt-4 space-y-2">
                      <h4 className="text-sm font-medium">Update Status</h4>
                      <div className="flex space-x-2">
                        <Button
                          variant={selectedWorkflow.status === 'pending' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateWorkflowStatusMutation.mutate({ id: selectedWorkflow.id, status: 'pending' })}
                        >
                          Pending
                        </Button>
                        <Button
                          variant={selectedWorkflow.status === 'in-progress' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateWorkflowStatusMutation.mutate({ id: selectedWorkflow.id, status: 'in-progress' })}
                        >
                          In Progress
                        </Button>
                        <Button
                          variant={selectedWorkflow.status === 'complete' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateWorkflowStatusMutation.mutate({ id: selectedWorkflow.id, status: 'complete' })}
                        >
                          Complete
                        </Button>
                        <Button
                          variant={selectedWorkflow.status === 'on_hold' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateWorkflowStatusMutation.mutate({ id: selectedWorkflow.id, status: 'on_hold' })}
                        >
                          On Hold
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="checklist" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      {isLoadingChecklist ? (
                        <div className="flex justify-center p-4">
                          <p>Loading checklist...</p>
                        </div>
                      ) : checklistItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center border rounded-md">
                          <ListChecks className="h-8 w-8 text-muted-foreground mb-2" />
                          <h3 className="font-medium">No checklist items</h3>
                          <p className="text-sm text-muted-foreground">
                            Add tasks to track progress of this workflow.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {checklistItems.map((item: any) => (
                            <div 
                              key={item.id} 
                              className="flex items-start p-3 border rounded-md"
                            >
                              <div className="flex items-center h-5 mr-3 mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={item.isCompleted}
                                  onChange={() => handleToggleChecklistItem(item.id, item.isCompleted)}
                                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className={`font-medium ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.name}
                                  </h4>
                                  <PriorityBadge priority={item.priority || 'medium'} />
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                                {item.dueDate && (
                                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due {formatDate(item.dueDate)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 space-y-3 border-t">
                      <h4 className="text-sm font-medium">Add Checklist Item</h4>
                      <Input
                        placeholder="Task name"
                        value={newChecklist.name}
                        onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={newChecklist.description || ''}
                        onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                      />
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="text-sm font-medium">Due Date (optional)</label>
                          <Input
                            type="date"
                            value={newChecklist.dueDate || ''}
                            onChange={(e) => setNewChecklist({ ...newChecklist, dueDate: e.target.value })}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium">Priority</label>
                          <select
                            className="w-full h-9 border rounded-md p-2"
                            value={newChecklist.priority}
                            onChange={(e) => setNewChecklist({ ...newChecklist, priority: e.target.value })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      <Button onClick={handleAddChecklistItem} disabled={!newChecklist.name.trim()}>
                        Add Task
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="comments" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {isLoadingEvents ? (
                        <div className="flex justify-center p-4">
                          <p>Loading comments...</p>
                        </div>
                      ) : workflowEvents.filter((event: WorkflowEvent) => event.eventType === 'comment').length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center border rounded-md">
                          <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                          <h3 className="font-medium">No comments yet</h3>
                          <p className="text-sm text-muted-foreground">
                            Add a comment to start the conversation.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {workflowEvents
                            .filter((event: WorkflowEvent) => event.eventType === 'comment')
                            .map((event: WorkflowEvent) => (
                              <div key={event.id} className="p-3 border rounded-md">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">{event.createdBy}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm">{event.details}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 space-y-2 border-t">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        Add Comment
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {isLoadingDocuments ? (
                        <div className="flex justify-center p-4">
                          <p>Loading documents...</p>
                        </div>
                      ) : relatedDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center border rounded-md">
                          <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                          <h3 className="font-medium">No documents attached</h3>
                          <p className="text-sm text-muted-foreground">
                            Add documents to this workflow.
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Added</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatedDocuments.map((doc: any) => (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium">{doc.name}</TableCell>
                                <TableCell>{doc.type}</TableCell>
                                <TableCell>
                                  {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">View</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                    <div className="pt-2 border-t">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" /> Attach Document
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <WorkflowIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No workflow selected</h3>
                <p className="text-muted-foreground mt-2">
                  Select a workflow from the list to view its details, or create a new one.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> New Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Create Workflow Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Add a new workflow to the system. Fill out the required information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Workflow name"
                value={newWorkflowData.name}
                onChange={(e) => setNewWorkflowData({ ...newWorkflowData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Workflow description"
                value={newWorkflowData.description}
                onChange={(e) => setNewWorkflowData({ ...newWorkflowData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full h-9 border rounded-md p-2"
                  value={newWorkflowData.workflowType}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, workflowType: e.target.value })}
                >
                  <option value="assessment">Assessment</option>
                  <option value="appeal">Appeal</option>
                  <option value="split">Split</option>
                  <option value="merge">Merge</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <select
                  className="w-full h-9 border rounded-md p-2"
                  value={newWorkflowData.priority}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned To</label>
                <Input
                  placeholder="Username or email"
                  value={newWorkflowData.assignedTo}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, assignedTo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date (Optional)</label>
                <Input
                  type="date"
                  value={newWorkflowData.dueDate || ''}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetNewWorkflowForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={!newWorkflowData.name.trim()}>
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Workflow Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorkflow}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EnhancedWorkflowManager;