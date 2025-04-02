import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { IllustratedTooltip } from '@/components/ui/illustrated-tooltip';
import { illustrations } from '@/lib/illustrations';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Download,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface Report {
  id: number;
  name: string;
  templateId: number;
  templateName: string;
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  generatedBy: string;
  totalRows?: number;
}

interface FilterOptions {
  startDate?: string;
  endDate?: string;
  status?: string;
  templateId?: number;
}

export const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [detailsReport, setDetailsReport] = useState<Report | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Fetch reports
  const { data: reports, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/reports', filterOptions],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filterOptions.startDate) queryParams.append('startDate', filterOptions.startDate);
      if (filterOptions.endDate) queryParams.append('endDate', filterOptions.endDate);
      if (filterOptions.status) queryParams.append('status', filterOptions.status);
      if (filterOptions.templateId) queryParams.append('templateId', filterOptions.templateId.toString());
      
      const response = await fetch(`/api/reports?${queryParams}`);
      return await response.json();
    },
  });
  
  // Fetch report templates for filter dropdown
  const { data: templates } = useQuery({
    queryKey: ['/api/reports/templates'],
    queryFn: async () => {
      const response = await fetch('/api/reports/templates');
      return await response.json();
    },
  });
  
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Reports refreshed",
      description: "The reports list has been updated."
    });
  };
  
  const applyFilters = (newFilters: FilterOptions) => {
    setFilterOptions(prev => ({ ...prev, ...newFilters }));
    setShowFilters(false);
  };
  
  const resetFilters = () => {
    setFilterOptions({});
    setShowFilters(false);
  };
  
  const handleViewDetails = (report: Report) => {
    setDetailsReport(report);
    setShowDetailsDialog(true);
  };
  
  // Status badge rendering is now handled directly in the table
  
  // Filter reports by search query
  const filteredReports = searchQuery.length > 0 && reports
    ? reports.filter((report: Report) => 
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.templateName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;
    
  // Filter by tab selection
  const displayedReports = activeTab === 'recent' && filteredReports 
    ? filteredReports.slice(0, 10)  // Show only 10 most recent
    : filteredReports;
    
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">View, generate, and manage your reports</p>
          </div>
          <IllustratedTooltip
            illustration={illustrations.report.general}
            title="Reports Dashboard Help"
            content={
              <div>
                <p className="mb-1">• Filter reports by date range, status, and template</p>
                <p className="mb-1">• View detailed report information and download options</p>
                <p className="mb-1">• Generate new reports from available templates</p>
                <p>• Set up scheduled reports for automation</p>
              </div>
            }
            position="right"
            iconSize={18}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>
      
      {/* Filters dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filter Reports</DialogTitle>
            <DialogDescription>
              Select criteria to filter the reports list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filterOptions.startDate || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setFilterOptions(prev => ({ ...prev, startDate: e.target.value }));
                  } else {
                    const { startDate, ...rest } = filterOptions;
                    setFilterOptions(rest);
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filterOptions.endDate || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setFilterOptions(prev => ({ ...prev, endDate: e.target.value }));
                  } else {
                    const { endDate, ...rest } = filterOptions;
                    setFilterOptions(rest);
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filterOptions.status || ''}
                onValueChange={(value) => {
                  if (value) {
                    setFilterOptions(prev => ({ ...prev, status: value }));
                  } else {
                    const { status, ...rest } = filterOptions;
                    setFilterOptions(rest);
                  }
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template">Report Template</Label>
              <Select 
                value={filterOptions.templateId?.toString() || ''}
                onValueChange={(value) => {
                  if (value) {
                    setFilterOptions(prev => ({ ...prev, templateId: parseInt(value) }));
                  } else {
                    const { templateId, ...rest } = filterOptions;
                    setFilterOptions(rest);
                  }
                }}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="All templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All templates</SelectItem>
                  {templates && templates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>Reset</Button>
            <Button onClick={() => applyFilters(filterOptions)}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report details dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected report.
            </DialogDescription>
          </DialogHeader>
          {detailsReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Report Name</p>
                  <p className="text-sm">{detailsReport.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Template</p>
                  <p className="text-sm">{detailsReport.templateName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="text-sm">{format(parseISO(detailsReport.createdAt), 'PPP p')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {(() => {
                      switch(detailsReport.status) {
                        case 'pending':
                          return <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-300">
                            <Clock size={14} /> Pending
                          </Badge>;
                        case 'processing':
                          return <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-300">
                            <Loader2 size={14} className="animate-spin" /> Processing
                          </Badge>;
                        case 'completed':
                          return <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-300">
                            <CheckCircle2 size={14} /> Completed
                          </Badge>;
                        case 'failed':
                          return <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-300">
                            <XCircle size={14} /> Failed
                          </Badge>;
                        default:
                          return <Badge variant="outline">{detailsReport.status}</Badge>;
                      }
                    })()}
                  </div>
                </div>
                {detailsReport.completedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                    <p className="text-sm">{format(parseISO(detailsReport.completedAt), 'PPP p')}</p>
                  </div>
                )}
                {detailsReport.totalRows !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Rows</p>
                    <p className="text-sm">{detailsReport.totalRows.toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {detailsReport.error && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{detailsReport.error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {detailsReport.status === 'completed' && (
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button className="sm:flex-1" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                  <Button className="sm:flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <Tabs defaultValue="recent" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
          <TabsTrigger value="all">All Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="mt-6">
          <ReportsTable 
            reports={displayedReports} 
            isLoading={isLoading} 
            isError={isError} 
            onViewDetails={handleViewDetails} 
          />
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          <ReportsTable 
            reports={displayedReports}
            isLoading={isLoading} 
            isError={isError} 
            onViewDetails={handleViewDetails} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ReportsTableProps {
  reports: any[];
  isLoading: boolean;
  isError: boolean;
  onViewDetails: (report: Report) => void;
}

const ReportsTable = ({ reports, isLoading, isError, onViewDetails }: ReportsTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-700 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Error loading reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">There was a problem loading the reports. Please try again or contact support if the issue persists.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>No reports found</CardTitle>
          <CardDescription>
            {reports ? "There are no reports matching your criteria." : "No reports have been generated yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Generate a new report to get started.</p>
          <Button className="mt-4">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Table>
      <TableCaption>List of reports</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Report Name</TableHead>
          <TableHead>Template</TableHead>
          <TableHead>Generated</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report: Report) => {
          const reportDate = parseISO(report.createdAt);
          
          return (
            <TableRow key={report.id}>
              <TableCell className="font-medium">{report.name}</TableCell>
              <TableCell>{report.templateName}</TableCell>
              <TableCell>{format(reportDate, 'MMM d, yyyy')}</TableCell>
              <TableCell>
                {(() => {
                  switch(report.status) {
                    case 'pending':
                      return <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-300">
                        <Clock size={14} /> Pending
                      </Badge>;
                    case 'processing':
                      return <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-300">
                        <Loader2 size={14} className="animate-spin" /> Processing
                      </Badge>;
                    case 'completed':
                      return <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-300">
                        <CheckCircle2 size={14} /> Completed
                      </Badge>;
                    case 'failed':
                      return <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-300">
                        <XCircle size={14} /> Failed
                      </Badge>;
                    default:
                      return <Badge variant="outline">{report.status}</Badge>;
                  }
                })()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(report)}
                >
                  Details
                </Button>
                {report.status === 'completed' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => {
                        window.open(`/api/reports/${report.id}/view`, '_blank');
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => {
                        // Handle export click
                      }}
                    >
                      Export
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};