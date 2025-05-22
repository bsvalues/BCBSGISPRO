import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Progress } from "../components/ui/progress";
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
  Brain
} from "lucide-react";

// Demo data
const PARCELS = [
  { id: "10003", owner: "John Doe", status: "In Review", coordinates: { lat: 46.23, lng: -119.52 } },
  { id: "10004", owner: "Jane Smith", status: "Approved", coordinates: { lat: 46.24, lng: -119.53 } },
  { id: "10005", owner: "Robert Johnson", status: "Pending", coordinates: { lat: 46.22, lng: -119.54 } },
];

const TIMELINE_EVENTS = [
  { id: 1, parcelId: "10003", action: "workflow_start", user: "staff@bentoncounty.gov", time: "10:05", status: "success", details: { type: "assessment" } },
  { id: 2, parcelId: "10003", action: "doc_upload", user: "staff@bentoncounty.gov", time: "10:10", status: "info", details: { type: "deed" } },
  { id: 3, parcelId: "10003", action: "access_denied", user: "readonly@bentoncounty.gov", time: "10:12", status: "error", details: { reason: "insufficient permissions" } },
  { id: 4, parcelId: "10003", action: "aerial_image_flag", user: "system", time: "10:15", status: "warning", details: { reason: "potential discrepancy detected" } },
];

// AI summary for parcel timeline
const getAiSummary = (parcelId: string) => {
  if (parcelId === "10003") {
    return "All recent edits and documents on this parcel are consistent with expected field activity. No anomalies detected. Last action: Workflow started by Staff User, recommended review by Appraiser due to flagged aerial image.";
  }
  return "All activities on this parcel appear normal. No anomalies detected in recent transactions.";
};

const MuskDemoDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<string | null>(null);
  const [showParcelPanel, setShowParcelPanel] = useState(false);
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
    
    // Fake web hook response
    setTimeout(() => {
      toast({
        title: "Webhook Notification",
        description: `Parcel ${parcelId} data accessed and transmitted to external systems.`,
        variant: "default",
      });
    }, 2000);
  };

  // Handle workflow start
  const handleStartWorkflow = () => {
    if (!selectedParcel) return;
    
    // Add new event to timeline
    const newEventTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    toast({
      title: "Workflow Started",
      description: `New workflow initiated for parcel #${selectedParcel} at ${newEventTime}`,
      variant: "default",
    });
    
    // Increment stats
    setStatData(prev => ({
      ...prev,
      activeWorkflows: prev.activeWorkflows + 1,
      eventsToday: prev.eventsToday + 1
    }));
  };

  // Handle document upload
  const handleDocumentUpload = () => {
    if (!selectedParcel) return;
    
    // Simulate document upload success
    setTimeout(() => {
      const newEventTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      toast({
        title: "Document Uploaded",
        description: `New document uploaded for parcel #${selectedParcel} at ${newEventTime}`,
        variant: "default",
      });
      
      // Increment stats
      setStatData(prev => ({
        ...prev,
        eventsToday: prev.eventsToday + 1
      }));
    }, 1000);
  };

  // Handle export audit log
  const handleExportAuditLog = () => {
    toast({
      title: "Audit Log Exported",
      description: "Audit log has been exported to CSV successfully.",
      variant: "default",
    });
  };

  // Status indicator color
  const getStatusColor = (status: string) => {
    if (status === "operational") return "bg-green-500";
    if (status === "degraded") return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-16 flex-shrink-0 ${darkMode ? 'bg-gray-900' : 'bg-white border-r'} flex flex-col items-center py-6`}>
        <div className="flex flex-col items-center gap-6">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/logo.png" alt="Benton County" />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">BC</AvatarFallback>
          </Avatar>
          
          <Link href="/dashboard">
            <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <LayoutDashboard className="text-primary" />
            </a>
          </Link>
          
          <Link href="/map">
            <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <Map className="text-primary" />
            </a>
          </Link>
          
          <Link href="/workflows">
            <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <Clock className="text-primary" />
            </a>
          </Link>
          
          <Link href="/admin/user-management">
            <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <Users className="text-primary" />
            </a>
          </Link>
          
          <Link href="/admin/audit-logs">
            <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <FileText className="text-primary" />
            </a>
          </Link>
          
          <Link href="/settings">
            <a className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <Settings className="text-primary" />
            </a>
          </Link>
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
              Mission Control
              <span className={`ml-2 inline-flex h-2 w-2 rounded-full ${getStatusColor("operational")}`}></span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${getStatusColor(systemStatus.general)}`}></span>
              <span>System Status: All Green</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
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
            <div className={`w-96 ml-4 rounded-lg ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow'} flex flex-col overflow-hidden`}>
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
              
              <div className="p-4 border-b bg-primary/10 mb-2">
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
              
              <div className="px-4 py-2">
                <h3 className="text-sm font-medium mb-2">Timeline</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {TIMELINE_EVENTS
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
              
              <div className="mt-auto p-4 border-t flex gap-2">
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
        </div>
        
        {/* Webhook & API Demo Panel (hidden by default, would be shown with a button click) */}
        <div className={`${darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t'} p-2 text-xs flex justify-between items-center`}>
          <div className="flex gap-2 items-center">
            <span>Public API & Webhooks:</span>
            <span className={`inline-flex h-2 w-2 rounded-full ${getStatusColor("operational")}`}></span>
            <span>Operational</span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span>Dark Mode</span>
              <Switch 
                checked={darkMode} 
                onChange={(e) => setDarkMode(e.target.checked)} 
              />
            </div>
            <span>© {new Date().getFullYear()} Benton County • 100% Audited</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuskDemoDashboard;