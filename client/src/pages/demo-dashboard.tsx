import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { demoProperties, propertyStatistics } from '../data/demo-property-data';
import { formatCurrency } from '../lib/utils';

// Basic dashboard component to show property statistics
const DemoDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-primary">BentonGeoPro</h1>
            <nav className="ml-10 flex space-x-4">
              <Link href="/dashboard">
                <span className="px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary cursor-pointer">
                  Dashboard
                </span>
              </Link>
              <Link href="/map">
                <span className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  Map Viewer
                </span>
              </Link>
              <Link href="/documents">
                <span className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  Documents
                </span>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-muted-foreground">{user.role}</p>
                </div>
                <button 
                  onClick={logout}
                  className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome, {user?.fullName}</h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Properties</h3>
            <p className="text-3xl font-bold">{propertyStatistics.totalProperties}</p>
            <p className="text-xs text-muted-foreground mt-2">Across Benton County</p>
          </div>
          
          <div className="bg-card shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Assessed Value</h3>
            <p className="text-3xl font-bold">{formatCurrency(propertyStatistics.totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-2">Combined property value</p>
          </div>
          
          <div className="bg-card shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Value</h3>
            <p className="text-3xl font-bold">{formatCurrency(propertyStatistics.averageValue)}</p>
            <p className="text-xs text-muted-foreground mt-2">Per property</p>
          </div>
          
          <div className="bg-card shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Property Types</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(propertyStatistics.byType).map(([type, count]) => (
                <div key={type} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                  {type}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-card shadow rounded-lg mb-8">
          <div className="px-5 py-4 border-b">
            <h3 className="text-lg font-medium">Recent Activity</h3>
          </div>
          <div className="px-5 py-3">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-3">Parcel ID</th>
                  <th className="px-3 py-3">Activity</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {propertyStatistics.recentUpdates.map((update) => (
                  <tr key={update.id}>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{update.parcelId}</td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{update.type}</td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{update.date}</td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{update.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Property List */}
        <div className="bg-card shadow rounded-lg">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Properties</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs rounded-md bg-primary/10 text-primary">
                Export
              </button>
              <button className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground">
                Add Property
              </button>
            </div>
          </div>
          <div className="px-5 py-3">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-3">Parcel ID</th>
                  <th className="px-3 py-3">Address</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Assessed Value</th>
                  <th className="px-3 py-3">Acres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoProperties.slice(0, 5).map((property) => (
                  <tr key={property.id}>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{property.parcelId}</td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{property.address}</td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{property.type}</td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{formatCurrency(property.assessedValue)}</td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">{property.acres.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="py-3 px-3 text-center text-sm text-muted-foreground">
              <span className="text-primary hover:underline cursor-pointer">View all properties</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoDashboard;