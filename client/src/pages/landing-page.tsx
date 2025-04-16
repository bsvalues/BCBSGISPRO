import React from 'react';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/button';
import { demoUsers } from '../data/demo-property-data';

// Rename to LandingPage to reflect its new purpose
const LandingPage: React.FC = () => {
  const { login } = useAuth();
  
  // Function to auto-login with a demo user based on role
  const loginAsDemoUser = (role: string) => {
    const usersWithRole = demoUsers.filter(user => user.role === role);
    if (usersWithRole.length > 0) {
      const demoUser = usersWithRole[0]; // Use the first user of that role
      login(demoUser.username, demoUser.password);
    }
  };
  
  // Group demo accounts by role for feature showcase
  const demoRoles = Array.from(new Set(demoUsers.map(user => user.role)));
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Hero Section */}
      <header className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">BentonGeoPro</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Advanced GIS Workflow Solution for Benton County Assessor's Office
        </p>
      </header>
      
      {/* 24-Hour Demo Banner */}
      <div className="bg-primary/10 py-3 px-4 text-center mb-12">
        <p className="text-primary font-medium">
          <span className="font-bold">24-Hour Assessment Demo</span> - Explore the full capabilities of BentonGeoPro
        </p>
      </div>
      
      {/* Key Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-10">Key Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Advanced Mapping</h3>
            <p className="text-muted-foreground text-center">
              Interactive GIS tools with measurement, drawing, and advanced feature identification capabilities.
            </p>
          </div>
          
          <div className="bg-card shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Document Classification</h3>
            <p className="text-muted-foreground text-center">
              AI-powered document analysis with automatic property identification and metadata extraction.
            </p>
          </div>
          
          <div className="bg-card shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Collaborative Workflows</h3>
            <p className="text-muted-foreground text-center">
              Role-based access control with real-time collaboration features for team coordination.
            </p>
          </div>
        </div>
      </section>
      
      {/* Demo User Selection */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Experience the Demo</h2>
        <p className="text-muted-foreground text-center mb-8">
          Select a role below to explore BentonGeoPro from different perspectives:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoRoles.map((role) => (
            <div key={role} className="bg-card shadow-md rounded-lg overflow-hidden">
              <div className="bg-primary/5 p-4">
                <h3 className="font-semibold text-center">{role}</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4 text-center min-h-[60px]">
                  {role === 'Assessor' && 'View all property assessments and manage county-wide data.'}
                  {role === 'Appraiser' && 'Conduct property valuations and manage assessment records.'}
                  {role === 'GIS Analyst' && 'Work with advanced mapping tools and spatial analysis.'}
                  {role === 'Clerk' && 'Process documents and manage property record workflows.'}
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => loginAsDemoUser(role)}
                >
                  Enter as {role}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Technology Stack */}
      <section className="bg-card py-12 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Powered by Advanced Technology</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="text-primary font-bold">React</span>
              </div>
              <p className="text-sm text-muted-foreground">Modern UI</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="text-primary font-bold">TS</span>
              </div>
              <p className="text-sm text-muted-foreground">TypeScript</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="text-primary font-bold">GIS</span>
              </div>
              <p className="text-sm text-muted-foreground">Mapping API</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="text-primary font-bold">AI</span>
              </div>
              <p className="text-sm text-muted-foreground">Document AI</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="text-primary font-bold">RT</span>
              </div>
              <p className="text-sm text-muted-foreground">Real-time</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-background py-8 px-4 border-t">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-semibold text-primary text-lg mb-2">BentonGeoPro</p>
          <p className="text-muted-foreground mb-4">24-Hour Assessment Demo | © 2025</p>
          <p className="text-sm text-muted-foreground">
            Built with advanced geospatial technology for Benton County Assessor's Office
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;