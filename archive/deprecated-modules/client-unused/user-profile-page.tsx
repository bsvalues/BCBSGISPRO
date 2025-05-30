import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { useRbac } from '../context/rbac-context';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { hasRole, userRoles } = useRbac();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  // Format last login date
  const lastLogin = new Date().toLocaleString(); // In a real app, this would come from the user object
  
  // Get authentication provider display name
  const getProviderName = (userId: string) => {
    if (userId.startsWith('google-')) return 'Google';
    if (userId.startsWith('github-')) return 'GitHub';
    return 'Email';
  };
  
  const isAdmin = hasRole('admin');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and manage your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={`${user.firstName || ''} ${user.lastName || ''}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-primary text-white text-xl font-bold">
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">User ID</Label>
                  <p>{user?.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Authentication Provider</Label>
                  <p>{user ? getProviderName(user.id) : 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Roles</Label>
                  <p>{userRoles.join(', ')}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Last Login</Label>
                  <p>{lastLogin}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Only show password change for email users */}
            {user && !user.id.startsWith('google-') && !user.id.startsWith('github-') && (
              <div>
                <Button variant="outline" className="w-full">Change Password</Button>
              </div>
            )}
            
            {/* MFA Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Multi-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Switch 
                id="mfa-toggle"
                checked={mfaEnabled} 
                onChange={(e) => setMfaEnabled(e.target.checked)} 
              />
            </div>
            
            {/* Admin Actions */}
            {isAdmin && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Admin Actions</h3>
                <Button variant="outline" className="w-full mb-2">
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full">
                  View Audit Logs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfilePage;