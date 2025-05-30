import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { useToast } from '../hooks/use-toast';
import { 
  LayoutDashboard, 
  Map, 
  FileText, 
  Users, 
  Settings, 
  Plus, 
  Upload, 
  Check, 
  AlertCircle, 
  FileUp, 
  Clock, 
  Shield,
  Sun,
  Moon,
  Brain,
  Globe
} from "lucide-react";

// Demo data
const PARCELS = [
  { id: "10003", owner: "John Doe", status: "In Review", coordinates: { lat: 46.23, lng: -119.52 } },
  { id: "10452", owner: "Jane Smith", status: "Approved", coordinates: { lat: 46.24, lng: -119.53 } },
  { id: "10778", owner: "Robert Johnson", status: "Pending", coordinates: { lat: 46.22, lng: -119.51 } },
  { id: "11239", owner: "Sarah Williams", status: "In Review", coordinates: { lat: 46.25, lng: -119.54 } },
  { id: "11501", owner: "Michael Brown", status: "Approved", coordinates: { lat: 46.21, lng: -119.50 } },
  { id: "12067", owner: "David Miller", status: "Pending", coordinates: { lat: 46.26, lng: -119.55 } }
];

const TIMELINE_EVENTS = [
  { 
    id: 1, 
    parcelId: "10003", 
    action: "workflow_start", 
    type: "success",
    status: "success", 
    user: "admin@bentoncounty.gov", 
    time: "10:05",
    details: {}
  },
  { 
    id: 2, 
    parcelId: "10003", 
    action: "doc_upload", 
    type: "info",
    status: "info", 
    user: "john.doe@example.com", 
    time: "10:15",
    details: {
      documentType: "Deed",
      fileName: "deed_10003_2023.pdf"
    }
  },
  { 
    id: 3, 
    parcelId: "10452", 
    action: "workflow_start", 
    type: "success",
    status: "success", 
    user: "admin@bentoncounty.gov", 
    time: "11:30",
    details: {}
  },
  { 
    id: 4, 
    parcelId: "10003", 
    action: "access_denied", 
    type: "error",
    status: "error", 
    user: "external_user@example.com", 
    time: "13:45",
    details: {
      reason: "Unauthorized access attempt - User lacks required permissions"
    }
  },
  { 
    id: 5, 
    parcelId: "10778", 
    action: "doc_upload", 
    type: "info",
    status: "info", 
    user: "robert.johnson@example.com", 
    time: "14:20",
    details: {
      documentType: "Boundary Survey",
      fileName: "survey_10778_2023.pdf"
    }
  },
  { 
    id: 6, 
    parcelId: "10003", 
    action: "aerial_image_flag", 
    type: "warning",
    status: "warning", 
    user: "system", 
    time: "15:10",
    details: {
      reason: "Possible structure detected that does not match records - manual review required"
    }
  },
];

// Function to get AI summaries for parcels
const getAiSummary = (parcelId: string) => {
  if (parcelId === "10003") {
    return "This parcel has an active boundary review workflow. AI detected a potential unauthorized structure in recent aerial imagery that doesn't match property records. Manual verification recommended.";
  }
  if (parcelId === "10452") {
    return "All property transactions for this parcel have been properly recorded and follow expected patterns. No anomalies detected in ownership chain or valuation history.";
  }
  if (parcelId === "10778") {
    return "Recent property transfer may contain a restricted covenant that needs review. The AI flagged specific language on page 3 of the recent deed that may be unenforceable.";
  }
  return "All activities on this parcel appear normal. No anomalies detected in recent transactions.";
};

