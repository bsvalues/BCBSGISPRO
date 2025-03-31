import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AssistantPanel } from "@/components/chatbot/assistant-panel";
import { 
  Calendar, 
  FileText, 
  Download, 
  Mail, 
  Printer, 
  Loader2, 
  Filter, 
  FileOutput, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Info
} from "lucide-react";

type ReportRow = {
  id: number;
  type: string;
  name: string;
  parcelCount: number;
  status: string;
};

type ReportData = {
  title: string;
  dateRange: string;
  totalParcels: number;
  newParcels: number;
  mergedParcels: number;
  splitParcels: number;
  details: ReportRow[];
};

export default function ReportPage() {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [startDate, setStartDate] = useState<string>(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState<string>(getLastDayOfMonth());
  const [assessmentYear, setAssessmentYear] = useState<string>(new Date().getFullYear().toString());
  const [supplementGroup, setSupplementGroup] = useState<string>("all");
  const [includeNotices, setIncludeNotices] = useState<boolean>(true);
  const [recipientEmails, setRecipientEmails] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Helper functions for date handling
  function getFirstDayOfMonth(): string {
    const date = new Date();
    date.setDate(1);
    return format(date, "yyyy-MM-dd");
  }
  
  function getLastDayOfMonth(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return format(date, "yyyy-MM-dd");
  }
  
  // Generate SM00 report mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reports/sm00", {
        startDate,
        endDate,
        assessmentYear,
        supplementGroup,
        includeNotices
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setReportData(data);
      toast({
        title: "Report Generated",
        description: "SM00 Segregation Report has been successfully generated.",
      });
      setActiveTab("preview");
    },
    onError: (error) => {
      toast({
        title: "Report Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    generateReportMutation.mutate();
  };
  
  const handleEmailReport = () => {
    // In a real implementation, this would send the report to the specified recipients
    toast({
      title: "Report Sent",
      description: `SM00 Report has been emailed to the specified recipients.`,
    });
  };
  
  const handleDownloadReport = () => {
    // In a real implementation, this would download the report as a PDF
    toast({
      title: "Report Downloaded",
      description: "SM00 Report has been downloaded as a PDF.",
    });
  };
  
  const handlePrintReport = () => {
    // In a real implementation, this would print the report
    toast({
      title: "Print Requested",
      description: "SM00 Report has been sent to the printer.",
    });
  };
  
  // Get status color for report rows
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  // Render report preview
  const renderReportPreview = () => {
    if (!reportData) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-neutral-800">{reportData.title}</h3>
          <div className="text-sm text-neutral-500">{reportData.dateRange}</div>
        </div>
        
        {/* Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary-700">{reportData.totalParcels}</p>
              <p className="text-sm text-neutral-600">Total Parcels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-neutral-700">{reportData.newParcels}</p>
              <p className="text-sm text-neutral-600">New Parcels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-neutral-700">{reportData.mergedParcels}</p>
              <p className="text-sm text-neutral-600">Merged Parcels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-neutral-700">{reportData.splitParcels}</p>
              <p className="text-sm text-neutral-600">Split Parcels</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Report Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Report Details</CardTitle>
            <CardDescription>
              Detailed breakdown of all segregation activities during the report period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-sm text-neutral-500 border-b border-neutral-200">
                    <th className="py-2 px-4 text-left">Type</th>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-center">Parcel Count</th>
                    <th className="py-2 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.details.map((detail) => (
                    <tr key={detail.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-2 px-4">{detail.type}</td>
                      <td className="py-2 px-4">{detail.name}</td>
                      <td className="py-2 px-4 text-center">{detail.parcelCount}</td>
                      <td className="py-2 px-4 text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(detail.status)}`}>
                          {detail.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={handlePrintReport} className="flex items-center">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadReport} className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="default" onClick={handleEmailReport} className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeModule="sm00_report" />
        
        <main className="flex-1 overflow-auto bg-neutral-50 p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">SM00 Segregation Report</h1>
            <p className="text-sm text-neutral-500">Generate monthly segregation reports for tracking parcel changes</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>SM00 Report Generator</CardTitle>
                  <CardDescription>
                    Create and distribute monthly segregation reports for tracking parcel changes in Benton County.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="generate">Generate</TabsTrigger>
                      <TabsTrigger value="preview" disabled={!reportData}>Preview</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="generate">
                      <form onSubmit={handleGenerateReport} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                              <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                              <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="assessmentYear">Assessment Year</Label>
                            <Select 
                              value={assessmentYear} 
                              onValueChange={setAssessmentYear}
                            >
                              <SelectTrigger id="assessmentYear">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                                  {new Date().getFullYear() - 1}
                                </SelectItem>
                                <SelectItem value={new Date().getFullYear().toString()}>
                                  {new Date().getFullYear()}
                                </SelectItem>
                                <SelectItem value={(new Date().getFullYear() + 1).toString()}>
                                  {new Date().getFullYear() + 1}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="supplementGroup">Supplement Group</Label>
                            <Select 
                              value={supplementGroup} 
                              onValueChange={setSupplementGroup}
                            >
                              <SelectTrigger id="supplementGroup">
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Groups</SelectItem>
                                <SelectItem value="1">Group 1</SelectItem>
                                <SelectItem value="2">Group 2</SelectItem>
                                <SelectItem value="3">Group 3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox 
                            id="includeNotices" 
                            checked={includeNotices} 
                            onCheckedChange={(checked) => setIncludeNotices(checked as boolean)}
                          />
                          <Label htmlFor="includeNotices" className="text-sm">
                            Include notification status indicators
                          </Label>
                        </div>
                        
                        <div className="space-y-2 pt-4">
                          <Label htmlFor="recipientEmails">Recipient Email Addresses</Label>
                          <Textarea
                            id="recipientEmails"
                            placeholder="Enter email addresses (one per line)"
                            value={recipientEmails}
                            onChange={(e) => setRecipientEmails(e.target.value)}
                            rows={3}
                          />
                          <p className="text-xs text-neutral-500">
                            Leave blank to generate report without sending. Default recipients will be included automatically.
                          </p>
                        </div>
                        
                        <div className="bg-primary-50 p-4 rounded-md border border-primary-100 flex items-start mt-6">
                          <Info className="h-5 w-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="text-sm text-primary-700">
                            <p className="font-medium">Monthly SM00 Report Guidelines</p>
                            <p className="mt-1">The report includes all parcel changes from the selected date range. For standard monthly reports, select the first and last day of the previous month.</p>
                          </div>
                        </div>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="preview">
                      {reportData ? renderReportPreview() : (
                        <div className="py-8 text-center">
                          <p className="text-neutral-500">No report has been generated yet.</p>
                          <Button 
                            variant="link"
                            onClick={() => setActiveTab("generate")}
                          >
                            Go to generator
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
                
                <CardFooter className="flex justify-end border-t pt-6">
                  {activeTab === "generate" && (
                    <Button 
                      type="submit"
                      onClick={handleGenerateReport}
                      disabled={generateReportMutation.isPending}
                    >
                      {generateReportMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate SM00 Report
                        </>
                      )}
                    </Button>
                  )}
                  
                  {activeTab === "preview" && (
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("generate")}
                    >
                      Back to Generator
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Report Status Legend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Status Legend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-neutral-700 font-medium">Completed</span>
                      <span className="text-xs text-neutral-500 ml-auto">All processing finished</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-sm text-neutral-700 font-medium">Pending</span>
                      <span className="text-xs text-neutral-500 ml-auto">Awaiting processing</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-neutral-700 font-medium">In Progress</span>
                      <span className="text-xs text-neutral-500 ml-auto">Currently being processed</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                      <span className="text-sm text-neutral-700 font-medium">Review</span>
                      <span className="text-xs text-neutral-500 ml-auto">Needs manual review</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Reports */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-md border border-neutral-200 hover:border-primary-200 hover:bg-primary-50 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">September 2023</span>
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Sent</span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Generated on Oct 2, 2023</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-md border border-neutral-200 hover:border-primary-200 hover:bg-primary-50 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">August 2023</span>
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Sent</span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Generated on Sep 3, 2023</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-md border border-neutral-200 hover:border-primary-200 hover:bg-primary-50 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">July 2023</span>
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Sent</span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Generated on Aug 2, 2023</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Help Panel */}
              <AssistantPanel title="SM00 Report Help" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
