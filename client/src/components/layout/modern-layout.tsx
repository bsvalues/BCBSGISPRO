import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '../../lib/utils';

interface ModernLayoutProps {
  children: React.ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <a className="flex items-center">
                  <span className="text-xl font-bold text-primary">BentonGeoPro</span>
                </a>
              </Link>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <NavLink href="/" active={isActive('/')}>Home</NavLink>
              <NavLink href="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
              <NavLink href="/map" active={isActive('/map')}>Map</NavLink>
              <NavLink href="/documents" active={isActive('/documents')}>Documents</NavLink>
              <NavLink href="/map-elements-advisor" active={isActive('/map-elements-advisor')}>Map Advisor</NavLink>
            </div>
            
            <div className="flex md:hidden">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button 
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="text-xl font-bold text-primary">BentonGeoPro</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                <MobileNavLink href="/" active={isActive('/')}>Home</MobileNavLink>
                <MobileNavLink href="/dashboard" active={isActive('/dashboard')}>Dashboard</MobileNavLink>
                <MobileNavLink href="/map" active={isActive('/map')}>Map</MobileNavLink>
                <MobileNavLink href="/documents" active={isActive('/documents')}>Documents</MobileNavLink>
                <MobileNavLink href="/map-elements-advisor" active={isActive('/map-elements-advisor')}>Map Advisor</MobileNavLink>
              </nav>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-14"></div>
        </div>
      )}
      
      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p className="font-semibold text-primary text-base mb-1">BentonGeoPro</p>
            <p>© 2025 Benton County Assessor's Office</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Desktop navigation link
const NavLink: React.FC<{ href: string; active: boolean; children: React.ReactNode }> = ({ 
  href, 
  active, 
  children 
}) => {
  return (
    <Link href={href}>
      <a className={cn(
        "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
        active
          ? "border-primary text-gray-900"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      )}>
        {children}
      </a>
    </Link>
  );
};

// Mobile navigation link
const MobileNavLink: React.FC<{ href: string; active: boolean; children: React.ReactNode }> = ({ 
  href, 
  active, 
  children 
}) => {
  return (
    <Link href={href}>
      <a className={cn(
        "block px-3 py-2 rounded-md text-base font-medium",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}>
        {children}
      </a>
    </Link>
  );
};

export default ModernLayout;