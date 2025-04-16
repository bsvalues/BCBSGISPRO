import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { demoUsers } from '../data/demo-property-data';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isAuthenticating } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      login(username, password);
    }
  };
  
  const selectDemoAccount = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
  };
  
  // Organize demo accounts by role
  const demoAccountsByRole = demoUsers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, typeof demoUsers>);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">BentonGeoPro</h1>
          <p className="text-muted-foreground mt-2">
            GIS Workflow Solution for Benton County Assessor's Office
          </p>
        </div>
        
        <div className="bg-card shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-muted-foreground mb-1">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="text-primary hover:text-primary/90">
                  Forgot password?
                </a>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6">
            <button
              type="button"
              className="text-sm text-primary hover:underline focus:outline-none"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            >
              {showDemoAccounts ? 'Hide demo accounts' : 'Use a demo account'}
            </button>
            
            {showDemoAccounts && (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Select a role to pre-fill the login form:
                </p>
                
                {Object.entries(demoAccountsByRole).map(([role, users]) => (
                  <div key={role} className="space-y-2">
                    <h4 className="text-sm font-medium">{role}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {users.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="text-left px-3 py-2 text-sm rounded-md bg-accent hover:bg-accent/80 flex justify-between items-center"
                          onClick={() => selectDemoAccount(user.username, user.password)}
                        >
                          <span>
                            <span className="font-medium">{user.fullName}</span>
                            <span className="block text-xs text-muted-foreground">@{user.username}</span>
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Select</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>BentonGeoPro 24-Hour Assessment Demo | © 2025</p>
          <p className="mt-1">Powered by advanced geospatial technology</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;