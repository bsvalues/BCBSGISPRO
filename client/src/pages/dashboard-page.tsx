import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ModernLayout from '../components/layout/modern-layout';
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
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { 
  BarChart, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileCheck, 
  FilePlus, 
  FileSpreadsheet, 
  FileText, 
  Gauge, 
  LineChart, 
  MapPin, 
  Plus, 
  RefreshCw, 
  Settings, 
  User, 
  UserPlus 
} from 'lucide-react';
import { Link } from 'wouter';

// Chart components (mock for now)
const WorkflowsByTypeChart = () => (
  <div className="h-64 w-full flex items-center justify-center bg-muted/20 rounded-md">
    <div className="text-center">
      <BarChart className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
      <p className="text-sm text-muted-foreground">Workflow distribution chart</p>
    </div>
  </div>
);

const ActivityChart = () => (
  <div className="h-64 w-full flex items-center justify-center bg-muted/20 rounded-md">
    <div className="text-center">
      <LineChart className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
      <p className="text-sm text-muted-foreground">Activity timeline</p>
    </div>
  </div>
);

// Mock data for the dashboard
const recentWorkflows = [
  {
    id: 1,
    title: 'Johnson Property Division',
    type: 'Long Plat',
    status: 'in_progress',
    progress: 65,
    updatedAt: '2 hours ago',
    owner: 'Sarah Thompson'
  },
  {
    id: 2,
    title: 'Westside Commercial Merger',
    type: 'Merge/Split',
    status: 'review',
    progress: 85,
    updatedAt: '1 day ago',
    owner: 'Michael Rodriguez'
  },
  {
    id: 3,
    title: 'Riverfront Properties BLA',
    type: 'BLA',
    status: 'draft',
    progress: 25,
    updatedAt: '3 days ago',
    owner: 'Emily Watson'
  }
];

const recentDocuments = [
  {
    id: 1,
    title: 'Johnson Property Deed',
    type: 'Deed',
    uploadedAt: '1 hour ago',
    workflowId: 1,
    size: '2.4 MB'
  },
  {
    id: 2,
    title: 'Plat Survey Map - Westside',
    type: 'Plat Map',
    uploadedAt: '2 days ago',
    workflowId: 2,
    size: '6.8 MB'
  },
  {
    id: 3,
    title: 'BLA Application Form',
    type: 'Application',
    uploadedAt: '3 days ago',
    workflowId: 3,
    size: '1.2 MB'
  }
];

const insights = [
  {
    id: 1,
    title: 'Workflows needing review',
    value: 5,
    change: 1,
    trend: 'up'
  },
  {
    id: 2,
    title: 'Documents processed this month',
    value: 87,
    change: 12,
    trend: 'up'
  },
  {
    id: 3,
    title: 'Avg. workflow completion time',
    value: '8.2 days',
    change: -0.5,
    trend: 'down'
  },
  {
    id: 4,
    title: 'Data quality score',
    value: '94%',
    change: 2,
    trend: 'up'
  }
];

// Quick actions the user can take
const quickActions = [
  {
    id: 1,
    title: 'New Workflow',
    icon: <FilePlus className="h-5 w-5" />,
    href: '/workflows',
    description: 'Start a new assessment workflow'
  },
  {
    id: 2,
    title: 'Upload Document',
    icon: <FileText className="h-5 w-5" />,
    href: '/documents',
    description: 'Upload and classify a document'
  },
  {
    id: 3,
    title: 'View Map',
    icon: <MapPin className="h-5 w-5" />,
    href: '/benton-map',
    description: 'Open Benton County map'
  },
  {
    id: 4,
    title: 'Run Report',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    href: '#',
    description: 'Generate a custom report'
  }
];

// Tasks assigned to the user
const assignedTasks = [
  {
    id: 1,
    title: 'Review BLA Application',
    workflowId: 3,
    dueDate: '2025-05-25',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Approve Plat Maps',
    workflowId: 1,
    dueDate: '2025-05-30',
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Update Property Records',
    workflowId: 2,
    dueDate: '2025-06-05',
    priority: 'low'
  }
];

