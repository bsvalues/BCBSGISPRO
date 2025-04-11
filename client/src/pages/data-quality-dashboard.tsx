import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileBarChart,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ClipboardCheck,
  BadgeInfo,
  Filter,
  RefreshCw,
  PlusCircle,
  Clock,
  CheckSquare,
} from "lucide-react";

// Types for our data
interface DataQualityRule {
  id: number;
  name: string;
  description: string;
  dimension: string;
  entityType: string;
  validationLogic: string;
  importance: string;
  isActive: boolean;
  parameters: Record<string, any>;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

interface DataQualityMetrics {
  averageScore: number;
  dimensionAverages: Record<string, number>;
  passRate: number;
  entityCount: number;
  lowQualityEntities: number;
  highQualityEntities: number;
}

// Mock data for charts
const dimensionChartData = [
  { name: "Completeness", score: 92, count: 120 },
  { name: "Accuracy", score: 87, count: 95 },
  { name: "Validity", score: 95, count: 142 },
  { name: "Timeliness", score: 78, count: 63 },
  { name: "Uniqueness", score: 98, count: 84 },
];

const entityTypeChartData = [
  { name: "PARCEL", score: 92, count: 320 },
  { name: "ASSESSMENT", score: 85, count: 275 },
  { name: "APPEAL", score: 78, count: 42 },
  { name: "DOCUMENT", score: 88, count: 163 },
];

const trendData = [
  { month: "Jan", score: 75 },
  { month: "Feb", score: 78 },
  { month: "Mar", score: 82 },
  { month: "Apr", score: 85 },
  { month: "May", score: 84 },
  { month: "Jun", score: 88 },
  { month: "Jul", score: 92 },
];

const DIMENSION_COLORS = {
  COMPLETENESS: "#4CAF50", // Green
  ACCURACY: "#2196F3",    // Blue
  VALIDITY: "#9C27B0",    // Purple
  TIMELINESS: "#FF9800",  // Orange
  UNIQUENESS: "#F44336",  // Red
};

const IMPORTANCE_COLORS = {
  HIGH: "#f44336",    // Red
  MEDIUM: "#ff9800",  // Orange
  LOW: "#4caf50",     // Green
};

// Main component
export default function DataQualityDashboardPage() {
  const [selectedEntityType, setSelectedEntityType] = useState<string>("PARCEL");
  const [rules, setRules] = useState<DataQualityRule[]>([]);
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch rules
        const rulesResponse = await fetch("/api/data-quality/rules");
        if (!rulesResponse.ok) {
          throw new Error(`Error fetching rules: ${rulesResponse.statusText}`);
        }
        const rulesData = await rulesResponse.json();
        setRules(rulesData);

        // Fetch metrics
        const metricsResponse = await fetch(
          `/api/data-quality/metrics?entityType=${selectedEntityType}`
        );
        if (!metricsResponse.ok) {
          throw new Error(`Error fetching metrics: ${metricsResponse.statusText}`);
        }
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      } catch (error) {
        console.error("Error fetching data quality data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data quality information. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedEntityType, toast]);

  // Filter rules by selected entity type
  const filteredRules = rules.filter(
    (rule) => rule.entityType === selectedEntityType
  );

  // Helper to get color for dimension
  const getDimensionColor = (dimension: string) => {
    return DIMENSION_COLORS[dimension as keyof typeof DIMENSION_COLORS] || "#777777";
  };
  
  // Helper to get color for importance
  const getImportanceColor = (importance: string) => {
    return IMPORTANCE_COLORS[importance as keyof typeof IMPORTANCE_COLORS] || "#777777";
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Data Quality Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage data quality metrics across Benton County's assessment data
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="md:w-1/4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Entity Type</CardTitle>
              <CardDescription>
                Select entity type to view metrics
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
                  <SelectItem value="DOCUMENT">Documents</SelectItem>
                  <SelectItem value="APPEAL">Appeals</SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-4 space-y-4">
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => {
                    toast({
                      title: "Refreshing metrics...",
                      description: "Fetching the latest data quality metrics",
                    });
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Metrics
                </Button>
                
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Quality Rule
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Quality Summary</CardTitle>
              <CardDescription>
                Overall data quality scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4">Loading metrics...</div>
              ) : metrics ? (
                <>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-sm font-medium">
                        {metrics.averageScore.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metrics.averageScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-primary/5 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground">Pass Rate</div>
                      <div className="text-xl font-bold">
                        {(metrics.passRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground">Entity Count</div>
                      <div className="text-xl font-bold">{metrics.entityCount}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-red-700">Low Quality</div>
                      <div className="text-xl font-bold text-red-700">
                        {metrics.lowQualityEntities}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-700">High Quality</div>
                      <div className="text-xl font-bold text-green-700">
                        {metrics.highQualityEntities}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No metrics available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4 space-y-4">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="rules">Quality Rules</TabsTrigger>
              <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
              <TabsTrigger value="trends">Quality Trends</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Quality by Dimension</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={dimensionChartData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="score" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Distribution of Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={dimensionChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {dimensionChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getDimensionColor(entry.name.toUpperCase())} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Quality Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[70, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#82ca9d"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Critical Quality Issues</CardTitle>
                  <CardDescription>
                    High-priority data quality issues that need attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Issue</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Dimension</TableHead>
                        <TableHead>Affected</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Missing parcel IDs</TableCell>
                        <TableCell>PARCEL</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                            Completeness
                          </Badge>
                        </TableCell>
                        <TableCell>32 records</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Critical</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Invalid assessment dates</TableCell>
                        <TableCell>ASSESSMENT</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            Validity
                          </Badge>
                        </TableCell>
                        <TableCell>17 records</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Critical</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Duplicate property records</TableCell>
                        <TableCell>PARCEL</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                            Uniqueness
                          </Badge>
                        </TableCell>
                        <TableCell>8 records</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">High</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Data Quality Rules</CardTitle>
                    <Button size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Rule
                    </Button>
                  </div>
                  <CardDescription>
                    Rules used to evaluate data quality for {selectedEntityType.toLowerCase()} entities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading rules...</div>
                  ) : filteredRules.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rule Name</TableHead>
                          <TableHead>Dimension</TableHead>
                          <TableHead>Importance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">
                              {rule.name}
                              <div className="text-xs text-muted-foreground">{rule.description}</div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                style={{
                                  backgroundColor: `${getDimensionColor(rule.dimension)}15`,
                                  color: getDimensionColor(rule.dimension),
                                  borderColor: `${getDimensionColor(rule.dimension)}30`
                                }}
                              >
                                {rule.dimension}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                style={{
                                  backgroundColor: getImportanceColor(rule.importance),
                                  color: "white"
                                }}
                              >
                                {rule.importance}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {rule.isActive ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-500">
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  Edit
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700">
                                  {rule.isActive ? "Disable" : "Enable"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No quality rules defined for {selectedEntityType.toLowerCase()} entities.
                      <div className="mt-2">
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create First Rule
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Quality Metrics</CardTitle>
                  <CardDescription>
                    Comprehensive view of quality metrics across dimensions and entity types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Quality by Dimension</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dimension</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Issues</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dimensionChartData.map((item) => (
                            <TableRow key={item.name}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Progress value={item.score} className="h-2 w-24" />
                                  <span>{item.score}%</span>
                                </div>
                              </TableCell>
                              <TableCell>{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Quality by Entity Type</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entity Type</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entityTypeChartData.map((item) => (
                            <TableRow key={item.name}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Progress value={item.score} className="h-2 w-24" />
                                  <span>{item.score}%</span>
                                </div>
                              </TableCell>
                              <TableCell>{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <h3 className="text-lg font-medium mb-2">Recent Evaluations</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity</TableHead>
                        <TableHead>Rule</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Evaluated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Parcel #12-34567</TableCell>
                        <TableCell>Parcel ID Format</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Pass
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <Clock className="inline mr-1 h-3 w-3" />
                          5m ago
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Assessment #A-5431</TableCell>
                        <TableCell>Required Assessment Fields</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Fail
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <Clock className="inline mr-1 h-3 w-3" />
                          12m ago
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Parcel #98-76543</TableCell>
                        <TableCell>Property Value Range</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Warning
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <Clock className="inline mr-1 h-3 w-3" />
                          23m ago
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Score Trends</CardTitle>
                  <CardDescription>
                    Track data quality improvements over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[70, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        name="Overall Quality Score"
                        type="monotone"
                        dataKey="score"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Improvement Initiatives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <CheckSquare className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Data Standardization</h4>
                          <p className="text-sm text-muted-foreground">
                            Standardized parcel ID format across all systems
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Completed June 2024
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start space-x-3">
                        <CheckSquare className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Validation Rules</h4>
                          <p className="text-sm text-muted-foreground">
                            Implemented comprehensive validation rules for property assessments
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Completed July 2024
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start space-x-3">
                        <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Data Deduplication</h4>
                          <p className="text-sm text-muted-foreground">
                            Identify and merge duplicate parcel records
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            In progress (65% complete)
                          </div>
                          <Progress value={65} className="h-1 mt-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Quality Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <FileBarChart className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Most Improved Dimension</h4>
                          <p className="text-sm">
                            <span className="font-semibold">Completeness</span> - Improved by 18% over the last quarter
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Dimension Needing Attention</h4>
                          <p className="text-sm">
                            <span className="font-semibold">Timeliness</span> - 23% of assessment records are outdated
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start space-x-3">
                        <BadgeInfo className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">Data Volume Trend</h4>
                          <p className="text-sm">
                            Property data volume increased by 12% year-over-year
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}