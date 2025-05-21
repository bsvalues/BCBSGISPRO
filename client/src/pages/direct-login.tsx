import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DirectLoginPage() {
  const [username, setUsername] = useState("testuser");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Try the debug login endpoint first (more robust for troubleshooting)
      const debugResponse = await fetch("/api/debug/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (debugResponse.ok) {
        const data = await debugResponse.json();
        toast({
          title: "Login successful",
          description: data.message || "Welcome to the application",
        });
        navigate("/");
        return;
      }

      // Fall back to regular login if debug endpoint fails
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Login successful",
          description: "Welcome to Benton County GIS Workflow Assistant",
        });
        navigate("/");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestUser = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/debug/create-test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Test user created",
          description: data.message || "You can now log in with testuser/password",
        });
      } else {
        setError(data.message || "Failed to create test user");
      }
    } catch (err) {
      console.error("Create test user error:", err);
      setError("Network error while creating test user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Direct Login</CardTitle>
          <CardDescription>
            Use this simplified login page to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCreateTestUser}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating user...
                  </>
                ) : (
                  "Create Test User"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}