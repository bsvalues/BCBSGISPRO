import React from 'react';
import ModernLayout from '../components/layout/modern-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useRbacAuth } from '../context/rbac-auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { 
  User, Settings, FileText, Workflow, Shield, 
  CheckCircle2, AlertCircle, Bell
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useTitle } from '../hooks/use-title';
import { Separator } from '../components/ui/separator';

/**
 * User Profile Page
 * 
 * This page displays user information, role permissions, and preferences.
 */
export default function UserProfilePage() {
  const { user } = useRbacAuth();
  useTitle('User Profile | BentonGeoPro');
  
  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-500';
      case 'staff': return 'bg-blue-500';
      case 'field': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <ModernLayout>
      <div className="container py-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-xl bg-primary text-white">
                  {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{user?.fullName || user?.username || 'User'}</h1>
                    <p className="text-muted-foreground">{user?.email || 'No email'}</p>
                  </div>
                  <Badge className={getRoleBadgeColor(user?.role || '')}>
                    {user?.role || 'No Role'}
                  </Badge>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Manage Permissions
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notification Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-1">
              <Workflow className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                    <p>{user?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                    <p>{user?.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p>{user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Login</h3>
                    <p>{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Role & Permissions</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        View Parcels
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        View Documents
                      </Badge>
                      {user?.role === 'admin' && (
                        <>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Manage Users
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            System Settings
                          </Badge>
                        </>
                      )}
                      {['admin', 'staff'].includes(user?.role || '') && (
                        <>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Edit Workflows
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Upload Documents
                          </Badge>
                        </>
                      )}
                      {!user?.role && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          No Permissions
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 border rounded-md">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Workflows Created</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Reports Generated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="workflows" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Workflow className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                  <h3 className="mt-4 text-lg font-medium">No Active Workflows</h3>
                  <p className="text-muted-foreground mt-1">
                    You don't have any workflows associated with your account yet.
                  </p>
                  <Button className="mt-4">Create a Workflow</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                  <h3 className="mt-4 text-lg font-medium">No Documents</h3>
                  <p className="text-muted-foreground mt-1">
                    You haven't uploaded any documents yet.
                  </p>
                  <Button className="mt-4">Upload a Document</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
}