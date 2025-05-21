import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../context/auth-context';
import { Button } from '../ui/button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  
  const handleLogout = async () => {
    try {
      await logout();
      // The user will be redirected to login by the authenticated route component
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="text-xl font-bold text-primary">Benton County GIS</a>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/">
                <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === '/' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}>
                  Home
                </a>
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link href="/map">
                    <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.startsWith('/map') ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}>
                      Map
                    </a>
                  </Link>
                  
                  <Link href="/documents">
                    <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.startsWith('/documents') ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}>
                      Documents
                    </a>
                  </Link>
                  
                  <Link href="/workflows">
                    <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.startsWith('/workflows') ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}>
                      Workflows
                    </a>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  {user?.email}
                </div>
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                  {user?.profileImageUrl && (
                    <img 
                      src={user.profileImageUrl} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-full w-full object-cover" 
                    />
                  )}
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};