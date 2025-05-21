/**
 * TerraFusion Platform
 * 
 * Main application entry point that integrates all modules:
 * - CartographyModule (Mapping and visualization)
 * - GAMAValuation (AI-powered property valuation)
 * - ETL (Data import and transformation)
 * - WorkflowUI (Administrative dashboards and workflows)
 * - DevOps (System health monitoring and logging)
 */

import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
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

// Import CartographyModule components
import { CountyMapViewer } from '../apps/CartographyModule/components/map/CountyMapViewer';
import { LayerManager } from '../apps/CartographyModule/components/map/LayerManager';
import { MeasurementTools } from '../apps/CartographyModule/components/map/MeasurementTools';
import { PrintExportPanel } from '../apps/CartographyModule/components/map/PrintExportPanel';

// Import GAMAValuation components
import { LegalDescriptionAnalyzerPanel } from '../apps/GAMAValuation/components/LegalDescriptionAnalyzerPanel';

// Import WorkflowUI components
import { AdminDashboard } from '../libs/WorkflowUI/components/dashboard/AdminDashboard';
import { CountyOnboardingWorkflow } from '../libs/WorkflowUI/components/workflow/CountyOnboardingWorkflow';
import { SystemHealthPanel, ComponentStatus, SystemComponent, SystemAlert } from '../libs/WorkflowUI/components/dashboard/SystemHealthPanel';

// Import ETL components
import { CSVImporter } from '../libs/ETL/importers/csv-importer';

// Import shared types
import { MapProviderType } from '../libs/types/MapProviderType';

// Import DevOps utilities
import { logger } from '../libs/DevOps/utils/logger';

// Create application logger
const appLogger = logger.withTags(['App', 'Main']);

// Mock data for demo purposes
import { 
  mockCounties,
  mockUsers,
  mockSystemComponents,
  mockSystemAlerts,
  mockEvents,
  mockCountyConfig,
  mockDataSources,
  mockValuationSystems,
  mockTaxSystems,
  getDashboardSummary
} from './mockData';

/**
 * User settings
 */
interface UserSettings {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  mapProvider: MapProviderType;
  defaultCountyId: string | null;
}

/**
 * Main App component
 */
