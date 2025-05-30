import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { FaGoogle, FaGithub, FaEnvelope } from 'react-icons/fa';

const EnhancedLoginPage: React.FC = () => {
  const [location] = useLocation();
  // Get return URL from query string if it exists
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  
  // Redirect to API login endpoint with appropriate return URL
  const handleLogin = (provider?: string) => {
    const loginUrl = `/api/login${provider ? `?provider=${provider}` : ''}`;
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to TerraFusion</CardTitle>
          <CardDescription>
            Benton County GIS Workflow Assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <img 
                src="/county-logo.png" 
                alt="Benton County" 
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="text-3xl font-bold text-primary">BC</div>';
                  }
                }}
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-6"
            onClick={() => handleLogin('google')}
          >
            <FaGoogle className="h-4 w-4" />
            <span>Sign in with Google</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-6"
            onClick={() => handleLogin('github')}
          >
            <FaGithub className="h-4 w-4" />
            <span>Sign in with GitHub</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-6"
            onClick={() => handleLogin('email')}
          >
            <FaEnvelope className="h-4 w-4" />
            <span>Sign in with Email</span>
          </Button>
          
          <div className="text-center text-sm text-gray-500 mt-6">
            <p>County staff should sign in with their official email account.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-gray-500 w-full">
            <a href="#" className="text-primary hover:underline">
              Need help signing in?
            </a>
          </div>
          <Separator />
          <div className="text-center text-xs text-gray-400 w-full">
            Protected by advanced security - all actions are logged and audited
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EnhancedLoginPage;