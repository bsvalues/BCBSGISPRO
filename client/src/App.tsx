import React from 'react';
import { Route, Switch, Router, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/auth-context';
import { RbacAuthProvider, useRbacAuth } from './context/rbac-auth-context';
import { WebSocketProvider } from './context/websocket-context';
import { AgentSystemProvider } from './context/agent-system-context';
import AgentWebSocketHandler from './components/agent-system/agent-websocket-handler';
import LandingPage from './pages/landing-page';
import LoginPage from './pages/login-page';
import DemoDashboard from './pages/demo-dashboard';
import MapPage from './pages/MapPage';
import DemoDocumentClassification from './pages/demo-document-classification';
import MapElementsAdvisorPage from './pages/map-elements-advisor-page';
import BentonCountyMapPage from './pages/BentonCountyMapPage';
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
import { Toaster } from './components/ui/toaster';

// Modern layout ensures consistent navigation across all pages

// Component to protect routes based on roles
const ProtectedRoute = ({ component: Component, roles, ...rest }: any) => {
  const { user, isAuthenticated, hasRole } = useRbacAuth();
  const [, setLocation] = useLocation();
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    const returnPath = encodeURIComponent(rest.path);
    setLocation(`/login?returnTo=${returnPath}`);
    return null;
  }
  
  // If roles are specified and user doesn't have the required role, deny access
  if (roles && !hasRole(roles)) {
    setLocation('/unauthorized');
    return null;
  }
  
  // Render the component if authorized
  return <Component {...rest} />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RbacAuthProvider>
        <WebSocketProvider>
          {/* The AgentSystemProvider provides access to AI agents via context */}
          <AgentSystemProvider>
            {/* 
              AgentWebSocketHandler manages the WebSocket communication for AI agents
              and processes the Claude API calls
            */}
            <AgentWebSocketHandler>
              <div className="app">
                <Switch>
                  <Route path="/" component={LandingPage} />
                  <Route path="/login" component={LoginPage} />
                  
                  {/* Protected Routes with Role-Based Access */}
                  <Route path="/dashboard">
                    <ProtectedRoute path="/dashboard" roles={['admin', 'staff', 'field']} component={DemoDashboard} />
                  </Route>
                  
                  <Route path="/workflows">
                    <ProtectedRoute path="/workflows" roles={['admin', 'staff', 'field']} component={WorkflowsPage} />
                  </Route>
                  
                  {/* Public map view is available to everyone */}
                  <Route path="/map" component={MapPage} />
                  
                  {/* Map editor requires staff or admin privileges */}
                  <Route path="/map-editor">
                    <ProtectedRoute path="/map-editor" roles={['admin', 'staff']} component={MapEditorPage} />
                  </Route>
                  
                  <Route path="/benton-map" component={BentonCountyMapPage} />
                  
                  <Route path="/legal-description">
                    <ProtectedRoute path="/legal-description" roles={['admin', 'staff', 'field']} component={LegalDescriptionPage} />
                  </Route>
                  
                  <Route path="/documents">
                    <ProtectedRoute path="/documents" roles={['admin', 'staff', 'field']} component={DemoDocumentClassification} />
                  </Route>
                  
                  <Route path="/document-scanner">
                    <ProtectedRoute path="/document-scanner" roles={['admin', 'staff']} component={DocumentScannerPage} />
                  </Route>
                  
                  <Route path="/map-elements-advisor">
                    <ProtectedRoute path="/map-elements-advisor" roles={['admin', 'staff']} component={MapElementsAdvisorPage} />
                  </Route>
                  
                  <Route path="/agent-tools">
                    <ProtectedRoute path="/agent-tools" roles={['admin']} component={AgentToolsPage} />
                  </Route>
                  
                  <Route path="/agent-collaboration">
                    <ProtectedRoute path="/agent-collaboration" roles={['admin', 'staff']} component={AgentCollaborationDemo} />
                  </Route>
                  
                  <Route path="/sync-dashboard">
                    <ProtectedRoute path="/sync-dashboard" roles={['admin', 'staff']} component={SyncDashboardPage} />
                  </Route>
                  
                  <Route path="/achievements">
                    <ProtectedRoute path="/achievements" roles={['admin', 'staff', 'field']} component={AchievementsPage} />
                  </Route>

                  {/* User profile page */}
                  <Route path="/profile">
                    <ProtectedRoute path="/profile" roles={['admin', 'staff', 'field', 'public']} component={UserProfilePage} />
                  </Route>
                  
                  {/* Unauthorized access page */}
                  <Route path="/unauthorized">
                    <div className="flex min-h-screen items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
                        <p className="mb-6">You don't have permission to access this page.</p>
                        <button 
                          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
                          onClick={() => window.location.href = '/'}
                        >
                          Return to Home
                        </button>
                      </div>
                    </div>
                  </Route>
                </Switch>
                <Toaster />
              </div>
            </AgentWebSocketHandler>
          </AgentSystemProvider>
        </WebSocketProvider>
      </RbacAuthProvider>
    </QueryClientProvider>
  );
};

export default App;