import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useLocation } from "wouter";
import { FaGoogle, FaGithub, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../context/auth-context';

export default function LoginPage() {
  const [_, navigate] = useLocation();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: string) => {
    setError(null);
    try {
      await login(provider);
      navigate('/'); // Redirect to home on successful login
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Access the Benton County GIS Workflow Assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={() => handleLogin('google')}
              className="flex items-center justify-center gap-2"
              variant="outline"
            >
              <FaGoogle /> Continue with Google
            </Button>
            
            <Button 
              onClick={() => handleLogin('github')}
              className="flex items-center justify-center gap-2"
              variant="outline"
            >
              <FaGithub /> Continue with GitHub
            </Button>
            
            <Button 
              onClick={() => handleLogin('email')}
              className="flex items-center justify-center gap-2"
              variant="outline"
            >
              <FaEnvelope /> Continue with Email
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate('/')}
              variant="ghost"
            >
              Continue as Guest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}