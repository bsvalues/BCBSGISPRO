import React from 'react';
import { useRbacAuth } from '../context/rbac-auth-context';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, ShieldCheck, LogOut, Key } from 'lucide-react';

const UserProfilePage: React.FC = () => {
  const { user, logout } = useRbacAuth();
  const [_, setLocation] = useLocation();

  // Handle logout
  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  // If no user is logged in, redirect to login
  if (!user) {
    setLocation('/login');
    return null;
  }

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'staff': return 'bg-blue-500';
      case 'field': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get role description
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access to all system features, including user management and configuration.';
      case 'staff':
        return 'County staff with access to most features, including document management, workflows, and maps.';
      case 'field':
        return 'Field staff with access to view parcels, documents, and limited workflow management.';
      case 'public':
        return 'Limited access to public information and maps.';
      default:
        return 'Access level not specified.';
    }
  };

  // Get access level examples
  const getAccessLevelExamples = (role: string) => {
    switch (role) {
      case 'admin':
        return [
          'Create and manage user accounts',
          'Configure system settings',
          'Access all workflows and documents',
          'Manage map layers and settings',
          'Access audit logs and system reports'
        ];
      case 'staff':
        return [
          'Create and manage workflows',
          'Upload and classify documents',
          'Edit parcel information',
          'Generate reports',
          'Access most maps and layers'
        ];
      case 'field':
        return [
          'View assigned workflows',
          'View documents related to assignments',
          'Update workflow status from the field',
          'Access field-relevant maps',
          'Submit field reports'
        ];
      case 'public':
        return [
          'View public property information',
          'Access public maps',
          'View public documents',
          'Search property records',
          'Limited data export capabilities'
        ];
      default:
        return ['Limited system access'];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">User Profile</h1>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {/* User Info Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{user.fullName || user.username}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-2">
                  <Badge className={`${getRoleColor(user.role)} text-white`}>{user.role}</Badge>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Username:</span>
                  <p className="text-sm">{user.username}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">User ID:</span>
                  <p className="text-sm">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Info Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Role & Permissions
              </CardTitle>
              <CardDescription>
                Your access level and capabilities in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Badge className={`${getRoleColor(user.role)} text-white`}>{user.role}</Badge>
                    Access Level
                  </h3>
                  <p className="text-sm mt-1">{getRoleDescription(user.role)}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    What You Can Do
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {getAccessLevelExamples(user.role).map((example, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span> {example}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {user.permissions && user.permissions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium">Additional Permissions</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline">{permission}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-primary/5 p-4 rounded-b-lg">
              <div className="w-full text-sm text-center">
                <p>Need additional access or have questions about your permissions?</p>
                <p className="font-medium">Contact your system administrator</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;