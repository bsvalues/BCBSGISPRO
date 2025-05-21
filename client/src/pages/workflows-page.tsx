import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModernLayout from '../components/layout/modern-layout';
import { 
  Plus, 
  Search, 
  Filter, 
  CalendarDays, 
  Clock, 
  FileText, 
  MapPin, 
  UserCircle,
  ArrowUpDown,
  CheckCircle, 
  X, 
  AlertCircle, 
  Loader2
} from 'lucide-react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '../hooks/use-toast';

// Define workflow types and statuses
type WorkflowType = 'long_plat' | 'bla' | 'merge_split' | 'sm00_report';
type WorkflowStatus = 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';

// Workflow type labels for display
const workflowTypeLabels: Record<WorkflowType, string> = {
  long_plat: 'Long Plat',
  bla: 'Boundary Line Adjustment',
  merge_split: 'Merge/Split',
  sm00_report: 'SM00 Report'
};

// Status badges with appropriate colors
const statusBadges: Record<WorkflowStatus, React.ReactNode> = {
  draft: <Badge variant="outline" className="bg-gray-100 text-gray-800">Draft</Badge>,
  in_progress: <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>,
  review: <Badge variant="outline" className="bg-amber-100 text-amber-800">Review</Badge>,
  completed: <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>,
  archived: <Badge variant="outline" className="bg-gray-100 text-gray-500">Archived</Badge>
};

// Demo workflows for testing
const mockWorkflows = [
  {
    id: 1,
    title: 'Johnson Property Division',
    type: 'long_plat' as WorkflowType,
    status: 'in_progress' as WorkflowStatus,
    createdAt: new Date('2025-04-15'),
    dueDate: new Date('2025-05-30'),
    assignee: 'Sarah Thompson',
    parcelId: '123456-78-9012',
    description: 'Division of Johnson farm into 8 residential lots',
    progress: 65,
    documents: 4
  },
  {
    id: 2,
    title: 'Westside Commercial Merger',
    type: 'merge_split' as WorkflowType,
    status: 'review' as WorkflowStatus,
    createdAt: new Date('2025-04-10'),
    dueDate: new Date('2025-05-20'),
    assignee: 'Michael Rodriguez',
    parcelId: '876543-21-0987',
    description: 'Merger of three commercial lots for shopping center development',
    progress: 85,
    documents: 7
  },
  {
    id: 3,
    title: 'Riverfront Properties BLA',
    type: 'bla' as WorkflowType,
    status: 'draft' as WorkflowStatus,
    createdAt: new Date('2025-04-20'),
    dueDate: new Date('2025-06-10'),
    assignee: 'Emily Watson',
    parcelId: '345678-90-1234',
    description: 'Boundary line adjustment between adjacent riverfront properties',
    progress: 25,
    documents: 2
  },
  {
    id: 4,
    title: 'Mountain View Estates',
    type: 'long_plat' as WorkflowType,
    status: 'completed' as WorkflowStatus,
    createdAt: new Date('2025-03-05'),
    dueDate: new Date('2025-04-25'),
    assignee: 'David Chen',
    parcelId: '567890-12-3456',
    description: 'Division of 25-acre estate into 12 residential lots',
    progress: 100,
    documents: 9
  },
  {
    id: 5,
    title: 'Downtown Zoning Reassessment',
    type: 'sm00_report' as WorkflowType,
    status: 'in_progress' as WorkflowStatus,
    createdAt: new Date('2025-04-18'),
    dueDate: new Date('2025-05-15'),
    assignee: 'Jessica Adams',
    parcelId: '234567-89-0123',
    description: 'Special assessment for rezoned commercial properties',
    progress: 40,
    documents: 5
  }
];

// Workflow progress component
const WorkflowProgress: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>{progress}% Complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

