import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileDown, FileText, FileSpreadsheet, FileJson, File } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// TypeScript types
interface Report {
  id: number;
  name: string;
  templateId: number;
  templateName?: string;
  createdAt: string;
  status: string;
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'html';
}

interface ExportResult {
  downloadUrl: string;
  filename: string;
}

export const ReportExporter = ({ report }: { report: Report }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Export report mutation
  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await apiRequest(`/api/reports/${report.id}/export`, {
        method: 'POST',
        data: options,
      });
      return response as ExportResult;
    },
    onSuccess: (data) => {
      // Open the URL in a new window or download
      window.open(data.downloadUrl, '_blank');
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Export failed',
        description: error.message || 'An error occurred while exporting the report.',
        variant: 'destructive',
      });
    }
  });

  const handleExport = (format: 'pdf' | 'excel' | 'csv' | 'html') => {
    exportMutation.mutateAsync({ format });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Export</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Choose a format to export the report "{report.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors" 
              onClick={() => handleExport('pdf')}
            >
              <CardHeader className="p-4">
                <FileText className="w-8 h-8 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardTitle className="text-md">PDF</CardTitle>
                <CardDescription>Export as PDF document</CardDescription>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors" 
              onClick={() => handleExport('excel')}
            >
              <CardHeader className="p-4">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardTitle className="text-md">Excel</CardTitle>
                <CardDescription>Export as Excel spreadsheet</CardDescription>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors" 
              onClick={() => handleExport('csv')}
            >
              <CardHeader className="p-4">
                <FileDown className="w-8 h-8 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardTitle className="text-md">CSV</CardTitle>
                <CardDescription>Export as CSV file</CardDescription>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors" 
              onClick={() => handleExport('html')}
            >
              <CardHeader className="p-4">
                <File className="w-8 h-8 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardTitle className="text-md">HTML</CardTitle>
                <CardDescription>Export as HTML document</CardDescription>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            {exportMutation.isPending && <div>Exporting...</div>}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};