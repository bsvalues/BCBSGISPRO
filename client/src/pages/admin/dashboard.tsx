import React, { useState, useEffect } from 'react';
import { useRbac } from '../../context/rbac-context';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Activity, Users, FileText, ShieldAlert, Settings } from 'lucide-react';

// Mock data for admin dashboard demonstration
const recentLogins = [
  { id: 1, userId: 'email-1', name: 'Admin User', action: 'login_success', timestamp: '2023-05-22T10:30:45Z', ipAddress: '192.168.1.1' },
  { id: 2, userId: 'google-2', name: 'Staff User', action: 'login_success', timestamp: '2023-05-22T09:15:22Z', ipAddress: '192.168.1.2' },
  { id: 3, userId: 'github-3', name: 'Field User', action: 'login_success', timestamp: '2023-05-21T16:45:10Z', ipAddress: '192.168.1.3' },
];

const recentActions = [
  { id: 1, userId: 'email-1', name: 'Admin User', action: 'role_change', details: 'Changed email-4 from readonly to staff', timestamp: '2023-05-22T11:30:45Z' },
  { id: 2, userId: 'google-2', name: 'Staff User', action: 'document_upload', details: 'Uploaded deed.pdf', timestamp: '2023-05-22T10:22:33Z' },
  { id: 3, userId: 'github-3', name: 'Field User', action: 'workflow_create', details: 'Created field inspection workflow', timestamp: '2023-05-21T14:15:10Z' },
];

const systemStats = {
  totalUsers: 12,
  activeUsers: 8,
  documentsProcessed: 156,
  workflowsActive: 23,
  securityEvents: 4
};

const AdminDashboard: React.FC = () => {
  const { hasRole } = useRbac();
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Check if user has admin role
  const isAdmin = hasRole('admin');
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // If user is not an admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">Unauthorized Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">You do not have permission to access the admin dashboard.</p>
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System monitoring and management</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  User Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-2xl font-bold">{systemStats.activeUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Document Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Processed</p>
                    <p className="text-2xl font-bold">{systemStats.documentsProcessed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Workflows</p>
                    <p className="text-2xl font-bold">{systemStats.workflowsActive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
                  Security Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Security Events</p>
                    <p className="text-2xl font-bold">{systemStats.securityEvents}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Scan</p>
                    <p className="text-sm font-medium">Today 10:23 AM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Logins</CardTitle>
                <CardDescription>Latest user authentication events</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogins.map(login => (
                      <TableRow key={login.id}>
                        <TableCell className="font-medium">{login.name}</TableCell>
                        <TableCell>{formatDate(login.timestamp)}</TableCell>
                        <TableCell>{login.ipAddress}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-right">
                  <Button variant="link" onClick={() => setActiveTab('audit')}>
                    View All Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Actions</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActions.map(action => (
                      <TableRow key={action.id}>
                        <TableCell className="font-medium">{action.name}</TableCell>
                        <TableCell>{action.details}</TableCell>
                        <TableCell>{formatDate(action.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-right">
                  <Button variant="link" onClick={() => setActiveTab('audit')}>
                    View All Actions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <Link href="/admin/user-management">
                  <Button>
                    Manage Users
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Quick access to user management functions</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline">
                  Add New User
                </Button>
                <Button variant="outline">
                  Export User List
                </Button>
                <Button variant="outline">
                  Role Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Audit Log</CardTitle>
                  <CardDescription>System audit trail</CardDescription>
                </div>
                <Link href="/admin/audit-logs">
                  <Button>
                    View Complete Logs
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Monitor system activity and security events</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline">
                  Export Audit Logs
                </Button>
                <Button variant="outline">
                  Security Report
                </Button>
                <Button variant="outline">
                  Filter Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>System security configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">Configure login methods and security policies</p>
                      <Button variant="outline" className="w-full">Manage Authentication</Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">API Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">Manage API keys and permissions</p>
                      <Button variant="outline" className="w-full">Manage API Keys</Button>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Security Audit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Review system security and compliance</p>
                    <Button variant="outline" className="mr-2">Run Security Scan</Button>
                    <Button variant="outline">Export Report</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;