const App: React.FC = () => {
  // User authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(mockUsers[0]);
  
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 1024);
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: false,
    sidebarCollapsed: false,
    mapProvider: 'mapbox',
    defaultCountyId: mockCounties[0]?.id || null
  });
  
  // Current county selection
  const [selectedCountyId, setSelectedCountyId] = useState<string | null>(settings.defaultCountyId);
  
  // System health state
  const [systemComponents, setSystemComponents] = useState<SystemComponent[]>(mockSystemComponents);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(mockSystemAlerts);
  
  // Current location from wouter
  const [location, setLocation] = useLocation();
  
  // Effect to handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Effect to log application startup
  useEffect(() => {
    appLogger.info('TerraFusion Platform started', { 
      version: '1.0.0',
      user: currentUser.name,
      location
    });
  }, [currentUser.name, location]);
  
  /**
   * Handle user logout
   */
  const handleLogout = () => {
    setIsAuthenticated(false);
    appLogger.info('User logged out', { userId: currentUser.id });
  };
  
  /**
   * Handle system alert acknowledgement
   */
  const handleAlertAcknowledge = (alertId: string) => {
    setSystemAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true } 
          : alert
      )
    );
    
    appLogger.info('Alert acknowledged', { alertId, userId: currentUser.id });
  };
  
  /**
   * Handle county onboarding save
   */
  const handleCountySave = async (county: any) => {
    // In a real app, this would save to a database
    console.log('Saving county configuration:', county);
    appLogger.info('County configuration saved', { countyId: county.id });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Promise.resolve();
  };
  
  /**
   * Handle county activation
   */
  const handleCountyActivate = async (countyId: string) => {
    // In a real app, this would update the county status in a database
    console.log('Activating county:', countyId);
    appLogger.info('County activated', { countyId });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return Promise.resolve();
  };
  
  /**
   * Handle data source test
   */
  const handleDataSourceTest = async (sourceId: string) => {
    // In a real app, this would test the connection to the data source
    console.log('Testing data source:', sourceId);
    appLogger.info('Data source test', { sourceId });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate 80% success rate
    const success = Math.random() > 0.2;
    
    if (!success) {
      appLogger.error('Data source test failed', { sourceId });
    }
    
    return Promise.resolve(success);
  };
  
  /**
   * Render sidebar navigation
   */
  const renderSidebar = () => (
    <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: '240px',
      backgroundColor: 'white',
      borderRight: '1px solid #e2e8f0',
      transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo and application name */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#0ea5e9',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '20px'
        }}>
          TF
        </div>
        
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>TerraFusion</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>GeoAssessment Platform</div>
        </div>
        
        <button
          onClick={() => setIsSidebarOpen(false)}
          style={{
            marginLeft: 'auto',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Navigation links */}
      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 16px 12px', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
          Main
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {/* Dashboard link */}
          <li>
            <Link href="/">
              <a style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: location === '/' ? '#0f172a' : '#64748b',
                fontWeight: location === '/' ? 'bold' : 'normal',
                textDecoration: 'none',
                borderLeft: location === '/' ? '3px solid #0ea5e9' : '3px solid transparent'
              }}>
                <Home size={20} color={location === '/' ? '#0ea5e9' : '#64748b'} />
                Dashboard
              </a>
            </Link>
          </li>
          
          {/* Map Viewer link */}
          <li>
            <Link href="/map">
              <a style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: location === '/map' ? '#0f172a' : '#64748b',
                fontWeight: location === '/map' ? 'bold' : 'normal',
                textDecoration: 'none',
                borderLeft: location === '/map' ? '3px solid #0ea5e9' : '3px solid transparent'
              }}>
                <Map size={20} color={location === '/map' ? '#0ea5e9' : '#64748b'} />
                Map Viewer
              </a>
            </Link>
          </li>
          
          {/* Property Analysis link */}
          <li>
            <Link href="/analysis">
              <a style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: location === '/analysis' ? '#0f172a' : '#64748b',
                fontWeight: location === '/analysis' ? 'bold' : 'normal',
                textDecoration: 'none',
                borderLeft: location === '/analysis' ? '3px solid #0ea5e9' : '3px solid transparent'
              }}>
                <BarChart2 size={20} color={location === '/analysis' ? '#0ea5e9' : '#64748b'} />
                Property Analysis
              </a>
            </Link>
          </li>
          
          {/* Data Import link */}
          <li>
            <Link href="/import">
              <a style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: location === '/import' ? '#0f172a' : '#64748b',
                fontWeight: location === '/import' ? 'bold' : 'normal',
                textDecoration: 'none',
                borderLeft: location === '/import' ? '3px solid #0ea5e9' : '3px solid transparent'
              }}>
                <Upload size={20} color={location === '/import' ? '#0ea5e9' : '#64748b'} />
                Data Import
              </a>
            </Link>
          </li>
        </ul>
        
        <div style={{ padding: '24px 16px 12px', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
          Administration
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {/* County Management link */}
          <li>
            <Link href="/counties">
              <a style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: location === '/counties' ? '#0f172a' : '#64748b',
                fontWeight: location === '/counties' ? 'bold' : 'normal',
                textDecoration: 'none',
                borderLeft: location === '/counties' ? '3px solid #0ea5e9' : '3px solid transparent'
              }}>
                <Database size={20} color={location === '/counties' ? '#0ea5e9' : '#64748b'} />
                County Management
              </a>
            </Link>
          </li>
          
          {/* System Health link */}
          <li>
            <Link href="/system">
              <a style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: location === '/system' ? '#0f172a' : '#64748b',
                fontWeight: location === '/system' ? 'bold' : 'normal',
                textDecoration: 'none',
                borderLeft: location === '/system' ? '3px solid #0ea5e9' : '3px solid transparent',
                position: 'relative'
              }}>
                <Server size={20} color={location === '/system' ? '#0ea5e9' : '#64748b'} />
                System Health
                
                {/* Alert badge */}
                {systemAlerts.filter(alert => !alert.acknowledged).length > 0 && (
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {systemAlerts.filter(alert => !alert.acknowledged).length}
                  </div>
                )}
              </a>
            </Link>
          </li>
          
          {/* Settings link */}
          <li>
            <Link href="/settings">
              <a style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: location === '/settings' ? '#0f172a' : '#64748b',
                fontWeight: location === '/settings' ? 'bold' : 'normal',
                textDecoration: 'none',
                borderLeft: location === '/settings' ? '3px solid #0ea5e9' : '3px solid transparent'
              }}>
                <Settings size={20} color={location === '/settings' ? '#0ea5e9' : '#64748b'} />
                Settings
              </a>
            </Link>
          </li>
        </ul>
      </nav>
      
      {/* User profile section */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#e0f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0ea5e9',
          fontWeight: 'bold'
        }}>
          {currentUser.name.charAt(0)}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{currentUser.name}</div>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>{currentUser.role}</div>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <LogOut size={16} color="#64748b" />
        </button>
      </div>
    </div>
  );
  
  /**
   * Render header with mobile menu toggle
   */
  const renderHeader = () => (
    <header style={{
      position: 'sticky',
      top: 0,
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      zIndex: 40
    }}>
      <button
        onClick={() => setIsSidebarOpen(true)}
        style={{
          display: isSidebarOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '8px',
          marginRight: '16px',
          cursor: 'pointer'
        }}
      >
        <Menu size={24} color="#64748b" />
      </button>
      
      <div style={{ 
        fontSize: '18px', 
        fontWeight: 'bold',
        marginLeft: isSidebarOpen ? '240px' : '0',
        transition: 'margin-left 0.3s ease'
      }}>
        {location === '/' && 'Dashboard'}
        {location === '/map' && 'Map Viewer'}
        {location === '/analysis' && 'Property Analysis'}
        {location === '/import' && 'Data Import'}
        {location === '/counties' && 'County Management'}
        {location === '/onboarding' && 'County Onboarding'}
        {location === '/system' && 'System Health'}
        {location === '/settings' && 'Settings'}
      </div>
      
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* County selector */}
        <select
          value={selectedCountyId || ''}
          onChange={(e) => setSelectedCountyId(e.target.value || null)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: 'white',
            fontSize: '14px'
          }}
        >
          <option value="">Select County</option>
          {mockCounties
            .filter((county: {id: string; name: string; state: string; status: string}) => county.status === 'active')
            .map((county: {id: string; name: string; state: string}) => (
              <option key={county.id} value={county.id}>
                {county.name}, {county.state}
              </option>
            ))
          }
        </select>
        
        {/* Help button */}
        <button
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#f8fafc',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <HelpCircle size={20} color="#64748b" />
        </button>
        
        {/* Alert indicator */}
        {systemAlerts.filter(alert => !alert.acknowledged).length > 0 && (
          <div style={{
            position: 'relative',
            width: '40px',
            height: '40px'
          }}>
            <button
              onClick={() => setLocation('/system')}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#f8fafc',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <AlertCircle size={20} color="#ef4444" />
            </button>
            
            <div style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {systemAlerts.filter(alert => !alert.acknowledged).length}
            </div>
          </div>
        )}
        
        {/* User avatar (mobile only) */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#e0f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0ea5e9',
          fontWeight: 'bold'
        }}>
          {currentUser.name.charAt(0)}
        </div>
      </div>
    </header>
  );
  
  /**
   * Main application layout
   */
  return (
    <div className="app" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Render sidebar */}
      {renderSidebar()}
      
      {/* Render header */}
      {renderHeader()}
      
      {/* Sidebar backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            display: window.innerWidth >= 1024 ? 'none' : 'block'
          }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Main content area */}
      <main style={{ 
        flex: 1, 
        overflow: 'auto',
        marginLeft: isSidebarOpen && window.innerWidth >= 1024 ? '240px' : '0',
        transition: 'margin-left 0.3s ease',
        backgroundColor: '#f8fafc',
        padding: '24px'
      }}>
        <Switch>
          {/* Dashboard route */}
          <Route path="/">
            <AdminDashboard
              currentUser={currentUser}
              counties={mockCounties}
              users={mockUsers}
              systemComponents={systemComponents}
              systemAlerts={systemAlerts}
              recentEvents={mockEvents}
              dashboardSummary={getDashboardSummary(mockCounties, mockUsers, systemComponents, systemAlerts, mockEvents)}
              onSystemAlertAcknowledge={handleAlertAcknowledge}
              onLogout={handleLogout}
            />
          </Route>
          
          {/* Map viewer route */}
          <Route path="/map">
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 320px',
              gap: '16px',
              height: 'calc(100vh - 145px)'
            }}>
              {/* Map component */}
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <CountyMapViewer
                  provider={settings.mapProvider || 'mapbox'}
                  apiKey="pk.sample.mapbox.token"
                  center={{ lat: 46.2112, lng: -119.2052 }} // Benton County, WA coordinates
                  zoom={10}
                  style={{ width: '100%', height: '100%' }}
                />
                
                {/* Map measurement tools */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                  <MeasurementTools 
                    activeMeasurement={null}
                    onMeasurementComplete={(measurement: any) => console.log('Measurement:', measurement)}
                    defaultLengthUnit="miles"
                    defaultAreaUnit="acres"
                    position="top-right"
                  />
                </div>
              </div>
              
              {/* Map controls & layers panel */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                height: '100%',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  flex: 1,
                  overflow: 'auto',
                  padding: '16px'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                    Layers
                  </h2>
                  <LayerManager
                    availableLayerTypes={[
                      { id: 'vector', name: 'Vector', description: 'Vector layer type', icon: 'layers' },
                      { id: 'raster', name: 'Raster', description: 'Raster layer type', icon: 'image' },
                      { id: 'imagery', name: 'Imagery', description: 'Satellite imagery layer type', icon: 'satellite' },
                      { id: 'terrain', name: 'Terrain', description: 'Terrain layer type', icon: 'mountain' },
                      { id: 'overlay', name: 'Overlay', description: 'Overlay layer type', icon: 'layout' }
                    ]}
                    layers={[
                      { id: 'parcels', name: 'Parcels', type: 'vector', source: 'https://example.com/parcels', visible: true, opacity: 0.8, zIndex: 5 },
                      { id: 'zoning', name: 'Zoning', type: 'vector', source: 'https://example.com/zoning', visible: true, opacity: 0.7, zIndex: 4 },
                      { id: 'imagery', name: 'Satellite Imagery', type: 'raster', source: 'https://example.com/imagery', visible: true, opacity: 1.0, zIndex: 1 },
                      { id: 'terrain', name: 'Terrain', type: 'terrain', source: 'https://example.com/terrain', visible: false, opacity: 0.6, zIndex: 2 },
                      { id: 'overlays', name: 'Overlays', type: 'overlay', source: 'https://example.com/overlays', visible: true, opacity: 0.5, zIndex: 10 }
                    ]}
                    onLayerToggle={(layerId, visible) => console.log('Layer toggle:', layerId, visible)}
                    onLayerOpacityChange={(layerId, opacity) => console.log('Layer opacity:', layerId, opacity)}
                  />
                </div>
                
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  padding: '16px'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                    Export
                  </h2>
                  <PrintExportPanel
                    onExport={(options) => {
                      console.log('Export map with options:', options);
                      return Promise.resolve('export-file-path.png');
                    }}
                    onPrint={(options) => {
                      console.log('Print map with options:', options);
                      return Promise.resolve();
                    }}
                  />
                </div>
              </div>
            </div>
          </Route>
          
          {/* Property analysis route */}
          <Route path="/analysis">
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 400px',
              gap: '16px',
              height: 'calc(100vh - 145px)'
            }}>
              {/* Map component */}
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <CountyMapViewer
                  provider={settings.mapProvider || 'mapbox'}
                  apiKey="pk.sample.mapbox.token"
                  center={{ lat: 46.2112, lng: -119.2052 }} // Benton County, WA coordinates
                  zoom={11}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              
              {/* Analysis panel */}
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'auto',
                padding: '16px'
              }}>
                <LegalDescriptionAnalyzerPanel 
                  onAnalysisComplete={(result: any) => console.log('Analysis result:', result)}
                  apiKey={process.env.OPENAI_API_KEY}
                  defaultOptions={{
                    confidenceThreshold: 0.7,
                    includeGeospatialData: true,
                    generateSimplifiedDescription: true,
                    validateBoundaries: true
                  }}
                />
              </div>
            </div>
          </Route>
          
          {/* Data import route */}
          <Route path="/import">
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
                Data Import
              </h2>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>CSV Import</h3>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>
                    Import property data from CSV files
                  </p>
                  <label 
                    htmlFor="csv-upload"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      marginTop: 'auto'
                    }}
                  >
                    Upload CSV
                  </label>
                  <input id="csv-upload" type="file" accept=".csv" style={{ display: 'none' }} />
                </div>
                
                <div style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Shapefile Import</h3>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>
                    Import GIS data from shapefiles
                  </p>
                  <label 
                    htmlFor="shapefile-upload"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      marginTop: 'auto'
                    }}
                  >
                    Upload Shapefile
                  </label>
                  <input id="shapefile-upload" type="file" accept=".zip,.shp" style={{ display: 'none' }} />
                </div>
                
                <div style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>GeoJSON Import</h3>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>
                    Import GIS data from GeoJSON files
                  </p>
                  <label 
                    htmlFor="geojson-upload"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      marginTop: 'auto'
                    }}
                  >
                    Upload GeoJSON
                  </label>
                  <input id="geojson-upload" type="file" accept=".geojson,.json" style={{ display: 'none' }} />
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <HelpCircle size={20} color="#0ea5e9" />
                <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
                  Upload data for import. Files will be validated and errors will be reported before data is committed.
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Recent Imports
                </h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>File Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>County</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Records</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px' }}>parcels_2023.csv</td>
                      <td style={{ padding: '12px 16px' }}>CSV</td>
                      <td style={{ padding: '12px 16px' }}>Benton, WA</td>
                      <td style={{ padding: '12px 16px' }}>5,427</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          Completed
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>May 21, 2025</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px' }}>zoning_districts.geojson</td>
                      <td style={{ padding: '12px 16px' }}>GeoJSON</td>
                      <td style={{ padding: '12px 16px' }}>Benton, WA</td>
                      <td style={{ padding: '12px 16px' }}>128</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          Completed
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>May 20, 2025</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Route>
          
          {/* County management route */}
          <Route path="/counties">
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  County Management
                </h2>
                
                <Link href="/onboarding">
                  <a style={{
                    backgroundColor: '#0ea5e9',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    Add New County
                  </a>
                </Link>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>County</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>State</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Parcels</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Last Updated</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCounties.map(county => (
                    <tr key={county.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{county.name}</td>
                      <td style={{ padding: '12px 16px' }}>{county.state}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: 
                            county.status === 'active' ? '#dcfce7' :
                            county.status === 'pending' ? '#fef9c3' : 
                            county.status === 'inactive' ? '#fee2e2' : '#f1f5f9',
                          color: 
                            county.status === 'active' ? '#16a34a' :
                            county.status === 'pending' ? '#ca8a04' :
                            county.status === 'inactive' ? '#dc2626' : '#64748b',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}>
                          {county.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{county.properties.parcelCount?.toLocaleString() || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>
                        {new Date(county.lastUpdated).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedCountyId(county.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Route>
          
          {/* County onboarding route */}
          <Route path="/onboarding">
            <CountyOnboardingWorkflow
              county={mockCountyConfig}
              availableDataSources={mockDataSources}
              availableValuationSystems={mockValuationSystems}
              availableTaxSystems={mockTaxSystems}
              onSave={handleCountySave}
              onActivate={handleCountyActivate}
              onCancel={() => setLocation('/counties')}
              onDataSourceTest={handleDataSourceTest}
              onValuationSystemTest={() => Promise.resolve(true)}
              onTaxSystemTest={() => Promise.resolve(true)}
            />
          </Route>
          
          {/* System health route */}
          <Route path="/system">
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
                System Health
              </h2>
              
              <SystemHealthPanel
                components={systemComponents}
                alerts={systemAlerts}
                onAlertAcknowledge={handleAlertAcknowledge}
                refreshInterval={60000}
              />
            </div>
          </Route>
          
          {/* Settings route */}
          <Route path="/settings">
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
                Application Settings
              </h2>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Map Provider
                </h3>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: settings.mapProvider === 'mapbox' ? '#e0f2fe' : '#f8fafc',
                    border: '1px solid',
                    borderColor: settings.mapProvider === 'mapbox' ? '#0ea5e9' : '#e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="map-provider"
                      checked={settings.mapProvider === 'mapbox'}
                      onChange={() => setSettings({ ...settings, mapProvider: 'mapbox' })}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: settings.mapProvider === 'mapbox' ? 'bold' : 'normal' }}>
                      Mapbox
                    </span>
                  </label>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: settings.mapProvider === 'leaflet' ? '#e0f2fe' : '#f8fafc',
                    border: '1px solid',
                    borderColor: settings.mapProvider === 'leaflet' ? '#0ea5e9' : '#e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="map-provider"
                      checked={settings.mapProvider === 'leaflet'}
                      onChange={() => setSettings({ ...settings, mapProvider: 'leaflet' })}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: settings.mapProvider === 'leaflet' ? 'bold' : 'normal' }}>
                      Leaflet
                    </span>
                  </label>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: settings.mapProvider === 'arcgis' ? '#e0f2fe' : '#f8fafc',
                    border: '1px solid',
                    borderColor: settings.mapProvider === 'arcgis' ? '#0ea5e9' : '#e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="map-provider"
                      checked={settings.mapProvider === 'arcgis'}
                      onChange={() => setSettings({ ...settings, mapProvider: 'arcgis' })}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: settings.mapProvider === 'arcgis' ? 'bold' : 'normal' }}>
                      ArcGIS
                    </span>
                  </label>
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Appearance
                </h3>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: !settings.darkMode ? '#e0f2fe' : '#f8fafc',
                    border: '1px solid',
                    borderColor: !settings.darkMode ? '#0ea5e9' : '#e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="theme-mode"
                      checked={!settings.darkMode}
                      onChange={() => setSettings({ ...settings, darkMode: false })}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: !settings.darkMode ? 'bold' : 'normal' }}>
                      Light Mode
                    </span>
                  </label>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: settings.darkMode ? '#e0f2fe' : '#f8fafc',
                    border: '1px solid',
                    borderColor: settings.darkMode ? '#0ea5e9' : '#e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="theme-mode"
                      checked={settings.darkMode}
                      onChange={() => setSettings({ ...settings, darkMode: true })}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: settings.darkMode ? 'bold' : 'normal' }}>
                      Dark Mode
                    </span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Default County
                </h3>
                
                <select
                  value={settings.defaultCountyId || ''}
                  onChange={(e) => setSettings({ ...settings, defaultCountyId: e.target.value || null })}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    width: '100%',
                    maxWidth: '400px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">None (Select on Login)</option>
                  {mockCounties
                    .filter(county => county.status === 'active')
                    .map(county => (
                      <option key={county.id} value={county.id}>
                        {county.name}, {county.state}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
          </Route>
          
          <Route>
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                Page Not Found
              </h2>
              <p style={{ marginBottom: '24px' }}>The page you're looking for doesn't exist.</p>
              <Link href="/">
                <a style={{
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}>
                  Go to Dashboard
                </a>
              </Link>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
};

export default App;