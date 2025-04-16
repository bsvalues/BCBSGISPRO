import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { demoUserAccounts } from '@/data/demo-property-data';
import { AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [_, setLocation] = useLocation();
  const { login, loading, error } = useAuth();
  const [match, params] = useRoute('/login');
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      return;
    }
    
    try {
      await login({ username, password });
      // Redirect to home or a specific return URL
      setLocation('/');
    } catch (err) {
      // Error is handled in auth context
      console.error('Login error:', err);
    }
  };
  
  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-background"
      style={{
        backgroundImage: `url('/assets/Header-Vineyard-BC.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <Card className="w-full max-w-md z-10 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <img 
              src="/assets/BC.png"
              alt="Benton County Logo"
              className="h-12 w-12"
            />
          </div>
          <CardTitle className="text-2xl font-bold">BentonGeoPro</CardTitle>
          <CardDescription>
            Sign in to access the Benton County Assessor's GIS Platform
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Demo Mode:</span> Use any password with demo usernames
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Demo Accounts:</h3>
            <div className="grid grid-cols-1 gap-2">
              {demoUserAccounts.map((account) => (
                <Button
                  key={account.id}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left"
                  onClick={() => {
                    setUsername(account.username);
                    setPassword('demo123'); // Any password works in demo mode
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{account.username}</span>
                    <span className="text-xs text-muted-foreground">{account.role}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-center text-muted-foreground">
            BentonGeoPro Demo - GIS Workflow Solution for Benton County Assessor's Office
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;