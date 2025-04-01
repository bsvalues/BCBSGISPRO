import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// Parameter schemas for different report types
const dateRangeSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

// TypeScript types
interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  templateType: string;
  parameterSchema: Record<string, any>;
}

interface ReportParameters {
  startDate?: string;
  endDate?: string;
  workflowId?: number;
  workflowType?: string;
  userId?: number;
  parcelId?: number;
  documentType?: string;
  [key: string]: any;
}

interface GenerateReportParams {
  templateId: number;
  parameters: ReportParameters;
}

export const ReportGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const { toast } = useToast();

  // Fetch report templates
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['/api/reports/templates'],
    queryFn: async () => {
      const response = await apiRequest('/api/reports/templates');
      return response as ReportTemplate[];
    },
  });

  // Define form with Zod schema
  const form = useForm<ReportParameters>({
    resolver: zodResolver(dateRangeSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
    }
  });

  // Reset form when template changes
  useEffect(() => {
    if (selectedTemplate) {
      form.reset({
        startDate: '',
        endDate: '',
      });
    }
  }, [selectedTemplate, form]);

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (params: GenerateReportParams) => {
      const response = await apiRequest('/api/reports', {
        method: 'POST',
        data: params,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: 'Report Generated Successfully',
        description: 'Your report has been created and is ready to view.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Generate Report',
        description: error.message || 'An error occurred while generating the report.',
        variant: 'destructive',
      });
    }
  });

  // Preview report mutation
  const previewReportMutation = useMutation({
    mutationFn: async (params: GenerateReportParams) => {
      const response = await apiRequest('/api/reports/preview', {
        method: 'POST',
        data: params,
      });
      return response;
    },
    onSuccess: (data) => {
      setPreviewData(data);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Preview Report',
        description: error.message || 'An error occurred while previewing the report.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: ReportParameters) => {
    if (!selectedTemplate) {
      toast({
        title: 'No Template Selected',
        description: 'Please select a report template before generating.',
        variant: 'destructive',
      });
      return;
    }

    generateReportMutation.mutateAsync({
      templateId: selectedTemplate.id,
      parameters: data,
    });
  };

  const handlePreview = () => {
    const values = form.getValues();
    if (!form.formState.isValid) {
      form.trigger();
      return;
    }

    if (!selectedTemplate) {
      return;
    }

    previewReportMutation.mutateAsync({
      templateId: selectedTemplate.id,
      parameters: values,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Report</CardTitle>
          <CardDescription>
            Select a report template to begin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Available Templates</h3>
            {loadingTemplates ? (
              <div>Loading templates...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates?.map(template => (
                  <Card 
                    key={template.id} 
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-accent",
                      selectedTemplate?.id === template.id ? "border-primary" : "border"
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedTemplate && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Report Parameters</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Select date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : '')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Select date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : '')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handlePreview}
                        disabled={previewReportMutation.isPending}
                      >
                        Preview Report
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={generateReportMutation.isPending}
                      >
                        Generate Report
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              {selectedTemplate?.name} - {form.getValues().startDate} to {form.getValues().endDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {previewData.summaries?.map((summary: any, index: number) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">{summary.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{summary.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {previewData.rows && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        {previewData.headers.map((header: any, index: number) => (
                          <th key={index} className="px-4 py-2 text-left">{header.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.slice(0, 5).map((row: any, rowIndex: number) => (
                        <tr key={rowIndex} className="border-b">
                          {previewData.headers.map((header: any, colIndex: number) => (
                            <td key={colIndex} className="px-4 py-2">{row[header.id]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.rows.length > 5 && (
                    <div className="text-center mt-2 text-muted-foreground">
                      Showing 5 of {previewData.rows.length} rows in preview
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={onSubmit.bind(null, form.getValues())} 
              disabled={generateReportMutation.isPending}
            >
              Generate Full Report
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};