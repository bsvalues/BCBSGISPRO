import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { 
  Map,
  Home,
  BarChart2,
  Database,
  Upload,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  HelpCircle,
  AlertCircle,
  Server
} from 'lucide-react';

// Simple placeholder components
const PlaceholderCard: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="w-full p-4 bg-white border rounded shadow">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    {children || <p className="text-gray-500">Component functionality will be implemented here</p>}
  </div>
);

const MapPlaceholder: React.FC = () => (
  <div className="w-full h-96 bg-gray-100 flex items-center justify-center border rounded">
    <div className="text-center">
      <Map className="w-12 h-12 mx-auto mb-2 text-gray-400" />
      <p className="text-gray-500">Interactive Map Component</p>
    </div>
  </div>
);

interface County {
  id: string;
  name: string;
  state: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  fips: string;
  parcelCount: number;
  lastUpdated: Date;
}

const mockCounties: County[] = [
  {
    id: 'benton-wa',
    name: 'Benton',
    state: 'WA',
    status: 'active',
    fips: '53005',
    parcelCount: 65430,
    lastUpdated: new Date('2023-12-10')
  }
];

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 1024);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Map Viewer' },
    { path: '/analysis', icon: BarChart2, label: 'Property Analysis' },
    { path: '/data', icon: Database, label: 'Data Management' },
    { path: '/import', icon: Upload, label: 'Import Data' },
    { path: '/admin', icon: Settings, label: 'Administration' },
    { path: '/system', icon: Server, label: 'System Health' }
  ];

  const renderSidebar = () => (
    <div className={`
      fixed left-0 top-0 h-full bg-slate-900 text-white z-50 transition-transform duration-300 ease-in-out
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      w-64 lg:translate-x-0
    `}>
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold">TerraFusion</h1>
        <p className="text-sm text-slate-300">GIS Platform</p>
      </div>
      
      <nav className="mt-6">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center px-4 py-3 text-sm hover:bg-slate-800 transition-colors
                ${location === item.path ? 'bg-slate-800 border-r-2 border-blue-500' : ''}
              `}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  const renderHeader = () => (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden p-2 rounded hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="ml-2 text-lg font-semibold">
          {sidebarItems.find(item => item.path === location)?.label || 'Dashboard'}
        </h2>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          Admin User
        </div>
        <button className="p-2 rounded hover:bg-gray-100">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {renderSidebar()}
        
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
          {renderHeader()}
          
          <main className="p-6">
            <Switch>
              <Route path="/">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <PlaceholderCard title="Counties">
                    <p className="text-2xl font-bold">{mockCounties.length}</p>
                    <p className="text-sm text-gray-500">Active counties</p>
                  </PlaceholderCard>
                  
                  <PlaceholderCard title="Total Parcels">
                    <p className="text-2xl font-bold">{mockCounties.reduce((sum, c) => sum + c.parcelCount, 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Property records</p>
                  </PlaceholderCard>
                  
                  <PlaceholderCard title="System Status">
                    <p className="text-2xl font-bold text-green-600">Healthy</p>
                    <p className="text-sm text-gray-500">All systems operational</p>
                  </PlaceholderCard>
                </div>
              </Route>
              
              <Route path="/map">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
                  <div className="lg:col-span-3">
                    <MapPlaceholder />
                  </div>
                  <div className="space-y-4">
                    <PlaceholderCard title="Layer Manager" />
                    <PlaceholderCard title="Measurement Tools" />
                    <PlaceholderCard title="Export Options" />
                  </div>
                </div>
              </Route>
              
              <Route path="/analysis">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
                  <div className="lg:col-span-2">
                    <MapPlaceholder />
                  </div>
                  <div>
                    <PlaceholderCard title="Property Analysis">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Parcel Number</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border rounded"
                            placeholder="Enter parcel number"
                          />
                        </div>
                        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                          Analyze Property
                        </button>
                      </div>
                    </PlaceholderCard>
                  </div>
                </div>
              </Route>
              
              <Route path="/data">
                <PlaceholderCard title="Data Management">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-4 border rounded hover:bg-gray-50 text-left">
                      <Database className="w-6 h-6 mb-2" />
                      <div className="font-medium">Parcel Data</div>
                      <div className="text-sm text-gray-500">Manage property records</div>
                    </button>
                    <button className="p-4 border rounded hover:bg-gray-50 text-left">
                      <Map className="w-6 h-6 mb-2" />
                      <div className="font-medium">GIS Layers</div>
                      <div className="text-sm text-gray-500">Manage map layers</div>
                    </button>
                  </div>
                </PlaceholderCard>
              </Route>
              
              <Route path="/import">
                <PlaceholderCard title="Data Import">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Import Data Files</p>
                    <p className="text-gray-500 mb-4">Drag and drop files or click to browse</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Select Files
                    </button>
                  </div>
                </PlaceholderCard>
              </Route>
              
              <Route path="/admin">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PlaceholderCard title="User Management" />
                  <PlaceholderCard title="County Configuration" />
                  <PlaceholderCard title="System Settings" />
                  <PlaceholderCard title="Security & Permissions" />
                </div>
              </Route>
              
              <Route path="/system">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PlaceholderCard title="System Health">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Database</span>
                        <span className="text-green-600">Healthy</span>
                      </div>
                      <div className="flex justify-between">
                        <span>API Services</span>
                        <span className="text-green-600">Healthy</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Map Services</span>
                        <span className="text-green-600">Healthy</span>
                      </div>
                    </div>
                  </PlaceholderCard>
                  
                  <PlaceholderCard title="Performance Metrics">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Response Time</span>
                        <span>45ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory Usage</span>
                        <span>72%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Users</span>
                        <span>12</span>
                      </div>
                    </div>
                  </PlaceholderCard>
                </div>
              </Route>
              
              <Route>
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
                  <p className="text-gray-500">The page you're looking for doesn't exist.</p>
                  <Link href="/" className="inline-block mt-4 text-blue-600 hover:underline">
                    Return to Dashboard
                  </Link>
                </div>
              </Route>
            </Switch>
          </main>
        </div>
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </QueryClientProvider>
  );
};

export default App;