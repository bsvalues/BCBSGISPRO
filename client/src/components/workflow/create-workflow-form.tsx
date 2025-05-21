import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';
import { useRbacAuth } from '../../context/rbac-auth-context';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, FlaskConical, FileText, MapPin, Check, Loader2 } from 'lucide-react';

// Workflow types and their labels
export const workflowTypes = {
  long_plat: 'Long Plat',
  short_plat: 'Short Plat',
  bla: 'Boundary Line Adjustment',
  merge_split: 'Parcel Merge/Split',
  record_of_survey: 'Record of Survey',
  sm00_report: 'SM00 Report'
};

// Form schema for creating a workflow
const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }),
  type: z.enum(['long_plat', 'short_plat', 'bla', 'merge_split', 'record_of_survey', 'sm00_report']),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  notifyOnChange: z.boolean().default(true),
  attachDocuments: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWorkflowFormProps {
  parcel?: any;
}

const CreateWorkflowForm: React.FC<CreateWorkflowFormProps> = ({ parcel }) => {
  const { user } = useRbacAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Default form values
  const defaultValues: Partial<FormValues> = {
    title: parcel ? `${workflowTypes.bla} - ${parcel.APN || 'Unknown Parcel'}` : '',
    type: 'bla',
    priority: 'medium',
    notifyOnChange: true,
    attachDocuments: false,
  };

  // Set up form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiRequest('POST', '/api/workflows', {
        ...values,
        parcelId: parcel?.APN,
        parcelAddress: parcel?.SITUS_ADDRESS,
        parcelOwner: parcel?.OWNER_NAME,
        createdBy: user?.id,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Workflow created',
        description: 'The workflow has been created successfully.',
        variant: 'default',
      });
      
      // Redirect to the workflow page
      setLocation(`/workflows/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error creating workflow',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Form submit handler
  const onSubmit = (values: FormValues) => {
    createWorkflowMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Parcel Information */}
        {parcel && (
          <div className="p-3 bg-muted/30 rounded-md mb-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-medium">Selected Parcel</h3>
                <div className="text-sm">
                  <p className="text-muted-foreground">APN: {parcel.APN || 'Unknown'}</p>
                  {parcel.SITUS_ADDRESS && (
                    <p className="text-muted-foreground">{parcel.SITUS_ADDRESS}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workflow Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workflow type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(workflowTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of workflow to create
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter workflow title" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive title for the workflow
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter workflow description (optional)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide details about this workflow
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Set the workflow priority
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date (Optional)</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When this workflow should be completed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Notifications */}
        <FormField
          control={form.control}
          name="notifyOnChange"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Receive notifications</FormLabel>
                <FormDescription>
                  Get notified when changes are made to this workflow
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Attach Documents */}
        <FormField
          control={form.control}
          name="attachDocuments"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Attach relevant documents</FormLabel>
                <FormDescription>
                  Link existing documents to this workflow
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset(defaultValues)}
          >
            Reset
          </Button>
          <Button 
            type="submit" 
            disabled={createWorkflowMutation.isPending}
            className="flex items-center gap-2"
          >
            {createWorkflowMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create Workflow
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateWorkflowForm;