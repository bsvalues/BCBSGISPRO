import React from 'react';
import { Link, useLocation } from 'wouter';
// Utility function for conditionally joining classNames
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
import { 
  MapPin, 
  Layers, 
  FileText, 
  Home, 
  BarChart,
  Users,
  Settings,
  Network
} from 'lucide-react';

const Navigation: React.FC = () => {
  const [location] = useLocation();
  
  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MapPin, label: 'Maps', path: '/maps' },
    { icon: Layers, label: 'Layers', path: '/layers' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: BarChart, label: 'Reports', path: '/reports' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: Network, label: 'WebSocket Test', path: '/websocket-test' },
  ];
  
  return (
    <nav className="glass-panel z-40 relative px-4 py-1 flex justify-center">
      <ul className="flex space-x-2">
        {navigationItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all duration-200",
                    isActive 
                      ? "bg-teal-100 text-teal-700 shadow-sm" 
                      : "text-gray-600 hover:bg-teal-50 hover:text-teal-600"
                  )}
                >
                  <item.icon size={16} />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;