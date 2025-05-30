import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
  Calendar,
  UserCircle,
  RefreshCw,
  Filter,
  PlusCircle,
  Eye,
  Clock,
  CircleCheck,
  ChevronsDown,
  ChevronsUp,
  AlertCircle,
} from "lucide-react";

// Types for our data
interface RcwRequirement {
  id: number;
  rcwCode: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  applicableEntityTypes: string[];
  validationLogic: string;
  remediation: string | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ComplianceStats {
  total: number;
  compliant: number;
  nonCompliant: number;
  needsReview: number;
  exempt: number;
  notApplicable: number;
  complianceRate: number;
  criticalIssues: number;
  highIssues: number;
  entityCount: number;
}

// Colors for categories and statuses
const CATEGORY_COLORS = {
  VALUATION_STANDARDS: "#2196F3",     // Blue
  PHYSICAL_INSPECTION: "#4CAF50",     // Green
  APPEALS_PROCESS: "#9C27B0",         // Purple
  PUBLIC_DISCLOSURE: "#FF9800",       // Orange
  EXEMPTIONS: "#F44336",              // Red
  SPECIAL_VALUATION: "#607D8B",       // Blue Gray
};

const STATUS_COLORS = {
  COMPLIANT: "#4CAF50",         // Green
  NON_COMPLIANT: "#F44336",     // Red
  NEEDS_REVIEW: "#FF9800",      // Orange
  EXEMPT: "#9E9E9E",            // Gray
  NOT_APPLICABLE: "#607D8B",    // Blue Gray
};

const SEVERITY_COLORS = {
  CRITICAL: "#F44336",    // Red
  HIGH: "#FF9800",        // Orange
  MEDIUM: "#FFEB3B",      // Yellow
  LOW: "#4CAF50",         // Green
};

// Sample data for visualization
const complianceByCategoryData = [
  { name: "Valuation Standards", compliant: 18, nonCompliant: 2, needsReview: 3 },
  { name: "Physical Inspection", compliant: 12, nonCompliant: 4, needsReview: 1 },
  { name: "Appeals Process", compliant: 8, nonCompliant: 1, needsReview: 0 },
  { name: "Public Disclosure", compliant: 10, nonCompliant: 0, needsReview: 2 },
  { name: "Exemptions", compliant: 6, nonCompliant: 2, needsReview: 1 },
];

const statusDistributionData = [
  { name: "Compliant", value: 54, color: "#4CAF50" },
  { name: "Non-Compliant", value: 9, color: "#F44336" },
  { name: "Needs Review", value: 7, color: "#FF9800" },
  { name: "Exempt", value: 12, color: "#9E9E9E" },
  { name: "Not Applicable", value: 18, color: "#607D8B" },
];

// Main component
export default function ComplianceDashboardPage() {
  const [selectedEntityType, setSelectedEntityType] = useState<string>("ASSESSMENT");
  const [requirements, setRequirements] = useState<RcwRequirement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch RCW requirements
        const requirementsResponse = await fetch("/api/compliance/requirements");
        if (!requirementsResponse.ok) {
          throw new Error(`Error fetching requirements: ${requirementsResponse.statusText}`);
        }
        const requirementsData = await requirementsResponse.json();
        setRequirements(requirementsData);

        // Fetch compliance stats
        const statsResponse = await fetch(
          `/api/compliance/stats?entityType=${selectedEntityType}`
        );
        if (!statsResponse.ok) {
          throw new Error(`Error fetching stats: ${statsResponse.statusText}`);
        }
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching compliance data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load compliance information. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedEntityType, toast]);

  // Filter requirements by selected entity type and optionally by category
  const filteredRequirements = requirements.filter((req) => {
    const matchesEntityType = req.applicableEntityTypes.includes(selectedEntityType);
    const matchesCategory = selectedCategory ? req.category === selectedCategory : true;
    return matchesEntityType && matchesCategory;
  });

  // Helper to get color for category
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#777777";
  };
  
  // Helper to get color for severity
  const getSeverityColor = (severity: string) => {
    return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || "#777777";
  };

  // Helper to get proper label for category
  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Get unique categories for the filter
  const categories = Array.from(new Set(requirements.map(req => req.category)));

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">RCW Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage Washington regulatory compliance for Benton County Assessor's Office
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="md:w-1/4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Entity Type</CardTitle>
              <CardDescription>
                Select entity type to view compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedEntityType}
                onValueChange={setSelectedEntityType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARCEL">Parcels</SelectItem>
                  <SelectItem value="ASSESSMENT">Assessments</SelectItem>
                  <SelectItem value="APPEAL">Appeals</SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-4 space-y-2">
                <CardTitle className="text-sm font-medium">Filter by Category</CardTitle>
                <div className="flex flex-col space-y-1">
                  <Button 
                    variant={selectedCategory === null ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="justify-start"
                  >
                    All Categories
                  </Button>
                  {categories.map(category => (
                    <Button 
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="justify-start"
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      ></div>
                      {getCategoryLabel(category)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => {
                    toast({
                      title: "Refreshing compliance data...",
                      description: "Fetching the latest compliance status",
                    });
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
                
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Compliance Check
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Compliance Summary</CardTitle>
              <CardDescription>
                Overall compliance status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4">Loading stats...</div>
              ) : stats ? (
                <>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Compliance Rate</span>
                      <span className="text-sm font-medium">
                        {(stats.complianceRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={stats.complianceRate * 100} 
                      className="h-2"
                      color={stats.complianceRate > 0.8 ? "bg-green-600" : stats.complianceRate > 0.6 ? "bg-yellow-500" : "bg-red-500"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-700">Compliant</div>
                      <div className="text-xl font-bold text-green-700">
                        {stats.compliant}
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-red-700">Non-Compliant</div>
                      <div className="text-xl font-bold text-red-700">
                        {stats.nonCompliant}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-xs text-yellow-700">Review</div>
                      <div className="text-xl font-bold text-yellow-700">
                        {stats.needsReview}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-700">Exempt</div>
                      <div className="text-xl font-bold text-gray-700">
                        {stats.exempt}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-blue-700">N/A</div>
                      <div className="text-xl font-bold text-blue-700">
                        {stats.notApplicable}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No compliance stats available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Critical Issues</CardTitle>
              <CardDescription>
                High-severity non-compliance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading issues...</div>
              ) : stats && stats.criticalIssues > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium">Critical Issues</span>
                    </div>
                    <Badge variant="destructive">{stats.criticalIssues}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium">High Severity</span>
                    </div>
                    <Badge 
                      className="bg-yellow-500 hover:bg-yellow-600"
                    >
                      {stats.highIssues}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <Button variant="destructive" className="w-full">
                    View Critical Issues
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 flex flex-col items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <span className="text-sm text-muted-foreground">No critical issues found</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4 space-y-4">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">RCW Requirements</TabsTrigger>
              <TabsTrigger value="checks">Compliance Checks</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Compliance by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={complianceByCategoryData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar 
                          dataKey="compliant" 
                          name="Compliant" 
                          stackId="a" 
                          fill="#4CAF50" 
                        />
                        <Bar 
                          dataKey="nonCompliant" 
                          name="Non-Compliant" 
                          stackId="a" 
                          fill="#F44336" 
                        />
                        <Bar 
                          dataKey="needsReview" 
                          name="Needs Review" 
                          stackId="a" 
                          fill="#FF9800" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value, name) => [`${value} (${((value as number) / 100 * 100).toFixed(1)}%)`, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Compliance Activity</CardTitle>
                  <CardDescription>
                    Latest compliance checks and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          RCW 84.40.020 - Annual Assessment
                          <div className="text-xs text-muted-foreground">Valuation Standards</div>
                        </TableCell>
                        <TableCell>Assessment #A-5783</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Compliant
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">Today, 2:34 PM</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center">
                            <UserCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                            J. Smith
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          RCW 84.41.030 - Physical Inspection
                          <div className="text-xs text-muted-foreground">Physical Inspection</div>
                        </TableCell>
                        <TableCell>Parcel #12-45678</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Non-Compliant
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">Today, 11:15 AM</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center">
                            <UserCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                            M. Johnson
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          RCW 84.48.010 - Board of Equalization
                          <div className="text-xs text-muted-foreground">Appeals Process</div>
                        </TableCell>
                        <TableCell>Appeal #AP-2023-42</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <HelpCircle className="mr-1 h-3 w-3" />
                            Needs Review
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">Yesterday, 4:22 PM</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center">
                            <UserCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                            A. Williams
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Compliance Deadlines</CardTitle>
                  <CardDescription>
                    Regulatory requirements with approaching deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Property Inspections Due</h4>
                        <p className="text-sm text-muted-foreground">
                          Physical inspection cycle deadline for Northern District parcels
                        </p>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="bg-red-50 text-red-700 mr-2">
                            7 days remaining
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            14 properties pending
                          </span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Annual Valuation Reports</h4>
                        <p className="text-sm text-muted-foreground">
                          Complete annual valuation reports for commercial properties
                        </p>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 mr-2">
                            14 days remaining
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            36 reports pending
                          </span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Board of Equalization Hearings</h4>
                        <p className="text-sm text-muted-foreground">
                          Schedule remaining appeal hearings for current year
                        </p>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 mr-2">
                            30 days remaining
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            8 appeals pending
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requirements Tab */}
            <TabsContent value="requirements" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>RCW Requirements</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            RCW Reference
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Washington State RCW documentation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardDescription>
                    Applicable Washington RCW requirements for {selectedEntityType.toLowerCase()}
                    {selectedCategory && ` in ${getCategoryLabel(selectedCategory)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading requirements...</div>
                  ) : filteredRequirements.length > 0 ? (
                    <div className="space-y-6">
                      {filteredRequirements.map((req) => (
                        <div key={req.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold flex items-center">
                                <span 
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: getCategoryColor(req.category) }}
                                ></span>
                                {req.title}
                              </h3>
                              <div className="text-sm text-muted-foreground">{req.rcwCode}</div>
                            </div>
                            <Badge 
                              style={{
                                backgroundColor: getSeverityColor(req.severity),
                                color: req.severity === 'LOW' ? '#333' : 'white'
                              }}
                            >
                              {req.severity}
                            </Badge>
                          </div>
                          <p className="text-sm">{req.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {req.applicableEntityTypes.map((type) => (
                              <Badge key={type} variant="outline">
                                {type}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium mt-2">Validation Logic:</div>
                            <div className="text-muted-foreground">{req.validationLogic}</div>
                          </div>
                          {req.remediation && (
                            <div className="text-sm">
                              <div className="font-medium mt-2">Remediation:</div>
                              <div className="text-muted-foreground">{req.remediation}</div>
                            </div>
                          )}
                          <div className="flex justify-end space-x-2 pt-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{req.title}</DialogTitle>
                                  <DialogDescription>{req.rcwCode}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <h4 className="font-medium mb-1">Description</h4>
                                    <p>{req.description}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-1">Category</h4>
                                    <Badge 
                                      variant="outline" 
                                      style={{
                                        backgroundColor: `${getCategoryColor(req.category)}15`,
                                        color: getCategoryColor(req.category),
                                        borderColor: `${getCategoryColor(req.category)}30`
                                      }}
                                    >
                                      {getCategoryLabel(req.category)}
                                    </Badge>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-1">Severity</h4>
                                    <Badge 
                                      style={{
                                        backgroundColor: getSeverityColor(req.severity),
                                        color: req.severity === 'LOW' ? '#333' : 'white'
                                      }}
                                    >
                                      {req.severity}
                                    </Badge>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-1">Applicable To</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {req.applicableEntityTypes.map((type) => (
                                        <Badge key={type} variant="outline">
                                          {type}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-1">Validation Logic</h4>
                                    <p className="text-sm">{req.validationLogic}</p>
                                  </div>
                                  {req.remediation && (
                                    <div>
                                      <h4 className="font-medium mb-1">Remediation</h4>
                                      <p className="text-sm">{req.remediation}</p>
                                    </div>
                                  )}
                                  {req.reference && (
                                    <div>
                                      <h4 className="font-medium mb-1">External Reference</h4>
                                      <a 
                                        href={req.reference} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-sm"
                                      >
                                        {req.reference}
                                      </a>
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline">
                                    Start Compliance Check
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button variant="default" size="sm">
                              Start Check
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No requirements found for the selected filters.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Checks Tab */}
            <TabsContent value="checks" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Compliance Checks</CardTitle>
                    <Button size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Check
                    </Button>
                  </div>
                  <CardDescription>
                    Recent and scheduled compliance checks for {selectedEntityType.toLowerCase()} entities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="recent">
                    <TabsList className="mb-4">
                      <TabsTrigger value="recent">Recent Checks</TabsTrigger>
                      <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                      <TabsTrigger value="critical">Critical Issues</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="recent">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Requirement</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Performed</TableHead>
                            <TableHead>Next Due</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              RCW 84.40.020
                              <div className="text-xs text-muted-foreground">Annual Assessment</div>
                            </TableCell>
                            <TableCell>Assessment #A-12345</TableCell>
                            <TableCell>
                              <Badge className="bg-green-500 hover:bg-green-600">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Compliant
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                1 day ago
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">Jan 1, 2026</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              RCW 84.41.030
                              <div className="text-xs text-muted-foreground">Physical Inspection</div>
                            </TableCell>
                            <TableCell>Parcel #98-7654</TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Non-Compliant
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                3 days ago
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-red-500">Overdue</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="bg-red-50 text-red-500 hover:bg-red-100">
                                  Fix
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              RCW 84.48.010
                              <div className="text-xs text-muted-foreground">Board of Equalization</div>
                            </TableCell>
                            <TableCell>Appeal #AP-2023-42</TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                <HelpCircle className="mr-1 h-3 w-3" />
                                Needs Review
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                2 days ago
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">Nov 15, 2025</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="bg-yellow-50 text-yellow-500 hover:bg-yellow-100">
                                  Review
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    <TabsContent value="scheduled">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Requirement</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              RCW 84.41.030
                              <div className="text-xs text-muted-foreground">Physical Inspection</div>
                            </TableCell>
                            <TableCell>Parcel #56-7890</TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                                Oct 15, 2025
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <UserCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                                J. Smith
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm">
                                  Start
                                </Button>
                                <Button variant="outline" size="sm" className="text-muted-foreground">
                                  Reschedule
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              RCW 84.40.020
                              <div className="text-xs text-muted-foreground">Annual Assessment</div>
                            </TableCell>
                            <TableCell>Assessment #A-5432</TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                                Nov 1, 2025
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <UserCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                                M. Johnson
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm">
                                  Start
                                </Button>
                                <Button variant="outline" size="sm" className="text-muted-foreground">
                                  Reschedule
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    <TabsContent value="critical">
                      <div className="space-y-4">
                        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <ChevronsUp className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                              <div>
                                <h3 className="font-medium text-red-800">Physical Inspection Overdue</h3>
                                <p className="text-sm text-red-700">
                                  RCW 84.41.030 requires physical inspection once every 6 years, 
                                  but 7 properties have not been inspected for over 6 years.
                                </p>
                                <div className="mt-2 text-xs text-red-600">
                                  Latest check: 2 days ago • Severity: CRITICAL
                                </div>
                              </div>
                            </div>
                            <Badge variant="destructive">
                              Overdue
                            </Badge>
                          </div>
                          <div className="mt-4 flex space-x-2 justify-end">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button variant="destructive" size="sm">
                              Remediate
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <ChevronsDown className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                              <div>
                                <h3 className="font-medium text-yellow-800">Annual Assessment Incomplete</h3>
                                <p className="text-sm text-yellow-700">
                                  RCW 84.40.020 requires all property values to be assessed annually, 
                                  but 12 assessments are incomplete or missing.
                                </p>
                                <div className="mt-2 text-xs text-yellow-600">
                                  Latest check: 1 day ago • Severity: HIGH
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-yellow-500 hover:bg-yellow-600">
                              At Risk
                            </Badge>
                          </div>
                          <div className="mt-4 flex space-x-2 justify-end">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button className="bg-yellow-500 hover:bg-yellow-600" size="sm">
                              Remediate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    Showing recent compliance checks. Use filters for more specific results.
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Audit History</CardTitle>
                  <CardDescription>
                    Track compliance status changes over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Check ID</TableHead>
                        <TableHead>Old Status</TableHead>
                        <TableHead>New Status</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-sm">April 10, 2025 15:23</TableCell>
                        <TableCell className="font-medium">CHK-2025-123</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            Needs Review
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 hover:bg-green-600">
                            Compliant
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">J. Smith</TableCell>
                        <TableCell className="text-sm">
                          Reviewed documentation and confirmed compliance with standards.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm">April 9, 2025 09:47</TableCell>
                        <TableCell className="font-medium">CHK-2025-118</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            Non-Compliant
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 hover:bg-green-600">
                            Compliant
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">M. Johnson</TableCell>
                        <TableCell className="text-sm">
                          Physical inspection completed. Property now meets all requirements.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm">April 8, 2025 14:32</TableCell>
                        <TableCell className="font-medium">CHK-2025-112</TableCell>
                        <TableCell>
                          <Badge className="bg-gray-500 hover:bg-gray-600">
                            Not Checked
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            Non-Compliant
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">S. Davis</TableCell>
                        <TableCell className="text-sm">
                          Initial check found missing required documentation. Needs remediation.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}