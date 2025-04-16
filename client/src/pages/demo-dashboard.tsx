import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/button';
import { demoProperties } from '../data/demo-property-data';

const DemoDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Filter properties by type
  const residentialProperties = demoProperties.filter(p => p.propertyType === 'Residential');
  const commercialProperties = demoProperties.filter(p => p.propertyType === 'Commercial');
  const agriculturalProperties = demoProperties.filter(p => p.propertyType === 'Agricultural');
  const vacantLandProperties = demoProperties.filter(p => p.propertyType === 'Vacant Land');
  
  // Calculate statistics
  const totalAssessedValue = demoProperties.reduce((sum, prop) => sum + prop.assessedValue, 0);
  const totalMarketValue = demoProperties.reduce((sum, prop) => sum + prop.marketValue, 0);
  const totalLandArea = demoProperties.reduce((sum, prop) => sum + prop.landArea, 0);
  
  // Simulate recent activity data
  useEffect(() => {
    // This would normally come from an API
    const mockActivity = [
      {
        id: 'act-001',
        type: 'Assessment Update',
        parcelId: '11525',
        user: 'Mary Johnson',
        timestamp: new Date(2025, 3, 15, 9, 30),
        details: 'Updated market value from $435,000 to $450,000'
      },
      {
        id: 'act-002',
        type: 'Document Upload',
        parcelId: '11526',
        user: 'Amanda Brown',
        timestamp: new Date(2025, 3, 15, 11, 15),
        details: 'Uploaded survey document'
      },
      {
        id: 'act-003',
        type: 'Property Inspection',
        parcelId: '11527',
        user: 'Mary Johnson',
        timestamp: new Date(2025, 3, 14, 15, 45),
        details: 'Completed field inspection of agricultural property'
      },
      {
        id: 'act-004',
        type: 'Map Update',
        parcelId: 'Multiple',
        user: 'Robert Williams',
        timestamp: new Date(2025, 3, 14, 14, 20),
        details: 'Updated zoning map for South Corvallis area'
      },
      {
        id: 'act-005',
        type: 'Appeal Filed',
        parcelId: '11529',
        user: 'John Smith',
        timestamp: new Date(2025, 3, 13, 10, 0),
        details: 'Property owner filed assessment appeal'
      }
    ];
    
    setRecentActivity(mockActivity);
  }, []);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">Please log in to access this page.</p>
          <Link href="/">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}. Here's an overview of Benton County property data.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Property Count</h3>
          <p className="text-3xl font-bold">{demoProperties.length}</p>
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex justify-between mb-1">
              <span>Residential</span>
              <span>{residentialProperties.length}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Commercial</span>
              <span>{commercialProperties.length}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Agricultural</span>
              <span>{agriculturalProperties.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Vacant Land</span>
              <span>{vacantLandProperties.length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-card shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Assessed Value</h3>
          <p className="text-3xl font-bold">
            ${(totalAssessedValue / 1000000).toFixed(2)}M
          </p>
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2 mb-1">
              <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="text-sm text-muted-foreground">
              85% of annual target
            </p>
          </div>
        </div>
        
        <div className="bg-card shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Market Value</h3>
          <p className="text-3xl font-bold">
            ${(totalMarketValue / 1000000).toFixed(2)}M
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="flex items-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              5.2% increase from previous year
            </p>
          </div>
        </div>
        
        <div className="bg-card shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Land Area</h3>
          <p className="text-3xl font-bold">
            {totalLandArea.toFixed(1)} acres
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex justify-between mb-1">
              <span>Agricultural</span>
              <span>{agriculturalProperties.reduce((sum, p) => sum + p.landArea, 0).toFixed(1)} ac</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Residential</span>
              <span>{residentialProperties.reduce((sum, p) => sum + p.landArea, 0).toFixed(1)} ac</span>
            </div>
            <div className="flex justify-between">
              <span>Commercial</span>
              <span>{commercialProperties.reduce((sum, p) => sum + p.landArea, 0).toFixed(1)} ac</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Activity</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Parcel ID</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentActivity.map((activity) => (
                    <tr key={activity.id} className="hover:bg-muted/50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm">{activity.type}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">{activity.parcelId}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">{activity.user}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {activity.timestamp.toLocaleString()}
                      </td>
                      <td className="px-3 py-4 text-sm">{activity.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All Activity
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-card shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/map-viewer">
                <Button className="w-full mb-2" variant="outline">
                  Open Map Viewer
                </Button>
              </Link>
              <Link href="/document-classification">
                <Button className="w-full mb-2" variant="outline">
                  Process Documents
                </Button>
              </Link>
              <Button className="w-full mb-2" variant="outline">
                Generate Reports
              </Button>
              <Button className="w-full" variant="outline">
                Search Properties
              </Button>
            </div>
          </div>
          
          <div className="bg-card shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Property Types</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Residential</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((residentialProperties.length / demoProperties.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(residentialProperties.length / demoProperties.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Commercial</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((commercialProperties.length / demoProperties.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${(commercialProperties.length / demoProperties.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Agricultural</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((agriculturalProperties.length / demoProperties.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(agriculturalProperties.length / demoProperties.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Vacant Land</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((vacantLandProperties.length / demoProperties.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full" 
                    style={{ width: `${(vacantLandProperties.length / demoProperties.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoDashboard;