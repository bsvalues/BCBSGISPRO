import React, { useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { AuthProvider } from './context/auth-context';
import { useAuth } from './context/auth-context';

// Import page components
import LoginPage from './pages/login-page';
import DemoDashboard from './pages/demo-dashboard';
import DemoMapViewer from './pages/demo-map-viewer';
import DemoDocumentClassification from './pages/demo-document-classification';

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  if (!user) return null;
  
  return (
    <nav className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <a className="font-semibold text-lg">BentonGeoPro</a>
            </Link>
            <div className="hidden md:flex space-x-2">
              <Link href="/dashboard">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === '/dashboard' 
                    ? 'bg-primary-foreground/20' 
                    : 'hover:bg-primary-foreground/10'
                }`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/map-viewer">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === '/map-viewer' 
                    ? 'bg-primary-foreground/20' 
                    : 'hover:bg-primary-foreground/10'
                }`}>
                  Map Viewer
                </a>
              </Link>
              <Link href="/document-classification">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === '/document-classification' 
                    ? 'bg-primary-foreground/20' 
                    : 'hover:bg-primary-foreground/10'
                }`}>
                  Documents
                </a>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="hidden md:inline">Logged in as </span>
              <span className="font-medium">{user.fullName}</span>
              <span className="hidden md:inline"> ({user.role})</span>
            </div>
            <button 
              onClick={() => logout()}
              className="bg-primary-foreground/10 hover:bg-primary-foreground/20 px-3 py-1 rounded-md text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-muted py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Benton County Assessor's Office. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  // Check for URL path to conditionally render navbar/footer
  const [location] = useLocation();
  const isLoginPage = location === '/';
  
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        {!isLoginPage && <NavBar />}
        <main className="flex-grow">
          <Switch>
            <Route path="/" component={LoginPage} />
            <Route path="/dashboard" component={DemoDashboard} />
            <Route path="/map-viewer" component={DemoMapViewer} />
            <Route path="/document-classification" component={DemoDocumentClassification} />
            <Route>
              {/* 404 Not Found Page */}
              <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
                  <p className="mb-6">The page you are looking for doesn't exist or has been moved.</p>
                  <Link href="/dashboard">
                    <a className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      Go to Dashboard
                    </a>
                  </Link>
                </div>
              </div>
            </Route>
          </Switch>
        </main>
        {!isLoginPage && <Footer />}
      </div>
    </AuthProvider>
  );
};

export default App;