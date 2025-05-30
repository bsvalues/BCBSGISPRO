import React from 'react';
import { useAuth } from '../context/auth-context';
import { useRbac } from '../context/rbac-context';
import { Link } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { 
  UserCircle, 
  FileText, 
  Map, 
  Users, 
  ShieldCheck, 
  FileEdit, 
  Settings, 
  LogOut 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { hasRole } = useRbac();
  
  // Check user roles
  const isAdmin = hasRole('admin');
  const isStaff = hasRole('staff');
  const isField = hasRole('field');
  
  // Only authenticated users can access the dashboard
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Welcome to Benton County GIS</h1>
        <p className="mb-8">Please log in to access the system.</p>
        <a href="/api/login" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Log In
        </a>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.firstName || 'User'}</h1>
          <p className="text-gray-600">Benton County GIS Workflow Assistant</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Link to="/profile">
            <Button variant="outline">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
          <a href="/api/logout">
            <Button variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Common Cards - Available to all authenticated users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Map className="mr-2 h-5 w-5" />
              Map Viewer
            </CardTitle>
            <CardDescription>
              View and interact with geographic data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Access maps, search parcels, and view property information.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Open Map Viewer
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Document Viewer
            </CardTitle>
            <CardDescription>
              Access property documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Search, view, and download property-related documents.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Browse Documents
            </Button>
          </CardFooter>
        </Card>
        
        {/* Staff & Admin Cards */}
        {(isStaff || isAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileEdit className="mr-2 h-5 w-5" />
                Workflow Management
              </CardTitle>
              <CardDescription>
                Manage assessment workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create, assign, and track workflow progress.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Manage Workflows
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Field Staff Cards */}
        {isField && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Map className="mr-2 h-5 w-5" />
                Field Tools
              </CardTitle>
              <CardDescription>
                Field data collection tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Capture field notes, photos, and measurements.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Open Field Tools
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Admin Only Cards */}
        {isAdmin && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage system users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Add, edit, and manage user accounts and permissions.</p>
              </CardContent>
              <CardFooter>
                <Link to="/admin/user-management">
                  <Button variant="outline" className="w-full">
                    Manage Users
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Security Audit
                </CardTitle>
                <CardDescription>
                  System audit logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>View security logs and monitor system activity.</p>
              </CardContent>
              <CardFooter>
                <Link to="/admin/audit-logs">
                  <Button variant="outline" className="w-full">
                    View Audit Logs
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Manage system configuration and preferences.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Open Settings
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;