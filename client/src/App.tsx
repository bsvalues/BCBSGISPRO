import React from 'react';
import { Route, Switch, Link } from 'wouter';
import { AuthProvider } from './context/auth-context';
import LoginPage from './pages/login-page';
import DemoDashboard from './pages/demo-dashboard';
import DemoMapViewer from './pages/demo-map-viewer';
import DemoDocumentClassification from './pages/demo-document-classification';
import { Button } from './components/ui/button';

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1">
          <Switch>
            <Route path="/" component={LoginPage} />
            <Route path="/dashboard" component={DemoDashboard} />
            <Route path="/map-viewer" component={DemoMapViewer} />
            <Route path="/document-classification" component={DemoDocumentClassification} />
            <Route>
              <NotFoundPage />
            </Route>
          </Switch>
        </main>
        <AppFooter />
      </div>
    </AuthProvider>
  );
};

// App Header with Navigation
const AppHeader: React.FC = () => {
  return (
    <header className="bg-primary py-4 px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-primary-foreground" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <h1 className="text-xl font-bold text-primary-foreground">BentonGeoPro</h1>
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground/80">
                  Dashboard
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/map-viewer">
                <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground/80">
                  Map Viewer
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/document-classification">
                <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground/80">
                  Documents
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

// App Footer
const AppFooter: React.FC = () => {
  return (
    <footer className="bg-accent py-4 px-6 text-accent-foreground">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm">
          BentonGeoPro - 24 Hour Demo - {new Date().getFullYear()} © Benton County Assessor's Office
        </p>
        <p className="text-xs mt-1">
          GIS-powered property assessment solutions
        </p>
      </div>
    </footer>
  );
};

// 404 Page
const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] px-4">
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/dashboard">
        <Button>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default App;