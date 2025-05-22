import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
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
    status: "success", 
    user: "admin@bentoncounty.gov", 
    time: "10:05",
    details: {}
  },
  { 
    id: 2, 
    parcelId: "10003", 
    action: "doc_upload", 
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
    status: "success", 
    user: "admin@bentoncounty.gov", 
    time: "11:30",
    details: {}
  },
  { 
    id: 4, 
    parcelId: "10003", 
    action: "access_denied", 
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
    status: "warning", 
    user: "system", 
    time: "15:10",
    details: {
      reason: "Possible structure detected that does not match records - manual review required"
    }
  },
];

// Function to simulate AI summaries
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

const MuskDemoDashboardSimplified: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<string | null>(null);
  const [showParcelPanel, setShowParcelPanel] = useState(false);
  const [showWebhookPanel, setShowWebhookPanel] = useState(false);
  const [timeTravel, setTimeTravel] = useState(new Date());
  const [timeSliderValue, setTimeSliderValue] = useState(100);
  const [filteredEvents, setFilteredEvents] = useState(TIMELINE_EVENTS);
  const [systemStatus, setSystemStatus] = useState({
    general: "operational",
    database: "operational",
    mapServices: "operational",
    documentClassification: "operational",
    webhooks: "operational"
  });
  const [statData, setStatData] = useState({
    activeWorkflows: 28,
    eventsToday: 324,
    hoursSaved: 287,
    uptime: 100
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
  const handleTimeTravel = (value: number) => {
    setTimeSliderValue(value);
    
    // Calculate date based on slider value (0 = earliest date, 100 = now)
    const now = new Date();
    const earliestDate = new Date();
    earliestDate.setDate(earliestDate.getDate() - 30); // 30 days ago
    
    // Calculate date between earliest and now based on slider value
    const millisecondsDiff = now.getTime() - earliestDate.getTime();
    const newDate = new Date(earliestDate.getTime() + (millisecondsDiff * (value / 100)));
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

  // Handle workflow start
  const handleStartWorkflow = () => {
    if (!selectedParcel) return;
    
    toast({
      title: "Workflow Started",
      description: `A new workflow has been started for Parcel #${selectedParcel}.`,
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
            </h1>
            <Badge variant="outline" className="ml-3">
              Musk Demo
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm">
              <div className={`h-2 w-2 rounded-full ${getStatusColor(systemStatus.general)} mr-2`}></div>
              <span>All Systems Operational</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                  {user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        
        {/* Main dashboard or map view */}
        <div className="flex-1 overflow-hidden p-4 flex">
          {/* Left panel (Dashboard or Map) */}
          {!selectedParcel ? (
            <div className="flex-1 flex flex-col space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow`}>
                <h2 className="text-2xl font-bold mb-1">Welcome, Admin</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This is mission control for every property in Benton County.
                </p>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statData.activeWorkflows}</div>
                    <p className="text-xs text-green-500 mt-1">+2 today</p>
                  </CardContent>
                </Card>
                
                <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Audited Events Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statData.eventsToday}</div>
                    <p className="text-xs text-green-500 mt-1">100% logged</p>
                  </CardContent>
                </Card>
                
                <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Hours Saved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statData.hoursSaved}</div>
                    <p className="text-xs text-green-500 mt-1">YTD automation</p>
                  </CardContent>
                </Card>
                
                <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statData.uptime}%</div>
                    <p className="text-xs text-green-500 mt-1">30 days</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className={`flex-1 ${darkMode ? 'bg-gray-900 border-gray-800' : ''}`}>
                <CardHeader>
                  <CardTitle>Interactive Map</CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-80px)]">
                  <div className={`h-full w-full rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} relative overflow-hidden`}>
                    {/* Map placeholder - In real implementation, this would be a Mapbox or Leaflet map */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-gray-500 mb-4">County Map (Parcels)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {PARCELS.map(parcel => (
                          <Button 
                            key={parcel.id}
                            variant={darkMode ? "outline" : "secondary"}
                            className="h-24 w-36 flex flex-col items-center justify-center"
                            onClick={() => handleParcelSelect(parcel.id)}
                          >
                            <div className="text-sm font-bold">Parcel #{parcel.id}</div>
                            <div className="text-xs mt-1">{parcel.owner}</div>
                            <Badge 
                              variant={
                                parcel.status === "Approved" ? "default" : 
                                parcel.status === "In Review" ? "secondary" : "outline"
                              }
                              className="mt-2"
                            >
                              {parcel.status}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={darkMode ? 'bg-gray-900 border-gray-800' : ''}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>System Health</CardTitle>
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
                      <span>{'<100ms'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className={`flex-1 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow overflow-hidden`}>
              <div className="h-full relative">
                {/* Map view with selected parcel highlighted */}
                <div className={`h-full w-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center`}>
                  <p className="text-lg font-bold">
                    Parcel #{selectedParcel} Selected
                  </p>
                </div>
                
                {/* Floating action button */}
                <Button 
                  size="icon"
                  className="absolute bottom-4 right-4 h-12 w-12 rounded-full"
                  onClick={() => setShowParcelPanel(true)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          )}
          
          {/* Right panel (Detail view) - Only show when a parcel is selected */}
          {selectedParcel && showParcelPanel && (
            <div 
              className={`w-96 ml-4 rounded-lg ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow'} flex flex-col overflow-hidden`}
            >
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">Parcel #{selectedParcel}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {PARCELS.find(p => p.id === selectedParcel)?.owner}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {PARCELS.find(p => p.id === selectedParcel)?.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowParcelPanel(false)}>
                    &times;
                  </Button>
                </div>
              </div>
              
              <div 
                className="p-4 border-b bg-primary/10 mb-2"
              >
                <div className="flex items-start gap-2">
                  <Brain className="text-primary shrink-0 mt-1" size={18} />
                  <div>
                    <h3 className="text-sm font-medium mb-1">AI Summary</h3>
                    <p className="text-sm">
                      {getAiSummary(selectedParcel)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Time Travel Slider */}
              <div 
                className="px-4 py-2 border-b"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Time Travel</h3>
                  <span className="text-xs text-primary">{timeTravel.toLocaleDateString()} {timeTravel.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="px-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={timeSliderValue} 
                    onChange={(e) => handleTimeTravel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>30 days ago</span>
                    <span>Now</span>
                  </div>
                </div>
              </div>
              
              <div 
                className="px-4 py-2"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Timeline</h3>
                  <Badge variant="outline" className="text-xs">{filteredEvents.filter(e => e.parcelId === selectedParcel).length} events</Badge>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {filteredEvents
                      .filter(event => event.parcelId === selectedParcel)
                      .map(event => (
                        <div 
                          key={event.id} 
                          className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {event.status === 'success' && <Check className="text-green-500" size={16} />}
                              {event.status === 'error' && <AlertCircle className="text-red-500" size={16} />}
                              {event.status === 'info' && <FileUp className="text-blue-500" size={16} />}
                              {event.status === 'warning' && <AlertCircle className="text-yellow-500" size={16} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="font-medium">
                                  {event.action === 'workflow_start' && 'Workflow Started'}
                                  {event.action === 'doc_upload' && 'Document Uploaded'}
                                  {event.action === 'access_denied' && 'Access Denied'}
                                  {event.action === 'aerial_image_flag' && 'Aerial Image Flag'}
                                </div>
                                <span className="text-xs text-gray-500">{event.time}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {event.user}
                              </p>
                              {event.action === 'access_denied' && (
                                <p className="text-xs text-red-500 mt-1">
                                  {event.details.reason}
                                </p>
                              )}
                              {event.action === 'aerial_image_flag' && (
                                <p className="text-xs text-yellow-500 mt-1">
                                  {event.details.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
              
              <div 
                className="mt-auto p-4 border-t flex gap-2"
              >
                <Button onClick={handleStartWorkflow} className="flex-1">
                  Start Workflow
                </Button>
                <Button onClick={handleDocumentUpload} variant="outline" className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          )}
          
          {/* Webhook Response Panel */}
          {webhookResponse && showWebhookPanel && (
            <div 
              className={`w-80 ml-4 rounded-lg ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow'} flex flex-col overflow-hidden`}
            >
              <div className="p-3 border-b flex justify-between items-center bg-primary/5">
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full bg-green-500 mr-2`}></div>
                  <h3 className="text-sm font-medium">Webhook Response</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowWebhookPanel(false)}>
                  &times;
                </Button>
              </div>
              
              <div className="p-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-500">Status</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    {webhookResponse.status}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-500">Time</span>
                  <span>{new Date(webhookResponse.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Payload</div>
                  <div className={`text-xs font-mono p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} overflow-auto max-h-[200px]`}>
                    <pre>{JSON.stringify(webhookResponse.payload, null, 2)}</pre>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-center">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    View API Docs
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Webhook & API Demo Panel (hidden by default, would be shown with a button click) */}
        <div className={`${darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t'} p-2 text-xs flex justify-between items-center`}>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">API Status:</span>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs h-5">
              Operational
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">©2023 Benton County</span>
            <span className="text-gray-500">|</span>
            <span className="text-primary">API Documentation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuskDemoDashboardSimplified;