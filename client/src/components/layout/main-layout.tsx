import React, { ReactNode } from 'react';
import { Navbar } from './navbar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-white border-t py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-500 text-sm text-center">
            &copy; {new Date().getFullYear()} Benton County GIS Workflow Assistant
          </p>
        </div>
      </footer>
    </div>
  );
};