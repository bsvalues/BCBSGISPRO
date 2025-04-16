import React from 'react';
import { Route, Switch } from 'wouter';
import { AuthProvider } from './context/auth-context';
import LandingPage from './pages/landing-page';
import DemoDashboard from './pages/demo-dashboard';
import DemoMapViewer from './pages/demo-map-viewer';
import DemoDocumentClassification from './pages/demo-document-classification';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={DemoDashboard} />
        <Route path="/map" component={DemoMapViewer} />
        <Route path="/documents" component={DemoDocumentClassification} />
      </Switch>
    </AuthProvider>
  );
};

export default App;