import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/auth-context';
import { WebSocketProvider } from './context/websocket-context';
import { AgentSystemProvider } from './context/agent-system-context';
import AgentWebSocketHandler from './components/agent-system/agent-websocket-handler';
import LandingPage from './pages/landing-page';
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
import { Toaster } from './components/ui/toaster';

// Modern layout ensures consistent navigation across all pages

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
                  <Route path="/dashboard" component={DemoDashboard} />
                  <Route path="/map" component={MapPage} />
                  <Route path="/benton-map" component={BentonCountyMapPage} />
                  <Route path="/legal-description" component={LegalDescriptionPage} />
                  <Route path="/documents" component={DemoDocumentClassification} />
                  <Route path="/document-scanner" component={DocumentScannerPage} />
                  <Route path="/map-elements-advisor" component={MapElementsAdvisorPage} />
                  <Route path="/agent-tools" component={AgentToolsPage} />
                  <Route path="/sync-dashboard" component={SyncDashboardPage} />
                  <Route path="/achievements" component={AchievementsPage} />
                </Switch>
                <Toaster />
              </div>
            </AgentWebSocketHandler>
          </AgentSystemProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;