import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Map, 
  FileText, 
  Database, 
  Users, 
  Activity, 
  TrendingUp, 
  Settings, 
  Bell,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Upload
} from 'lucide-react';

const TerraFusionDashboard: React.FC = () => {
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 47,
    processingJobs: 23,
    documentQueue: 156,
    systemLoad: 67
  });

  const [parcelsProcessed, setParcelsProcessed] = useState(12847);
  const [documentsClassified, setDocumentsClassified] = useState(8934);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3 - 1),
        processingJobs: Math.max(0, prev.processingJobs + Math.floor(Math.random() * 5 - 2)),
        systemLoad: Math.max(0, Math.min(100, prev.systemLoad + Math.floor(Math.random() * 10 - 5)))
      }));
      
      if (Math.random() > 0.7) {
        setParcelsProcessed(prev => prev + 1);
      }
      if (Math.random() > 0.8) {
        setDocumentsClassified(prev => prev + 1);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const recentActivities = [
    { id: 1, action: "Document classified", entity: "PROP_2024_001.pdf", user: "Sarah Chen", time: "2 minutes ago", type: "classification" },
    { id: 2, action: "Parcel boundary updated", entity: "Parcel 34-2-15-08", user: "Mike Rodriguez", time: "5 minutes ago", type: "update" },
    { id: 3, action: "Assessment completed", entity: "123 Main Street", user: "Jennifer Walsh", time: "8 minutes ago", type: "assessment" },
    { id: 4, action: "Legal description parsed", entity: "DEED_2024_089.pdf", user: "AI Assistant", time: "12 minutes ago", type: "ai" },
    { id: 5, action: "Quality check passed", entity: "Survey_Block_15.dwg", user: "David Kim", time: "15 minutes ago", type: "quality" }
  ];

  const criticalAlerts = [
    { id: 1, level: "high", message: "15 documents require manual review", count: 15 },
    { id: 2, level: "medium", message: "Backup completed successfully", count: 1 },
    { id: 3, level: "low", message: "System update available", count: 1 }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'classification': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'update': return <Map className="h-4 w-4 text-green-500" />;
      case 'assessment': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'ai': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'quality': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">TerraFusion</h1>
            <p className="text-xl text-gray-600 mt-2">Civil Infrastructure Intelligence Platform</p>
            <div className="flex items-center space-x-4 mt-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                System Operational
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Users className="h-3 w-3 mr-1" />
                {realTimeData.activeUsers} Active Users
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Database className="h-3 w-3 mr-1" />
                {realTimeData.processingJobs} Jobs Processing
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({criticalAlerts.length})
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Zap className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Parcels Processed</CardTitle>
                <Map className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{parcelsProcessed.toLocaleString()}</div>
              <p className="text-sm text-green-600 mt-1">+127 today</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">AI Classifications</CardTitle>
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{documentsClassified.toLocaleString()}</div>
              <p className="text-sm text-green-600 mt-1">+89 today</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Assessments Complete</CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">2,847</div>
              <p className="text-sm text-green-600 mt-1">+34 today</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">System Load</CardTitle>
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{realTimeData.systemLoad}%</div>
              <Progress value={realTimeData.systemLoad} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Real-Time Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <span className="text-sm text-gray-500">{activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.entity} • by {activity.user}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    {alert.level === 'high' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {alert.level === 'medium' && <Clock className="h-4 w-4 text-yellow-500" />}
                    {alert.level === 'low' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                    <Badge variant={alert.level === 'high' ? 'destructive' : 'secondary'}>
                      {alert.count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI Services</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WebSocket</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <Badge className="bg-yellow-100 text-yellow-800">85% Full</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Document Processing</TabsTrigger>
            <TabsTrigger value="mapping">GIS Operations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Processing Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Documents Queued</span>
                      <span className="font-medium">{realTimeData.documentQueue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Processing</span>
                      <span className="font-medium">{realTimeData.processingJobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed Today</span>
                      <span className="font-medium text-green-600">89</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Accuracy Rate</span>
                      <span className="font-medium text-green-600">99.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Auto-Classification</span>
                      <span className="font-medium text-blue-600">94.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Manual Review</span>
                      <span className="font-medium text-orange-600">5.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Processing Time</span>
                      <span className="font-medium">2.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Throughput</span>
                      <span className="font-medium">45 docs/min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Uptime</span>
                      <span className="font-medium text-green-600">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Intelligence Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{documentsClassified.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Classified</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Eye className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">2,156</div>
                    <div className="text-sm text-gray-600">OCR Processed</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">1,847</div>
                    <div className="text-sm text-gray-600">AI Parsed</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">98.7%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GIS & Mapping Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <Map className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{parcelsProcessed.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Parcels Mapped</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-gray-600">Active Layers</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{realTimeData.activeUsers}</div>
                    <div className="text-sm text-gray-600">Concurrent Users</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Activity className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">23</div>
                    <div className="text-sm text-gray-600">Live Edits</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Processing Efficiency</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Document Classification</span>
                        <span className="text-sm font-medium">94.8%</span>
                      </div>
                      <Progress value={94.8} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">OCR Accuracy</span>
                        <span className="text-sm font-medium">97.2%</span>
                      </div>
                      <Progress value={97.2} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Data Quality</span>
                        <span className="text-sm font-medium">99.1%</span>
                      </div>
                      <Progress value={99.1} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">System Resources</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">CPU Usage</span>
                        <span className="text-sm font-medium">{realTimeData.systemLoad}%</span>
                      </div>
                      <Progress value={realTimeData.systemLoad} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Memory Usage</span>
                        <span className="text-sm font-medium">72%</span>
                      </div>
                      <Progress value={72} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Storage</span>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                      <Progress value={85} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TerraFusionDashboard;