import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/auth-context';
import { RbacProvider } from './context/rbac-context';
import { WebSocketProvider } from './context/websocket-context';
import { AgentSystemProvider } from './context/agent-system-context';
import AgentWebSocketHandler from './components/agent-system/agent-websocket-handler';

// Import pages
import LandingPage from './pages/landing-page';
import LoginPage from './pages/login-page';
import DirectLoginPage from './pages/direct-login';
import DemoDashboard from './pages/demo-dashboard';
import MapPage from './pages/MapPage';
import DemoDocumentClassification from './pages/demo-document-classification';
import MapElementsAdvisorPage from './pages/map-elements-advisor-page';
import BentonCountyMapPage from './pages/BentonCountyMapPage';
import BentonCountyGISDashboard from './pages/BentonCountyGISDashboard';
import LegalDescriptionPage from './pages/LegalDescriptionPage';
import DocumentScannerPage from './pages/DocumentScannerPage';
import AgentToolsPage from './pages/agent-tools-page';
import SyncDashboardPage from './pages/sync-dashboard-page';
import AchievementsPage from './pages/achievements';
import AgentCollaborationDemo from './pages/agent-collaboration-demo';
import MapEditorPage from './pages/map-editor-page';
import WorkflowsPage from './pages/workflows-page';
import UserProfilePage from './pages/user-profile-page';
import DemoDocumentPanel from './pages/demo-document-panel';
import Dashboard from './pages/dashboard';
import EnhancedLoginPage from './pages/enhanced-login';
import MuskDemoDashboard from './pages/musk-demo-dashboard-simplified';
import MuskDemoNew from './pages/musk-demo-new';
import MuskDemoDashboardSimple from './pages/musk-demo-dashboard-simple';
import MuskDashboardRealData from './pages/musk-dashboard-real-data';
// Admin pages
import UserManagementPage from './pages/admin/user-management';
import AuditLogsPage from './pages/admin/audit-logs';
import AdminDashboardPage from './pages/admin/dashboard';
import { Toaster } from './components/ui/toaster';

// Import our authentication components
import ProtectedRoute from './components/auth/protected-route';
import RoleProtectedRoute from './components/auth/role-protected-route';
import UnauthorizedPage from './pages/unauthorized-page';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RbacProvider>
          <WebSocketProvider>
            <AgentSystemProvider>
              <AgentWebSocketHandler>
                <div className="app">
                  <Switch>
                    {/* Public routes */}
                    <Route path="/" component={LandingPage} />
                    <Route path="/login" component={EnhancedLoginPage} />
                    <Route path="/unauthorized" component={UnauthorizedPage} />
                    
                    {/* Dashboard */}
                    <Route path="/dashboard">
                      {(params) => (
                        <ProtectedRoute component={Dashboard} {...params} />
                      )}
                    </Route>
                    
                    <Route path="/musk-demo">
                      {(params) => (
                        <ProtectedRoute component={MuskDemoDashboard} {...params} />
                      )}
                    </Route>
                    
                    <Route path="/musk-demo-new">
                      {(params) => (
                        <ProtectedRoute component={MuskDemoNew} {...params} />
                      )}
                    </Route>
                    
                    <Route path="/musk-demo-simple">
                      {(params) => (
                        <ProtectedRoute component={MuskDemoDashboardSimple} {...params} />
                      )}
                    </Route>
                    
                    <Route path="/musk-real-data">
                      {(params) => (
                        <ProtectedRoute component={MuskDashboardRealData} {...params} />
                      )}
                    </Route>
                    
                    {/* Protected routes */}
                    <Route path="/map">
                      {(params) => (
                        <ProtectedRoute component={MapPage} {...params} />
                      )}
                    </Route>
                    
                    <Route path="/benton-gis">
                      {(params) => (
                        <ProtectedRoute component={BentonCountyGISDashboard} {...params} />
                      )}
                    </Route>
                    
                    <Route path="/documents">
                      {(params) => (
                        <ProtectedRoute component={DocumentScannerPage} {...params} />
                      )}
                    </Route>
                    
                    <Route path="/workflows">
                      {(params) => (
                        <ProtectedRoute component={WorkflowsPage} {...params} />
                      )}
                    </Route>
                    
                    <Route path="/profile">
                      {(params) => (
                        <ProtectedRoute component={UserProfilePage} {...params} />
                      )}
                    </Route>
                    
                    {/* Admin routes */}
                    <Route path="/admin/user-management">
                      {(params) => (
                        <RoleProtectedRoute 
                          component={UserManagementPage}
                          roles={['admin']}
                          {...params}
                        />
                      )}
                    </Route>
                    
                    <Route path="/admin/audit-logs">
                      {(params) => (
                        <RoleProtectedRoute 
                          component={AuditLogsPage}
                          roles={['admin']}
                          {...params}
                        />
                      )}
                    </Route>
                    
                    <Route path="/admin/dashboard">
                      {(params) => (
                        <RoleProtectedRoute 
                          component={AdminDashboardPage}
                          roles={['admin']}
                          {...params}
                        />
                      )}
                    </Route>
                    
                    {/* Fallback for unknown routes */}
                    <Route>
                      {() => (
                        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                          <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                            <p className="text-gray-600 mb-6">The page you are looking for doesn't exist or has been moved.</p>
                            <button 
                              onClick={() => window.history.back()}
                              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                            >
                              Return to Home
                            </button>
                          </div>
                        </div>
                      )}
                    </Route>
                  </Switch>
                  <Toaster />
                </div>
              </AgentWebSocketHandler>
            </AgentSystemProvider>
          </WebSocketProvider>
        </RbacProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;