// Create workflow dialog component
const CreateWorkflowDialog: React.FC<{ onCreateWorkflow: (data: any) => void }> = ({ onCreateWorkflow }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkflowType>('long_plat');
  const [description, setDescription] = useState('');
  const [parcelId, setParcelId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = () => {
    if (!title) return;
    
    onCreateWorkflow({
      id: Date.now(),
      title,
      type,
      description,
      parcelId,
      dueDate,
      status: 'draft' as WorkflowStatus,
      createdAt: new Date(),
      assignee: 'Current User',
      progress: 0,
      documents: 0
    });
    
    // Reset form
    setTitle('');
    setType('long_plat');
    setDescription('');
    setParcelId('');
    setDueDate(undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>
            Set up a new workflow for tracking a parcel assessment or adjustment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Workflow Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Smith Property Division"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="workflow-type" className="text-sm font-medium">
              Workflow Type
            </label>
            <Select value={type} onValueChange={(value) => setType(value as WorkflowType)}>
              <SelectTrigger id="workflow-type">
                <SelectValue placeholder="Select workflow type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(workflowTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="parcel-id" className="text-sm font-medium">
              Parcel ID
            </label>
            <Input
              id="parcel-id"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              placeholder="E.g. 123456-78-9012"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="due-date" className="text-sm font-medium">
              Due Date
            </label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Brief description of the workflow"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WorkflowsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [workflows, setWorkflows] = useState(mockWorkflows);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDateFilterDialog, setShowDateFilterDialog] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  
  // Fetch workflows (using mock data for now)
  const { data: workflowsData, isLoading, isError } = useQuery({ 
    queryKey: ['workflows'],
    queryFn: async () => {
      // Simulate API request
      return new Promise<typeof mockWorkflows>(resolve => {
        setTimeout(() => resolve(mockWorkflows), 500);
      });
    },
    enabled: false // Disabled for now since we're using mock data
  });

  // Create a new workflow
  const handleCreateWorkflow = (newWorkflow: any) => {
    setWorkflows([newWorkflow, ...workflows]);
    toast({
      title: "Workflow created",
      description: `${newWorkflow.title} has been created successfully.`,
    });
  };

  // Handle sorting
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter workflows based on active tab, search query, and date range
  const filteredWorkflows = workflows.filter(workflow => {
    // Filter by status (tab)
    if (activeTab !== 'all' && workflow.status !== activeTab) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        workflow.title.toLowerCase().includes(query) ||
        workflow.parcelId.toLowerCase().includes(query) ||
        workflow.description.toLowerCase().includes(query) ||
        workflow.assignee.toLowerCase().includes(query)
      );
    }
    
    // Filter by date range
    if (dateRange.from && workflow.createdAt < dateRange.from) {
      return false;
    }
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      if (workflow.createdAt > toDate) {
        return false;
      }
    }
    
    return true;
  });

  // Sort filtered workflows
  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
    if (sortField === 'createdAt' || sortField === 'dueDate') {
      return sortDirection === 'asc'
        ? a[sortField].getTime() - b[sortField].getTime()
        : b[sortField].getTime() - a[sortField].getTime();
    } else if (sortField === 'progress') {
      return sortDirection === 'asc'
        ? a[sortField] - b[sortField]
        : b[sortField] - a[sortField];
    } else {
      const aValue = String(a[sortField as keyof typeof a] || '');
      const bValue = String(b[sortField as keyof typeof b] || '');
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
  });

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
            <p className="text-muted-foreground">
              Manage and track all your property assessment workflows
            </p>
          </div>
          
          <CreateWorkflowDialog onCreateWorkflow={handleCreateWorkflow} />
        </div>
        
        <div className="flex flex-col space-y-4">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <TabsList className="grid grid-cols-5 sm:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search workflows..."
                    className="w-full pl-8 sm:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-4">
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">Filter Workflows</h4>
                      <Separator />
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium leading-none">Type</h5>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select workflow type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All types</SelectItem>
                              {Object.entries(workflowTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium leading-none">Date Range</h5>
                          <div className="flex items-center space-x-2">
                            <div className="border rounded-md p-3">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange.from}
                                selected={{
                                  from: dateRange.from,
                                  to: dateRange.to
                                }}
                                onSelect={(range) => {
                                  if (range) {
                                    setDateRange({
                                      from: range.from,
                                      to: range.to
                                    });
                                  } else {
                                    setDateRange({
                                      from: undefined,
                                      to: undefined
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setDateRange({ from: undefined, to: undefined })}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <TabsContent value="all" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="rounded-md bg-destructive/10 p-6 text-center">
                  <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <h3 className="font-medium text-destructive">Failed to load workflows</h3>
                  <p className="text-sm text-muted-foreground mt-1">There was an error loading the workflow data.</p>
                </div>
              ) : sortedWorkflows.length === 0 ? (
                <div className="rounded-md bg-muted p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No workflows found</h3>
                  <p className="text-muted-foreground mt-2 mb-4">
                    {searchQuery ? 'No workflows match your search criteria.' : 'Get started by creating your first workflow.'}
                  </p>
                  {searchQuery ? (
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  ) : (
                    <CreateWorkflowDialog onCreateWorkflow={handleCreateWorkflow} />
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer w-[300px]"
                          onClick={() => toggleSort('title')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Title</span>
                            {sortField === 'title' && (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => toggleSort('type')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Type</span>
                            {sortField === 'type' && (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => toggleSort('status')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {sortField === 'status' && (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hidden md:table-cell"
                          onClick={() => toggleSort('dueDate')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Due Date</span>
                            {sortField === 'dueDate' && (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hidden lg:table-cell"
                          onClick={() => toggleSort('assignee')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Assignee</span>
                            {sortField === 'assignee' && (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hidden lg:table-cell"
                          onClick={() => toggleSort('progress')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Progress</span>
                            {sortField === 'progress' && (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedWorkflows.map((workflow) => (
                        <TableRow key={workflow.id}>
                          <TableCell className="font-medium">
                            <div>
                              <Link href={`/workflow/${workflow.id}`} className="hover:underline text-primary">
                                {workflow.title}
                              </Link>
                              <div className="text-xs text-muted-foreground mt-1">
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {workflow.parcelId}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {workflowTypeLabels[workflow.type]}
                          </TableCell>
                          <TableCell>
                            {statusBadges[workflow.status]}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                              {format(workflow.dueDate, 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center">
                              <UserCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                              {workflow.assignee}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <WorkflowProgress progress={workflow.progress} />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <span className="sr-only">Open menu</span>
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Link href={`/workflow/${workflow.id}`}>
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Edit Workflow</DropdownMenuItem>
                                <DropdownMenuItem>Assign User</DropdownMenuItem>
                                <DropdownMenuItem>Add Document</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  Delete Workflow
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            {/* The same content will appear for all tabs, filtered by the activeTab state */}
            <TabsContent value="draft" className="mt-6">
              {/* Same content as "all" tab, filtered by status */}
            </TabsContent>
            <TabsContent value="in_progress" className="mt-6">
              {/* Same content as "all" tab, filtered by status */}
            </TabsContent>
            <TabsContent value="review" className="mt-6">
              {/* Same content as "all" tab, filtered by status */}
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              {/* Same content as "all" tab, filtered by status */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ModernLayout>
  );
};

export default WorkflowsPage;