// System status metrics
const systemStatus = [
  {
    id: 1,
    name: 'Database',
    status: 'healthy',
    uptime: '99.98%',
    lastChecked: '5 min ago'
  },
  {
    id: 2,
    name: 'Document Storage',
    status: 'healthy',
    uptime: '99.95%',
    lastChecked: '5 min ago'
  },
  {
    id: 3,
    name: 'Map Services',
    status: 'healthy',
    uptime: '99.9%',
    lastChecked: '5 min ago'
  },
  {
    id: 4,
    name: 'API Services',
    status: 'warning',
    uptime: '98.7%',
    lastChecked: '5 min ago',
    message: 'Experiencing slight delays'
  }
];

const DashboardPage: React.FC = () => {
  // Fetch dashboard data
  const { data: dashboardData, isLoading, isError } = useQuery({ 
    queryKey: ['dashboard'],
    queryFn: async () => {
      // This would be a real API call in production
      return new Promise(resolve => {
        setTimeout(() => resolve({
          workflows: recentWorkflows,
          documents: recentDocuments,
          insights,
          tasks: assignedTasks,
          systemStatus
        }), 500);
      });
    },
    enabled: false // Disabled for now since we're using mock data
  });

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'review':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Review</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function to render system status badge
  const renderSystemStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Helper function to render priority indicator
  const renderPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
            High
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Low
          </span>
        );
      default:
        return <span>{priority}</span>;
    }
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the TerraFusion Platform - Benton County GIS Workflow Solution
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.id} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="py-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      {action.icon}
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold">{insight.value}</div>
                  <div className={`text-xs font-medium ${
                    insight.trend === 'up' 
                      ? 'text-green-600' 
                      : insight.trend === 'down' 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                  }`}>
                    {insight.change > 0 ? '+' : ''}{insight.change} {insight.trend === 'up' ? '↑' : '↓'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflows">My Workflows</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="system">System Status</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Workflows</CardTitle>
                      <Link href="/workflows">
                        <Button variant="ghost" size="sm">View All</Button>
                      </Link>
                    </div>
                    <CardDescription>Recently updated workflows</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentWorkflows.map((workflow) => (
                        <div key={workflow.id} className="flex items-start space-x-4">
                          <div className="p-2 rounded-md bg-primary/10 text-primary">
                            <FileCheck className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <Link href={`/workflow/${workflow.id}`}>
                                <p className="font-medium text-sm hover:underline text-primary">
                                  {workflow.title}
                                </p>
                              </Link>
                              {renderStatusBadge(workflow.status)}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{workflow.type}</span>
                              <span>Updated {workflow.updatedAt}</span>
                            </div>
                            <div className="pt-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span>{workflow.progress}% Complete</span>
                              </div>
                              <Progress value={workflow.progress} className="h-1.5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 pb-2">
                    <Button className="w-full">
                      <Link href="/workflows" className="flex items-center justify-center w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        New Workflow
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Feed</CardTitle>
                    <CardDescription>Recent changes and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 relative">
                      <div className="absolute top-0 bottom-0 left-[11px] w-[1px] bg-border"></div>
                      
                      <div className="flex gap-3">
                        <div className="relative w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center z-10">
                          <FileCheck className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm leading-tight">
                            <span className="font-medium">Sarah Thompson</span>
                            <span className="text-muted-foreground"> marked </span>
                            <span className="text-primary font-medium">Legal Description</span>
                            <span className="text-muted-foreground"> as complete for </span>
                            <Link href="/workflow/1" className="text-primary hover:underline">Johnson Property Division</Link>
                          </p>
                          <p className="text-xs text-muted-foreground">10 minutes ago</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="relative w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center z-10">
                          <FileText className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm leading-tight">
                            <span className="font-medium">Michael Rodriguez</span>
                            <span className="text-muted-foreground"> uploaded a new document to </span>
                            <Link href="/workflow/2" className="text-primary hover:underline">Westside Commercial Merger</Link>
                          </p>
                          <p className="text-xs text-muted-foreground">1 hour ago</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="relative w-6 h-6 rounded-full bg-green-100 flex items-center justify-center z-10">
                          <MapPin className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm leading-tight">
                            <span className="font-medium">David Chen</span>
                            <span className="text-muted-foreground"> updated map features for </span>
                            <Link href="/workflow/4" className="text-primary hover:underline">Mountain View Estates</Link>
                          </p>
                          <p className="text-xs text-muted-foreground">3 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="relative w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center z-10">
                          <Workflow className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm leading-tight">
                            <span className="font-medium">Emily Watson</span>
                            <span className="text-muted-foreground"> created a new workflow </span>
                            <Link href="/workflow/3" className="text-primary hover:underline">Riverfront Properties BLA</Link>
                          </p>
                          <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Documents */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Documents</CardTitle>
                    <Link href="/documents">
                      <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                  </div>
                  <CardDescription>Recently uploaded documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentDocuments.map((document) => (
                      <div key={document.id} className="flex items-start space-x-4">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <Link href={`/document/${document.id}`}>
                              <p className="font-medium text-sm hover:underline text-primary">
                                {document.title}
                              </p>
                            </Link>
                            <Badge variant="outline">{document.type}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <Link href={`/workflow/${document.workflowId}`}>
                              <span className="hover:underline">Workflow #{document.workflowId}</span>
                            </Link>
                            <span>Uploaded {document.uploadedAt}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                            <span>{document.size}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 pb-2">
                  <Button asChild className="w-full">
                    <Link href="/documents">
                      <FilePlus className="h-4 w-4 mr-2" />
                      Upload Document
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflows by Type</CardTitle>
                  <CardDescription>Distribution of workflows by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <WorkflowsByTypeChart />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>Workflow activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Workflows Tab */}
          <TabsContent value="workflows" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Active Workflows</CardTitle>
                  <Link href="/workflows">
                    <Button size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentWorkflows.map((workflow) => (
                    <div key={workflow.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <FileCheck className="h-5 w-5 mr-2 text-muted-foreground" />
                            <Link href={`/workflow/${workflow.id}`}>
                              <h3 className="font-medium hover:underline text-primary">
                                {workflow.title}
                              </h3>
                            </Link>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-muted-foreground">{workflow.type}</span>
                            <span className="mx-2 text-muted-foreground">•</span>
                            {renderStatusBadge(workflow.status)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Progress</p>
                          <div className="pt-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{workflow.progress}% Complete</span>
                            </div>
                            <Progress value={workflow.progress} className="h-2" />
                          </div>
                        </div>
                        <div className="space-y-1 flex items-center justify-between md:justify-end">
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center mb-1">
                              <Clock className="h-4 w-4 mr-1" />
                              Updated {workflow.updatedAt}
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {workflow.owner}
                            </div>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/workflow/${workflow.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t flex justify-between">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button asChild>
                  <Link href="/workflows">
                    <Plus className="h-4 w-4 mr-2" />
                    New Workflow
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Tasks</CardTitle>
                <CardDescription>Tasks requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-medium">{task.title}</h3>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <Link href={`/workflow/${task.workflowId}`}>
                              <span className="hover:underline">Workflow #{task.workflowId}</span>
                            </Link>
                            <span>•</span>
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <div className="text-sm">{renderPriorityIndicator(task.priority)}</div>
                          <Button size="sm">Complete Task</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t flex justify-end">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Tasks
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* System Status Tab */}
          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>System Status</CardTitle>
                  <div className="flex items-center space-x-2 text-sm">
                    <Gauge className="h-4 w-4 text-primary" />
                    <span>Last updated: 5 minutes ago</span>
                  </div>
                </div>
                <CardDescription>Current status of TerraFusion Platform services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {systemStatus.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{service.name}</h3>
                            {renderSystemStatusBadge(service.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Uptime: {service.uptime}</span>
                            <span>•</span>
                            <span>Last checked: {service.lastChecked}</span>
                          </div>
                          {service.message && (
                            <p className="text-sm text-amber-600 mt-1">{service.message}</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t flex justify-between">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All
                </Button>
                <Button asChild>
                  <Link href="/system-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
};

export default DashboardPage;