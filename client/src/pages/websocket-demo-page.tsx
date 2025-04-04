import React from 'react';
import { Layout } from '@/components/layout';
import { WebSocketDemo } from '@/components/collaborative/websocket-demo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Network, Code, MessagesSquare, Info } from 'lucide-react';

/**
 * WebSocket Demo Page for testing WebSocket functionality
 */
export default function WebSocketDemoPage() {
  return (
    <Layout title="WebSocket Demo">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <CardTitle>WebSocket Communication</CardTitle>
            </div>
            <CardDescription>
              Test real-time communication between users with our WebSocket implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <div>
                Open this page in multiple browser windows to test real-time collaboration between users.
              </div>
            </Alert>
            
            <WebSocketDemo />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessagesSquare className="h-5 w-5 text-primary" />
                <CardTitle>How It Works</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>This demo showcases real-time communication using WebSockets:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>WebSocket server runs on the backend at the <code>/ws</code> path</li>
                <li>Users connect and join collaboration rooms</li>
                <li>Messages are broadcast to all users in the room</li>
                <li>The connection stays open for real-time updates</li>
                <li>Automatic reconnection handles network issues</li>
              </ul>
              
              <Separator className="my-4" />
              
              <p className="text-sm text-muted-foreground">
                The same WebSocket infrastructure powers collaborative features throughout the application,
                including real-time map annotations, features, and messaging.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <CardTitle>Implementation Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Key implementation features:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Server-side room management with client tracking</li>
                <li>Heartbeat system to detect disconnections</li>
                <li>Message types for different collaborative actions</li>
                <li>React hooks for easy WebSocket integration</li>
                <li>Automatic reconnection with exponential backoff</li>
              </ul>
              
              <Separator className="my-4" />
              
              <p className="text-sm text-muted-foreground">
                The WebSocket implementation uses TypeScript for type safety and includes robust error handling.
                The system supports both browser-native WebSocket on the frontend and the ws library on the backend.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}