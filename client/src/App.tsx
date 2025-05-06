import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/auth-context';
import LandingPage from './pages/landing-page';
import DemoDashboard from './pages/demo-dashboard';
import MapPage from './pages/MapPage';
import DemoDocumentClassification from './pages/demo-document-classification';
import MapElementsAdvisorPage from './pages/map-elements-advisor-page';
import BentonCountyMapPage from './pages/BentonCountyMapPage';

// Modern layout ensures consistent navigation across all pages

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app">
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/dashboard" component={DemoDashboard} />
            <Route path="/map" component={MapPage} />
            <Route path="/benton-map" component={BentonCountyMapPage} />
            <Route path="/documents" component={DemoDocumentClassification} />
            <Route path="/map-elements-advisor" component={MapElementsAdvisorPage} />
          </Switch>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;