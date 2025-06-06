import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import MainLayout from './components/layout/MainLayout';
import TerraFusionDashboard from './pages/TerraFusionDashboard';
import CountyManagement from './pages/CountyManagement';
import DataImport from './pages/DataImport';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Switch>
          <Route path="/">
            <TerraFusionDashboard />
          </Route>
          
          <Route path="/counties">
            <CountyManagement />
          </Route>
          
          <Route path="/import">
            <DataImport />
          </Route>
        </Switch>
      </MainLayout>
    </QueryClientProvider>
  );
};

export default App;