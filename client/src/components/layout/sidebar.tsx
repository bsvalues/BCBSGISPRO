import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { workflowTypeLabels, WorkflowType, workflowTypeIcons } from '@/lib/workflow-types';
import { HelpCircle } from 'lucide-react';

type SidebarProps = {
  activeModule?: string;
};

type NavItem = {
  path: string;
  label: string;
  icon: string;
};

export function Sidebar({ activeModule }: SidebarProps) {
  const [location] = useLocation();
  const [showAssistant, setShowAssistant] = useState(false);
  
  // Define workflow navigation items
  const workflowNavItems: NavItem[] = Object.entries(workflowTypeLabels).map(([type, label]) => ({
    path: `/workflow/${type}`,
    label,
    icon: workflowTypeIcons[type as WorkflowType]
  }));
  
  // Define tool navigation items
  const toolNavItems: NavItem[] = [
    { path: '/map-viewer', label: 'Map Viewer', icon: 'layer-group' },
    { path: '/geospatial-analysis', label: 'Geospatial Analysis', icon: 'shapes' },
    { path: '/parcel-generator', label: 'Parcel ID Generator', icon: 'hashtag' },
    { path: '/property-search', label: 'Property Search', icon: 'search' },
    { path: '/document-classification', label: 'Document Classifier', icon: 'brain' }
  ];
  
  // Helper function to get Font Awesome icon
  const getIcon = (iconName: string) => {
    return <i className={`fas fa-${iconName} mr-3`} />;
  };
  
  // Check if a path is active
  const isPathActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };
  
  return (
    <aside className="bg-white w-64 border-r border-neutral-200 flex flex-col h-full">
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-4">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Workflows</h2>
          {workflowNavItems.map((item) => (
            <div 
              key={item.path} 
              onClick={() => window.location.href = item.path} 
              className={cn(
                "mt-1 group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full cursor-pointer",
                isPathActive(item.path)
                  ? "text-primary-600 bg-primary-50"
                  : "text-neutral-700 hover:text-primary-600 hover:bg-primary-50"
              )}
            >
              <span className={cn(
                "mr-3",
                isPathActive(item.path)
                  ? "text-primary-500"
                  : "text-neutral-400 group-hover:text-primary-500"
              )}>
                {getIcon(item.icon)}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        
        <div className="px-4 mb-4">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tools</h2>
          {toolNavItems.map((item) => (
            <div 
              key={item.path} 
              onClick={() => window.location.href = item.path} 
              className={cn(
                "mt-1 group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full cursor-pointer",
                isPathActive(item.path)
                  ? "text-primary-600 bg-primary-50"
                  : "text-neutral-700 hover:text-primary-600 hover:bg-primary-50"
              )}
            >
              <span className={cn(
                "mr-3",
                isPathActive(item.path)
                  ? "text-primary-500"
                  : "text-neutral-400 group-hover:text-primary-500"
              )}>
                {getIcon(item.icon)}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </nav>
      
      {/* Help & Resources */}
      <div className="p-4 border-t border-neutral-200">
        <Button 
          variant="ghost" 
          className="flex w-full items-center justify-start space-x-2 text-sm text-primary-600 hover:text-primary-800"
          onClick={() => setShowAssistant(!showAssistant)}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help & Resources</span>
        </Button>
        
        {showAssistant && (
          <div className="mt-2 p-3 bg-secondary-50 rounded-md text-xs">
            <p className="font-medium text-secondary-700">Need assistance?</p>
            <p className="mt-1 text-neutral-600">Ask our assistant or check our documentation below.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full bg-white text-secondary-600 border-secondary-200 hover:bg-secondary-100"
            >
              Open Assistant
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
