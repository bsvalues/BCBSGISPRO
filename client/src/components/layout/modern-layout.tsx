import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '../../lib/utils';
import { 
  Map, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  Users, 
  Database, 
  Menu, 
  X, 
  Home,
  AlertCircle,
  Workflow,
  FileCheck,
  Layers,
  PanelLeftClose
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';

interface ModernLayoutProps {
  children: React.ReactNode;
}

// Group navigation items for better organization
const navigationItems = [
  {
    group: 'Main',
    items: [
      { href: '/', label: 'Home', icon: <Home className="w-5 h-5 mr-2" /> },
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-2" /> },
      { href: '/workflows', label: 'Workflows', icon: <Workflow className="w-5 h-5 mr-2" /> },
    ]
  },
  {
    group: 'Assessment',
    items: [
      { href: '/documents', label: 'Documents', icon: <FileText className="w-5 h-5 mr-2" /> },
      { href: '/legal-description', label: 'Legal Description', icon: <FileCheck className="w-5 h-5 mr-2" /> },
    ]
  },
  {
    group: 'Maps',
    items: [
      { href: '/benton-map', label: 'Benton County Map', icon: <Map className="w-5 h-5 mr-2" /> },
      { href: '/map-editor', label: 'Map Editor', icon: <Layers className="w-5 h-5 mr-2" /> },
      { href: '/map-elements-advisor', label: 'Map Advisor', icon: <AlertCircle className="w-5 h-5 mr-2" /> },
    ]
  },
  {
    group: 'Tools',
    items: [
      { href: '/legal-description', label: 'Legal Description', icon: <FileCheck className="w-5 h-5 mr-2" /> },
      { href: '/document-scanner', label: 'Document Scanner', icon: <FileText className="w-5 h-5 mr-2" /> },
      { href: '/sync-dashboard', label: 'Sync Dashboard', icon: <Database className="w-5 h-5 mr-2" /> },
      { href: '/agent-tools', label: 'AI Assistant', icon: <Users className="w-5 h-5 mr-2" /> },
    ]
  }
];

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 md:hidden focus:outline-none mr-2"
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <span className="text-xl font-bold text-primary">TerraFusion</span>
                  <Badge variant="outline" className="ml-2">Benton County</Badge>
                </div>
              </Link>
            </div>
            
            {/* User profile and actions */}
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/settings">
                      <Settings className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.fullName || user?.username || 'User'} />
                <AvatarFallback>{user?.fullName?.[0] || user?.username?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className={cn(
          "hidden md:flex md:flex-col bg-white border-r transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "md:w-16" : "md:w-64"
        )}>
          <div className="flex flex-col h-full">
            <div className="border-b p-2 flex justify-end">
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeftClose className={cn("h-5 w-5 transition-transform", sidebarCollapsed ? "rotate-180" : "")} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-6 px-2">
                {navigationItems.map((group) => (
                  <div key={group.group} className="space-y-1">
                    {!sidebarCollapsed && (
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {group.group}
                      </p>
                    )}
                    {group.items.map((item) => (
                      <TooltipProvider key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={item.href}>
                              <div className={cn(
                                "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                                isActive(item.href) 
                                  ? "bg-primary/10 text-primary" 
                                  : "text-gray-700 hover:bg-gray-100"
                              )}>
                                {item.icon}
                                {!sidebarCollapsed && item.label}
                              </div>
                            </Link>
                          </TooltipTrigger>
                          {sidebarCollapsed && (
                            <TooltipContent side="right">
                              <p>{item.label}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
        
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75" 
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            ></div>
            
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
                  aria-label="Close sidebar"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4 mb-4 border-b pb-4">
                  <span className="text-xl font-bold text-primary">TerraFusion</span>
                  <Badge variant="outline" className="ml-2">Benton County</Badge>
                </div>
                
                <nav className="space-y-6 px-2">
                  {navigationItems.map((group) => (
                    <div key={group.group} className="space-y-1">
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {group.group}
                      </p>
                      {group.items.map((item) => (
                        <Link key={item.href} href={item.href}>
                          <div 
                            className={cn(
                              "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                              isActive(item.href) 
                                ? "bg-primary/10 text-primary" 
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {item.icon}
                            {item.label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
            
            <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
          </div>
        )}
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-gray-500 text-sm">
            <p className="font-semibold text-primary text-base mb-1">TerraFusion Platform</p>
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
      <div className={cn(
        "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer",
        active
          ? "border-primary text-gray-900"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      )}>
        {children}
      </div>
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
      <div className={cn(
        "block px-3 py-2 rounded-md text-base font-medium cursor-pointer",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}>
        {children}
      </div>
    </Link>
  );
};

export { ModernLayout };
export default ModernLayout;