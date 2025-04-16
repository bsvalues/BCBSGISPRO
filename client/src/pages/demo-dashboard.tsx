import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/button';
import { 
  residentialProperties, 
  commercialProperties, 
  agriculturalProperties, 
  demoCollaborationProjects, 
  demoDocuments 
} from '../data/demo-property-data';

const DemoDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
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

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const propertyCount = {
    residential: residentialProperties.length,
    commercial: commercialProperties.length,
    agricultural: agriculturalProperties.length,
    total: residentialProperties.length + commercialProperties.length + agriculturalProperties.length
  };

  const renderOverviewTab = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Property Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 rounded-md p-3">
            <p className="text-sm font-medium mb-1">Residential</p>
            <p className="text-2xl font-bold">{propertyCount.residential}</p>
          </div>
          <div className="bg-primary/5 rounded-md p-3">
            <p className="text-sm font-medium mb-1">Commercial</p>
            <p className="text-2xl font-bold">{propertyCount.commercial}</p>
          </div>
          <div className="bg-primary/5 rounded-md p-3">
            <p className="text-sm font-medium mb-1">Agricultural</p>
            <p className="text-2xl font-bold">{propertyCount.agricultural}</p>
          </div>
          <div className="bg-primary/5 rounded-md p-3">
            <p className="text-sm font-medium mb-1">Total</p>
            <p className="text-2xl font-bold">{propertyCount.total}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
        <div className="space-y-3">
          {demoCollaborationProjects.slice(0, 3).map(project => (
            <div key={project.id} className="border-b pb-2 last:border-b-0">
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-muted-foreground">{project.status === 'active' ? 'Active' : 'Planning'} • {project.parcels.length} parcels</p>
            </div>
          ))}
        </div>
        <Link href="/map-viewer">
          <Button variant="ghost" className="mt-4 w-full">View All Properties</Button>
        </Link>
      </div>
      
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Document Management</h3>
        <div className="space-y-3">
          <div className="bg-primary/5 rounded-md p-3">
            <p className="text-sm font-medium mb-1">Total Documents</p>
            <p className="text-2xl font-bold">{demoDocuments.length}</p>
          </div>
          <div className="text-sm">
            <p className="font-medium">Recent Documents</p>
            <ul className="mt-2 space-y-2">
              {demoDocuments.slice(0, 3).map(doc => (
                <li key={doc.id} className="truncate">
                  {doc.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link href="/document-classification">
          <Button variant="ghost" className="mt-4 w-full">Document Center</Button>
        </Link>
      </div>
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Active Projects</h3>
        <Button variant="outline" size="sm">New Project</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {demoCollaborationProjects.map(project => (
          <div key={project.id} className="bg-card shadow rounded-lg p-5 border border-border">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-medium truncate">{project.name}</h4>
              <div className={`px-2 py-1 text-xs rounded-full ${
                project.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {project.status === 'active' ? 'Active' : 'Planning'}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>Created: {new Date(project.createdDate).toLocaleDateString()}</div>
              <div>Due: {new Date(project.dueDate).toLocaleDateString()}</div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">Details</Button>
              <Button size="sm" className="flex-1">Open</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Document Library</h3>
        <Button variant="outline" size="sm">Upload Document</Button>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Parcel ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Upload Date</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {demoDocuments.slice(0, 5).map((document) => (
              <tr key={document.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{document.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{document.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{document.parcelId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(document.uploadDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href="/document-classification">
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-center">
        <Link href="/document-classification">
          <Button>View All Documents</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user.fullName}</h1>
        <p className="text-muted-foreground">{getCurrentDate()} • {user.role}</p>
      </div>
      
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'projects' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'documents' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>
      
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'projects' && renderProjectsTab()}
      {activeTab === 'documents' && renderDocumentsTab()}
    </div>
  );
};

export default DemoDashboard;