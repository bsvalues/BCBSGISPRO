import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/auth-context';
import LandingPage from './pages/landing-page';
import DemoDashboard from './pages/demo-dashboard';
import DemoMapViewer from './pages/demo-map-viewer';
import DemoDocumentClassification from './pages/demo-document-classification';
import MapElementsAdvisorPage from './pages/map-elements-advisor-page';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app">
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/dashboard" component={DemoDashboard} />
            <Route path="/map" component={DemoMapViewer} />
            <Route path="/documents" component={DemoDocumentClassification} />
            <Route path="/map-elements-advisor" component={MapElementsAdvisorPage} />
          </Switch>

          {/* Add navigation link to map elements advisor for testing */}
          <div className="fixed bottom-4 right-4 z-50">
            <a 
              href="/map-elements-advisor" 
              className="bg-primary text-white px-4 py-2 rounded-md shadow-lg hover:bg-primary/90 transition-colors"
            >
              Map Elements Advisor
            </a>
          </div>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;