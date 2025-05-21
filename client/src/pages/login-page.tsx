import React, { useState } from 'react';
import { useRbacAuth } from '../context/rbac-auth-context';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ShieldCheck, User, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useRbacAuth();
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute('/login?:returnTo');
  
  // Get the return URL from query parameters if available
  const returnTo = params?.returnTo ? decodeURIComponent(params.returnTo) : '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        // Redirect to return URL or dashboard
        setLocation(returnTo);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Benton County GIS</h1>
          <p className="text-muted-foreground">Sign in to continue to the workflow system</p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> 
              <span>Sign In</span>
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Separator className="mb-4" />
            <div className="text-center text-sm text-muted-foreground">
              <p>Demo Accounts:</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="border rounded p-2">
                  <p className="font-bold">Admin</p>
                  <p>Username: admin</p>
                  <p>Password: Admin123!</p>
                </div>
                <div className="border rounded p-2">
                  <p className="font-bold">Staff</p>
                  <p>Username: staff_user</p>
                  <p>Password: Staff123!</p>
                </div>
                <div className="border rounded p-2">
                  <p className="font-bold">Field</p>
                  <p>Username: field_user</p>
                  <p>Password: Field123!</p>
                </div>
                <div className="border rounded p-2">
                  <p className="font-bold">Public</p>
                  <p>Username: public_user</p>
                  <p>Password: Public123!</p>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;