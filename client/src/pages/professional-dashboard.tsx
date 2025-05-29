import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModernLayout from '../components/layout/modern-layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSearch,
  Filter,
  Gavel,
  Info,
  LineChart,
  MapPin,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { Link } from 'wouter';

interface DataSource {
  id: string;
  name: string;
  status: 'connected' | 'warning' | 'error';
  lastSync: string;
  recordCount: number;
  confidence: number;
}

interface DecisionPoint {
  id: string;
  title: string;
  description: string;
  confidence: number;
  reasoning: string[];
  sources: string[];
  userOverride?: boolean;
}

interface Workflow {
  id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  decisions: DecisionPoint[];
  lastAction: string;
  nextRequiredAction: string;
  userInControl: boolean;
}

const ProfessionalDashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showDecisionDetails, setShowDecisionDetails] = useState<string | null>(null);

  // Mock data representing real professional workflows
  const dataSources: DataSource[] = [
    {
      id: 'county-records',
      name: 'Benton County Records',
      status: 'connected',
      lastSync: '5 minutes ago',
      recordCount: 45782,
      confidence: 99.8
    },
    {
      id: 'state-parcels',
      name: 'Washington State Parcel Database',
      status: 'connected',
      lastSync: '12 minutes ago',
      recordCount: 156890,
      confidence: 98.5
    },
    {
      id: 'survey-records',
      name: 'Professional Survey Records',
      status: 'warning',
      lastSync: '2 hours ago',
      recordCount: 8934,
      confidence: 95.2
    }
  ];

  const workflows: Workflow[] = [
    {
      id: 'johnson-division',
      title: 'Johnson Property Division',
      type: 'Long Plat',
      status: 'pending_review',
      progress: 65,
      userInControl: true,
      lastAction: 'AI suggested legal description interpretation',
      nextRequiredAction: 'Professional review of boundary calculations',
      decisions: [
        {
          id: 'legal-desc-1',
          title: 'Legal Description Interpretation',
          description: 'Interpreted metes and bounds description for parcel division',
          confidence: 92,
          reasoning: [
            'Matched bearing "N 45° 30\' E" with survey monument SM-445',
            'Distance calculations verified against recorded plat',
            'Closure error within acceptable tolerance (1:50,000)'
          ],
          sources: ['Survey Record #2023-445', 'Original Plat Book 15, Page 33']
        },
        {
          id: 'zoning-check-1',
          title: 'Zoning Compliance Verification',
          description: 'Verified minimum lot size requirements',
          confidence: 98,
          reasoning: [
            'Current zoning: R-1 (Single Family Residential)',
            'Minimum lot size: 7,200 sq ft per lot',
            'Proposed lots: 8,100 sq ft (Lot 1), 9,450 sq ft (Lot 2)'
          ],
          sources: ['Benton County Zoning Code 17.10.020', 'Current Zoning Map']
        }
      ]
    }
  ];

  const renderConfidenceIndicator = (confidence: number) => {
    const color = confidence >= 95 ? 'bg-green-500' : confidence >= 85 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-sm font-medium">{confidence}%</span>
      </div>
    );
  };

  const renderDataSourceStatus = (source: DataSource) => {
    const statusConfig = {
      connected: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      error: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[source.status];
    const StatusIcon = config.icon;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{source.name}</CardTitle>
            <Badge className={config.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {source.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Last Sync</p>
              <p className="font-medium">{source.lastSync}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Records</p>
              <p className="font-medium">{source.recordCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Quality</p>
              {renderConfidenceIndicator(source.confidence)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDecisionPoint = (decision: DecisionPoint, workflowId: string) => {
    const isExpanded = showDecisionDetails === decision.id;
    
    return (
      <Card className="mb-4 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-base">{decision.title}</CardTitle>
              {renderConfidenceIndicator(decision.confidence)}
            </div>
            <div className="flex items-center space-x-2">
              {decision.userOverride && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Shield className="h-3 w-3 mr-1" />
                  User Override
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDecisionDetails(isExpanded ? null : decision.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>{decision.description}</CardDescription>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="border-t">
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Reasoning & Analysis
                </h4>
                <ul className="space-y-1 text-sm">
                  {decision.reasoning.map((reason, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <FileSearch className="h-4 w-4 mr-2" />
                  Data Sources Referenced
                </h4>
                <ul className="space-y-1 text-sm">
                  {decision.sources.map((source, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Info className="h-3 w-3 text-blue-500" />
                      <span className="text-blue-600 hover:underline cursor-pointer">{source}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Override Decision
                </Button>
                <Button size="sm" variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  View Source Data
                </Button>
                <Button size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Professional Control Center</h1>
            <p className="text-muted-foreground">
              Complete transparency and control over your real estate assessment workflows
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure Rules
            </Button>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              You Are In Control
            </CardTitle>
            <CardDescription>
              Every decision made by the system is transparent, traceable, and under your professional oversight.
              View reasoning, override decisions, and maintain complete control over your workflows.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <Tabs defaultValue="workflows">
            <TabsList>
              <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
              <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
              <TabsTrigger value="decisions">Recent Decisions</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Monitor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="workflows" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Workflows Requiring Your Attention</h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <select 
                  value={activeFilter} 
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Workflows</option>
                  <option value="pending">Pending Review</option>
                  <option value="overridden">User Overridden</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {workflows.map((workflow) => (
              <Card key={workflow.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Gavel className="h-5 w-5 mr-2" />
                        {workflow.title}
                      </CardTitle>
                      <CardDescription>{workflow.type} • {workflow.progress}% Complete</CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <Users className="h-3 w-3 mr-1" />
                      Professional Control
                    </Badge>
                  </div>
                  <Progress value={workflow.progress} className="mt-2" />
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Last Action</p>
                        <p>{workflow.lastAction}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Required Action</p>
                        <p className="font-medium text-amber-600">{workflow.nextRequiredAction}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Decisions Made ({workflow.decisions.length})
                      </h4>
                      {workflow.decisions.map((decision) => (
                        <div key={decision.id}>
                          {renderDecisionPoint(decision, workflow.id)}
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <Button>
                        <Link href={`/workflow/${workflow.id}`} className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Open in Map View
                        </Link>
                      </Button>
                      <Button variant="outline">
                        <FileSearch className="h-4 w-4 mr-2" />
                        View All Documents
                      </Button>
                      <Button variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analysis Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="data-sources" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Data Source Health & Quality</h2>
              <p className="text-muted-foreground mb-6">
                Monitor the quality and status of all data sources feeding into your workflows. 
                All data is sourced from official records and verified systems.
              </p>
            </div>
            
            {dataSources.map((source) => (
              <div key={source.id}>
                {renderDataSourceStatus(source)}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="decisions" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Decision Audit Trail</h2>
              <p className="text-muted-foreground mb-6">
                Complete history of all automated decisions with full reasoning and the ability to override any decision.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Property Assessment Decision */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Property Assessment - 4521 W Canal Dr</CardTitle>
                      <p className="text-sm text-muted-foreground">Decision made 2 hours ago</p>
                    </div>
                    <Badge variant="outline">Assessment</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">System Recommendation: $485,000</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Basis:</strong> Comparable sales analysis (3 properties within 0.5mi)</p>
                        <p><strong>Key Factors:</strong> 2,140 sq ft, Built 1987, Corner lot (+$15k)</p>
                        <p><strong>Market Adjustment:</strong> +12% (Q4 2024 trend)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Full Analysis
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Override Decision
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* BLA Processing Decision */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Boundary Line Adjustment - BSP 6142</CardTitle>
                      <p className="text-sm text-muted-foreground">Decision made 4 hours ago</p>
                    </div>
                    <Badge variant="outline">BLA</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">System Recommendation: Approve with Conditions</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Legal Description:</strong> Verified against RCW 58.17.040</p>
                        <p><strong>Setback Compliance:</strong> Meets 20ft minimum (22.5ft actual)</p>
                        <p><strong>Area Transfer:</strong> 0.15 acres from Parcel A to Parcel B</p>
                        <p><strong>Condition:</strong> Updated survey required for final approval</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Legal Analysis
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Modify Conditions
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Generate Documents
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Classification Decision */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Document Classification - Deed Analysis</CardTitle>
                      <p className="text-sm text-muted-foreground">Decision made 1 day ago</p>
                    </div>
                    <Badge variant="outline">Document</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">System Classification: Warranty Deed (98.5% confidence)</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Key Indicators:</strong> "Warranty" in title, grantor/grantee identified</p>
                        <p><strong>Legal Elements:</strong> Consideration stated, property description complete</p>
                        <p><strong>Recording Status:</strong> Ready for recording (all requirements met)</p>
                        <p><strong>Flag:</strong> Review grantor signature for consistency</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Document
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Reclassify
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Processing Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Compliance & Regulatory Monitor</h2>
              <p className="text-muted-foreground mb-6">
                Continuous monitoring of regulatory compliance across all workflows and data sources.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                    Zoning Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">All active workflows compliant</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                    Survey Standards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">98.5%</p>
                  <p className="text-sm text-muted-foreground">Professional survey standards met</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                    Data Currency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">95.2%</p>
                  <p className="text-sm text-muted-foreground">Data within acceptable age limits</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </ModernLayout>
  );
};

export default ProfessionalDashboard;