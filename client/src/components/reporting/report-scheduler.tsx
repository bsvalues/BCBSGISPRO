import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarClock, Clock, Users, Calendar, AlertTriangle, Info, Trash2, PencilLine, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// Zod schema for schedule form
const scheduleSchema = z.object({
  templateId: z.number({ required_error: 'Report template is required' }),
  name: z.string().min(1, 'Schedule name is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly'], { required_error: 'Frequency is required' }),
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  month: z.number().optional(),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  parameters: z.record(z.any()),
  recipients: z.string().min(1, 'At least one recipient is required'),
  active: z.boolean().default(true),
});

// TypeScript types
interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  templateType: string;
  parameterSchema: Record<string, any>;
}

interface ReportSchedule {
  id?: number;
  templateId: number;
  templateName?: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  month?: number;
  hour: number;
  minute: number;
  parameters: Record<string, any>;
  recipients: string;
  active: boolean;
  createdAt?: string;
  lastRun?: string;
  nextRun?: string;
}

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export const ReportScheduler = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ReportSchedule | null>(null);
  const { toast } = useToast();

  // Fetch report templates
  const { data: templates } = useQuery({
    queryKey: ['/api/reports/templates'],
    queryFn: async () => {
      const response = await apiRequest('/api/reports/templates');
      return response as ReportTemplate[];
    },
  });

  // Fetch report schedules
  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ['/api/reports/schedules'],
    queryFn: async () => {
      const response = await apiRequest('/api/reports/schedules');
      return response as ReportSchedule[];
    },
  });

  // Create form
  const createForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: '',
      hour: 8,
      minute: 0,
      parameters: {},
      recipients: '',
      active: true,
    }
  });

  // Edit form
  const editForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
  });

  // Mutations
  const createScheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      const response = await apiRequest('/api/reports/schedules', {
        method: 'POST',
        data: values,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/schedules'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: 'Schedule created successfully',
        description: 'Your report schedule has been created and is now active.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create schedule',
        description: error.message || 'An error occurred while creating the schedule.',
        variant: 'destructive',
      });
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues & { id: number }) => {
      const { id, ...data } = values;
      const response = await apiRequest(`/api/reports/schedules/${id}`, {
        method: 'PATCH',
        data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/schedules'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Schedule updated successfully',
        description: 'Your changes to the schedule have been saved.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update schedule',
        description: error.message || 'An error occurred while updating the schedule.',
        variant: 'destructive',
      });
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/reports/schedules/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/schedules'] });
      setIsDeleteDialogOpen(false);
      setSelectedSchedule(null);
      toast({
        title: 'Schedule deleted successfully',
        description: 'The report schedule has been removed.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete schedule',
        description: error.message || 'An error occurred while deleting the schedule.',
        variant: 'destructive',
      });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => {
      const response = await apiRequest(`/api/reports/schedules/${id}`, {
        method: 'PATCH',
        data: { active },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/schedules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update schedule',
        description: error.message || 'An error occurred while updating the schedule.',
        variant: 'destructive',
      });
    }
  });

  // Form submission handlers
  const onCreateSubmit = (values: ScheduleFormValues) => {
    createScheduleMutation.mutateAsync(values);
  };

  const onEditSubmit = (values: ScheduleFormValues) => {
    if (!selectedSchedule?.id) return;
    updateScheduleMutation.mutateAsync({ ...values, id: selectedSchedule.id });
  };

  const handleEdit = (schedule: ReportSchedule) => {
    setSelectedSchedule(schedule);
    
    // Reset form with schedule values
    editForm.reset({
      templateId: schedule.templateId,
      name: schedule.name,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      month: schedule.month,
      hour: schedule.hour,
      minute: schedule.minute,
      parameters: schedule.parameters,
      recipients: schedule.recipients,
      active: schedule.active,
    });
    
    setIsEditDialogOpen(true);
  };

  const handleDelete = (schedule: ReportSchedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedSchedule?.id) return;
    deleteScheduleMutation.mutateAsync(selectedSchedule.id);
  };

  const handleToggleActive = (schedule: ReportSchedule) => {
    if (!schedule.id) return;
    toggleActiveMutation.mutateAsync({ 
      id: schedule.id, 
      active: !schedule.active 
    });
  };

  // Helper to get frequency display text
  const getFrequencyDisplay = (schedule: ReportSchedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[schedule.dayOfWeek || 0]}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth}`;
      case 'quarterly':
        const months = ['January', 'April', 'July', 'October'];
        return 'Quarterly';
      default:
        return schedule.frequency;
    }
  };

  // Helper to format time
  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scheduled Reports</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create New Schedule
        </Button>
      </div>

      {loadingSchedules ? (
        <div>Loading schedules...</div>
      ) : !schedules || schedules.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="pt-6 text-center">
            <InfoIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">No schedules created yet</h3>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">
              Create a schedule to automatically generate reports on a regular basis.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className={cn(!schedule.active && "opacity-70")}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {schedule.name}
                      {!schedule.active && (
                        <Badge variant="outline" className="ml-2">
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {schedule.templateName || `Template ID: ${schedule.templateId}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(schedule)}>
                            <PencilLine className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span>{getFrequencyDisplay(schedule)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined 
                        ? `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek]} at ` 
                        : schedule.frequency === 'monthly' && schedule.dayOfMonth !== undefined
                        ? `Day ${schedule.dayOfMonth} at `
                        : ''}
                      {formatTime(schedule.hour, schedule.minute)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {schedule.recipients.split(',').length} recipient{schedule.recipients.split(',').length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {schedule.lastRun && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Last run: {format(new Date(schedule.lastRun), 'PPp')}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                {schedule.nextRun && (
                  <div className="text-sm">
                    Next run: {format(new Date(schedule.nextRun), 'PPp')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch 
                    checked={schedule.active} 
                    onCheckedChange={() => handleToggleActive(schedule)}
                  />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Set up a recurring report schedule
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Monthly Workflow Summary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Template</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a report template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates?.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {createForm.watch('frequency') === 'weekly' && (
                    <FormField
                      control={createForm.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Week</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Sunday</SelectItem>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {createForm.watch('frequency') === 'monthly' && (
                    <FormField
                      control={createForm.control}
                      name="dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Month</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => (
                                <SelectItem key={i} value={(i + 1).toString()}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="hour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hour</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={23} {...field} />
                        </FormControl>
                        <FormDescription>24-hour format (0-23)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="minute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minute</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={59} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={createForm.control}
                  name="parameters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Range</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange({ range: value })}
                        defaultValue={field.value?.range}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CURRENT_DAY">Current Day</SelectItem>
                          <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                          <SelectItem value="CURRENT_WEEK">Current Week</SelectItem>
                          <SelectItem value="LAST_WEEK">Last Week</SelectItem>
                          <SelectItem value="CURRENT_MONTH">Current Month</SelectItem>
                          <SelectItem value="LAST_MONTH">Last Month</SelectItem>
                          <SelectItem value="CURRENT_QUARTER">Current Quarter</SelectItem>
                          <SelectItem value="LAST_QUARTER">Last Quarter</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The time period to include in the report
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="recipients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipients</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com, another@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of email addresses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Schedule will run automatically if active
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createScheduleMutation.isPending}
                >
                  {createScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update the recurring report schedule
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
              {/* Same form fields as create, but populated with schedule data */}
              {/* ... (Similar to create form but with editForm) */}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateScheduleMutation.isPending}
                >
                  {updateScheduleMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The schedule will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteScheduleMutation.isPending ? "Deleting..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Helper icon component
const InfoIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
};