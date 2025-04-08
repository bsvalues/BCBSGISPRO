import React from 'react';
import { Link } from 'wouter';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Search, Bell, User, Settings, Menu } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="glass-panel z-50 relative">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center space-x-2">
            <button className="md:hidden p-1">
              <Menu size={20} className="text-teal-700" />
            </button>
            <Link href="/" className="flex items-center space-x-2">
                <img 
                  src="/attached_assets/BC.png" 
                  alt="Benton County Logo" 
                  className="h-10" 
                />
                <div>
                  <h1 className="font-semibold text-lg leading-none text-teal-700">Benton GeoPro</h1>
                  <p className="text-xs text-teal-600">Geographic Information System</p>
                </div>
            </Link>
          </div>
          
          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <Input 
                type="text" 
                placeholder="Search for addresses, parcels, or owners..." 
                className="w-full bg-white/50 border-gray-200 focus:border-teal-500 pl-10 pr-4"
              />
              <Search 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full text-teal-700 hover:bg-teal-50 hover:text-teal-800"
            >
              <Bell size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full text-teal-700 hover:bg-teal-50 hover:text-teal-800"
            >
              <Settings size={18} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full flex items-center space-x-1 text-teal-700 border-teal-200 hover:bg-teal-50 hover:border-teal-500"
            >
              <User size={16} />
              <span className="hidden md:inline">Account</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;