const MuskDemoNew: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<string | null>(null);
  const [showParcelPanel, setShowParcelPanel] = useState(false);
  const [showWebhookPanel, setShowWebhookPanel] = useState(false);
  const [timeTravel, setTimeTravel] = useState(new Date());
  const [timeSliderValue, setTimeSliderValue] = useState(100);
  const [filteredEvents, setFilteredEvents] = useState(TIMELINE_EVENTS);
  const [expandedEvents, setExpandedEvents] = useState<{[key: number]: boolean}>({});
  const [eventExplanations, setEventExplanations] = useState<{[key: number]: string}>({
    1: "This workflow was initiated during normal business hours by an authorized administrator. All required validation checks were passed.",
    2: "Document was uploaded by the property owner. AI validation confirmed the document is a valid deed with appropriate signatures and notarization.",
    4: "External user attempted to access sensitive document without proper authorization. The system correctly blocked access and logged the attempt.",
    6: "Our aerial imagery analysis detected a possible unauthorized structure. The AI model is 87% confident this structure doesn't match property records from 6 months ago."
  });
  
  // System status
  const [systemStatus, setSystemStatus] = useState({
    general: "operational",
    database: "operational",
    mapServices: "operational",
    documentClassification: "operational",
    webhooks: "operational"
  });
  
  // Stats data
  const [statData, setStatData] = useState({
    activeWorkflows: 28,
    eventsToday: 324,
    hoursSaved: 287,
    uptime: 100
  });
  
  // Data health metrics
  const [dataHealth, setDataHealth] = useState({
    score: 98,
    validParcels: 15482,
    invalidParcels: 32,
    flaggedAnomalies: 8,
    lastScanTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    nextScanTime: new Date(Date.now() + 28 * 60 * 1000), // 28 minutes from now
    scanInProgress: false
  });
  
  // AI important insights
  const [aiInsights, setAiInsights] = useState({
    status: "attention", // can be "nominal", "attention", "critical"
    message: "2 parcels with unresolved anomalies, 1 document flagged for review",
    relatedParcelIds: ["10003", "11239"]
  });
  
  // Webhook activity
  const [webhookActivity, setWebhookActivity] = useState([
    { id: 1, endpoint: "/api/parcel/update", status: "success", timestamp: new Date(Date.now() - 45 * 1000) },
    { id: 2, endpoint: "/api/document/classify", status: "success", timestamp: new Date(Date.now() - 3 * 60 * 1000) },
    { id: 3, endpoint: "/api/workflow/start", status: "success", timestamp: new Date(Date.now() - 17 * 60 * 1000) },
    { id: 4, endpoint: "/api/audit/export", status: "failed", timestamp: new Date(Date.now() - 34 * 60 * 1000) },
    { id: 5, endpoint: "/api/parcel/validate", status: "success", timestamp: new Date(Date.now() - 62 * 60 * 1000) }
  ]);
  
  // System metrics
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: "3d 5h 42m",
    errors: { critical: 0, warnings: 2 },
    lastRestart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    responseTime: 87 // ms
  });
  
  const [webhookResponse, setWebhookResponse] = useState<{
    status: string;
    timestamp: string;
    payload: any;
  } | null>(null);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle parcel selection
  const handleParcelSelect = (parcelId: string) => {
    setSelectedParcel(parcelId);
    setShowParcelPanel(true);
    
    // Simulate webhook response
    setTimeout(() => {
      // Create webhook response data
      const responseData = {
        status: "success",
        timestamp: new Date().toISOString(),
        payload: {
          parcelId,
          action: "view",
          user: user?.email || "admin@bentoncounty.gov",
          timestamp: new Date().toISOString(),
          accessedFields: ["owner", "status", "timeline", "audit"]
        }
      };
      
      // Update webhook response state
      setWebhookResponse(responseData);
      
      // Show webhook notification
      toast({
        title: "Webhook Notification",
        description: `Parcel ${parcelId} data accessed and transmitted to external systems.`,
        variant: "default",
      });
      
      // Auto-show webhook panel
      setShowWebhookPanel(true);
    }, 2000);
  };
  
  // Handle time travel slider change
  const handleTimeTravel = (value: number[]) => {
    const newValue = value[0];
    setTimeSliderValue(newValue);
    
    // Calculate date based on slider value (0 = earliest date, 100 = now)
    const now = new Date();
    const earliestDate = new Date();
    earliestDate.setDate(earliestDate.getDate() - 30); // 30 days ago
    
    // Calculate date between earliest and now based on slider value
    const millisecondsDiff = now.getTime() - earliestDate.getTime();
    const newDate = new Date(earliestDate.getTime() + (millisecondsDiff * (newValue / 100)));
    setTimeTravel(newDate);
    
    // Filter events based on date
    const filtered = TIMELINE_EVENTS.filter(event => {
      // Convert event time string to Date object for comparison
      // Example event.time: "10:05" - create a date object for today with this time
      const [hours, minutes] = event.time.split(':').map(Number);
      const eventDate = new Date();
      eventDate.setHours(hours, minutes, 0, 0);
      
      // If event time is today, randomly distribute events over past 30 days for demo purposes
      const randomDaysAgo = event.id % 30; // Use event.id to deterministically set days ago
      eventDate.setDate(eventDate.getDate() - randomDaysAgo);
      
      return eventDate <= newDate;
    });
    
    setFilteredEvents(filtered);
  };
  
  // Handle explaining an event
  const handleExplainEvent = (eventId: number) => {
    // Toggle explanation visibility
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
    
    // If we don't already have an explanation for this event, generate one
    if (!eventExplanations[eventId]) {
      // Simulate AI generating an explanation
      toast({
        title: "AI Analyzing Event",
        description: "Generating context and explanation...",
        variant: "default",
      });
      
      // After a short delay, add a generated explanation
      setTimeout(() => {
        setEventExplanations(prev => ({
          ...prev,
          [eventId]: "This event was processed according to standard operating procedures. All required validations were completed successfully."
        }));
      }, 1500);
    }
  };

  // Handle workflow start
  const handleStartWorkflow = () => {
    if (!selectedParcel) return;
    
    toast({
      title: "Workflow Started",
      description: `A new workflow has been started for Parcel #${selectedParcel}.`,
      variant: "default",
    });
  };
  
  // Handle data health check
  const handleRunHealthCheck = () => {
    setDataHealth(prev => ({
      ...prev,
      scanInProgress: true
    }));
    
    // Simulate a health check running
    setTimeout(() => {
      setDataHealth(prev => ({
        ...prev,
        score: 99,
        validParcels: 15487,
        invalidParcels: 27,
        flaggedAnomalies: 6,
        lastScanTime: new Date(),
        nextScanTime: new Date(Date.now() + 30 * 60 * 1000),
        scanInProgress: false
      }));
      
      toast({
        title: "Data Health Scan Complete",
        description: "Data integrity score improved to 99%. 6 anomalies identified.",
        variant: "default",
      });
    }, 3000);
  };
  
  // Handle sending test webhook
  const handleSendTestWebhook = () => {
    // Create new webhook activity item
    const newActivity = {
      id: webhookActivity.length + 1,
      endpoint: "/api/test/webhook",
      status: "success",
      timestamp: new Date()
    };
    
    // Add to webhook activity
    setWebhookActivity(prev => [newActivity, ...prev.slice(0, 4)]);
    
    toast({
      title: "Test Webhook Sent",
      description: "Webhook successfully delivered to all registered endpoints.",
      variant: "default",
    });
  };
  
  // Handle document upload
  const handleDocumentUpload = () => {
    if (!selectedParcel) return;
    
    toast({
      title: "Document Upload",
      description: `Please select a document to upload for Parcel #${selectedParcel}.`,
      variant: "default",
    });
  };
  
  // Handle export audit log
  const handleExportAuditLog = () => {
    toast({
      title: "Audit Log Export",
      description: "Audit log has been exported to CSV format.",
      variant: "default",
    });
  };
  
  // Function to get status color
  const getStatusColor = (status: string) => {
    if (status === "operational") return "bg-green-500";
    if (status === "degraded") return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Function to get event color
  const getEventColor = (type: string) => {
    if (type === "success") return "bg-green-500";
    if (type === "info") return "bg-blue-500";
    if (type === "warning") return "bg-yellow-500";
    if (type === "error") return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`} 
      style={{ transition: 'background-color 0.5s ease, color 0.5s ease' }}>
      {/* Sidebar */}
      <div 
        className={`w-16 flex-shrink-0 ${darkMode ? 'bg-gray-900' : 'bg-white border-r'} flex flex-col items-center py-6`}
        style={{ transition: 'background-color 0.5s ease' }}
      >
        <div className="flex flex-col items-center gap-6">
          <div>
            <Avatar className="h-10 w-10">
              <AvatarImage src="/logo.png" alt="Benton County" />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">BC</AvatarFallback>
            </Avatar>
          </div>
          
          <div>
            <Link href="/dashboard">
              <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
                <LayoutDashboard className="text-primary" />
              </a>
            </Link>
          </div>
          
          <div>
            <Link href="/map">
              <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
                <Map className="text-primary" />
              </a>
            </Link>
          </div>
          
          <div>
            <Link href="/workflows">
              <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
                <Clock className="text-primary" />
              </a>
            </Link>
          </div>
          
          <div>
            <Link href="/admin/user-management">
              <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
                <Users className="text-primary" />
              </a>
            </Link>
          </div>
          
          <div>
            <Link href="/admin/audit-logs">
              <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
                <FileText className="text-primary" />
              </a>
            </Link>
          </div>
          
          <div>
            <Link href="/settings">
              <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
                <Settings className="text-primary" />
              </a>
            </Link>
          </div>
        </div>
        
        <div className="mt-auto">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
          >
            {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-blue-700" />}
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with system status */}
        <header className={`py-2 px-4 ${darkMode ? 'bg-gray-900' : 'bg-white border-b'} flex items-center justify-between`}>
          <div className="flex items-center">
            <h1 className="text-xl font-bold">
              Benton County GIS
              <Badge variant="outline" className="ml-2 font-normal">Musk Demo</Badge>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-gray-500">System Status:</span>
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(systemStatus.general)} mr-1`}></div>
                <span className="text-xs">Operational</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area with flex */}
        <div className="flex-1 overflow-hidden p-4 flex">
          {/* Left panel (Dashboard or Map) */}
          {!selectedParcel ? (
            <div className="flex-1 flex flex-col space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow`}>
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-2xl font-bold">Welcome, Admin</h2>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={dataHealth.scanInProgress ? "secondary" : "default"} 
                      size="sm"
                      onClick={handleRunHealthCheck}
                      disabled={dataHealth.scanInProgress}
                    >
                      {dataHealth.scanInProgress ? "Scanning..." : "Run Health Check"}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  This is mission control for every property in Benton County.
                </p>
                
                {/* Data Health Panel */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <Shield className="text-primary mr-2" size={18} />
                      <h3 className="text-sm font-semibold">Data Integrity</h3>
                    </div>
                    <Badge 
                      variant={dataHealth.score >= 98 ? "default" : dataHealth.score >= 90 ? "secondary" : "destructive"}
                      className="text-xs px-3"
                    >
                      {dataHealth.score}% Valid
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                    <div className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="font-medium">{dataHealth.validParcels.toLocaleString()}</div>
                      <div className="text-gray-500">Valid Parcels</div>
                    </div>
                    <div className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="font-medium">{dataHealth.invalidParcels}</div>
                      <div className="text-gray-500">Invalid Parcels</div>
                    </div>
                    <div className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="font-medium">{dataHealth.flaggedAnomalies}</div>
                      <div className="text-gray-500">Anomalies</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <div>Last scan: {dataHealth.lastScanTime.toLocaleTimeString()}</div>
                    <div>Next: {dataHealth.nextScanTime.toLocaleTimeString()}</div>
                  </div>
                </div>
                
                {/* AI Insights */}
                <div 
                  className={`p-3 rounded-lg border-l-4 ${
                    aiInsights.status === "nominal" 
                      ? "border-green-500 bg-green-500/10" 
                      : aiInsights.status === "attention" 
                        ? "border-yellow-500 bg-yellow-500/10" 
                        : "border-red-500 bg-red-500/10"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Brain className={`shrink-0 mt-0.5 ${
                      aiInsights.status === "nominal" 
                        ? "text-green-500" 
                        : aiInsights.status === "attention" 
                          ? "text-yellow-500" 
                          : "text-red-500"
                    }`} size={16} />
                    <div>
                      <div className="flex items-center gap-1">
                        <div className="text-sm font-medium">AI says:</div>
                        <Badge variant="outline" className="text-xs font-normal">What Matters Most</Badge>
                      </div>
                      <p className="text-sm">{aiInsights.message}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Active Workflows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statData.activeWorkflows}</div>
                    <p className="text-xs text-gray-500">+12% from last week</p>
                </CardContent>
              </Card>
              <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Events Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statData.eventsToday}</div>
                  <p className="text-xs text-gray-500">87 in the last hour</p>
                </CardContent>
              </Card>
              <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Hours Saved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statData.hoursSaved}</div>
                  <p className="text-xs text-gray-500">Via automation this month</p>
                </CardContent>
              </Card>
              <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statData.uptime}%</div>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </CardContent>
              </Card>
              </div>
              
              {/* Time Travel */}
              <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle>Time Travel</CardTitle>
                    <Badge variant="outline" className="text-xs font-normal">{timeTravel.toLocaleDateString()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">
                        Viewing data as of {timeTravel.toLocaleDateString()} {timeTravel.toLocaleTimeString()}
                      </div>
                      <Slider
                        value={[timeSliderValue]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={handleTimeTravel}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>30 days ago</span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">System Health</CardTitle>
                    <Button onClick={handleExportAuditLog} variant="outline" size="sm">Export Audit Log</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Database</span>
                        <span className={`inline-flex h-2 w-2 rounded-full ${getStatusColor(systemStatus.database)}`}></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Map Services</span>
                        <span className={`inline-flex h-2 w-2 rounded-full ${getStatusColor(systemStatus.mapServices)}`}></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Document Classification</span>
                        <span className={`inline-flex h-2 w-2 rounded-full ${getStatusColor(systemStatus.documentClassification)}`}></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Webhooks</span>
                        <span className={`inline-flex h-2 w-2 rounded-full ${getStatusColor(systemStatus.webhooks)}`}></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Response Time</span>
                        <span>{systemMetrics.responseTime}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Webhook/API Status Panel */}
                <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">API Activity</CardTitle>
                    <Button onClick={handleSendTestWebhook} variant="outline" size="sm">Send Test Webhook</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {webhookActivity.map(webhook => (
                        <div key={webhook.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${webhook.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-mono text-xs">{webhook.endpoint}</span>
                          </div>
                          <span className="text-xs text-gray-500">{
                            (() => {
                              const diffMs = Date.now() - webhook.timestamp.getTime();
                              if (diffMs < 60000) return `${Math.floor(diffMs/1000)}s ago`;
                              if (diffMs < 3600000) return `${Math.floor(diffMs/60000)}m ago`;
                              return `${Math.floor(diffMs/3600000)}h ago`;
                            })()
                          }</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Audit Trail Card */}
              <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] overflow-y-auto">
                  <div className="space-y-3">
                    {filteredEvents.map(event => (
                      <div key={event.id} className={`rounded-lg p-3 ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'} transition`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-1 rounded-full ${getEventColor(event.type)}`}>
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <p className="font-medium text-sm">{event.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                              <span className="text-xs text-gray-500">{event.time}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {event.status === 'error' && event.details.reason}
                              {event.status === 'warning' && event.details.reason}
                              {event.status === 'info' && event.details.documentType && `Document Type: ${event.details.documentType}`}
                              {(!event.details.reason && !event.details.documentType) && `By ${event.user}`}
                            </p>
                            
                            {/* AI Explain This button */}
                            <div className="flex justify-between items-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={() => handleExplainEvent(event.id)}
                              >
                                <div className="flex items-center gap-1">
                                  <Brain size={12} className="text-primary" />
                                  <span>Explain This</span>
                                </div>
                              </Button>
                              
                              {event.status === "error" && (
                                <Badge variant="destructive" className="text-xs">
                                  Requires Attention
                                </Badge>
                              )}
                              {event.status === "warning" && (
                                <Badge variant="secondary" className="text-xs">
                                  Review Needed
                                </Badge>
                              )}
                            </div>
                            
                            {/* AI Explanation */}
                            {expandedEvents[event.id] && (
                              <div className={`mt-2 p-3 rounded text-xs ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <div className="flex items-start gap-2">
                                  <Brain size={14} className="text-primary mt-0.5" />
                                  <div>
                                    <div className="font-medium mb-0.5">AI Explanation:</div>
                                    <p>{eventExplanations[event.id] || "AI is analyzing this event..."}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* System Uptime and Error Footer */}
              <div className={`mt-4 p-2 rounded-lg ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} text-xs flex justify-between items-center`}>
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full mr-2 bg-green-500`}></div>
                  <span>System Uptime: {systemMetrics.uptime}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Errors: {systemMetrics.errors.critical} critical, {systemMetrics.errors.warnings} warnings</span>
                  <span className="text-gray-500">Last restart: {systemMetrics.lastRestart.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex-1 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow overflow-hidden`}>
              <div className="h-full relative">
                {/* Map placeholder */}
                <div className="h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <div className="text-lg font-medium">Parcel #{selectedParcel}</div>
                    <div className="text-gray-600 mb-2">Owner: {PARCELS.find(p => p.id === selectedParcel)?.owner}</div>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button size="sm" onClick={handleStartWorkflow}>
                        <Plus className="h-4 w-4 mr-1" />
                        Start Workflow
                      </Button>
                      <Button size="sm" onClick={handleDocumentUpload}>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Document
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Back to dashboard button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-4 left-4"
                  onClick={() => setSelectedParcel(null)}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
          
          {/* Right panel (Parcels) */}
          <div className={`w-64 ml-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow p-4 flex flex-col`}>
            <h3 className="text-lg font-bold mb-4">Parcels</h3>
            <div className="space-y-2 overflow-y-auto flex-1">
              {PARCELS.map(parcel => (
                <div
                  key={parcel.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedParcel === parcel.id
                      ? darkMode ? 'bg-blue-800/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                      : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleParcelSelect(parcel.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">#{parcel.id}</div>
                      <div className="text-xs text-gray-500">{parcel.owner}</div>
                    </div>
                    <Badge 
                      variant={
                        parcel.status === "Approved" 
                          ? "default" 
                          : parcel.status === "In Review" 
                            ? "secondary" 
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {parcel.status}
                    </Badge>
                  </div>
                  
                  {aiInsights.relatedParcelIds.includes(parcel.id) && (
                    <div className="mt-2 flex items-center text-xs text-yellow-500">
                      <AlertCircle size={12} className="mr-1" />
                      <span>Anomaly detected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuskDemoNew;