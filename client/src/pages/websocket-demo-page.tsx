import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout';
import { useWebSocket, ConnectionStatus, WebSocketMessage } from '@/lib/websocket';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  Input,
  Badge,
  Textarea
} from '@/components/ui';
import { Loader2, Send, User, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ROOM_ID = 'test-room';

/**
 * WebSocket Demo Page
 * 
 * This page demonstrates the WebSocket functionality by creating a simple
 * real-time chat application using our WebSocket hook.
 */
const WebSocketDemoPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState(`User_${Math.floor(Math.random() * 1000)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Initialize WebSocket connection with auto-join to test room
  const ws = useWebSocket({
    autoJoinRoom: ROOM_ID,
    username: username
  });
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ws.messages]);
  
  // Handle form submission to send a message
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Send chat message via WebSocket
    const success = ws.sendMessage({
      type: 'chat_message',
      roomId: ROOM_ID,
      username: username,
      payload: {
        message: message.trim()
      }
    });
    
    if (success) {
      setMessage('');
    } else {
      toast({
        title: 'Failed to send message',
        description: 'Please check your connection and try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Get unique users from messages
  const getActiveUsers = () => {
    const userIds = new Set<string>();
    const users: { userId: string; username: string }[] = [];
    
    ws.messages
      .filter(msg => msg.userId && msg.username)
      .forEach(msg => {
        if (msg.userId && !userIds.has(msg.userId)) {
          userIds.add(msg.userId);
          users.push({ userId: msg.userId, username: msg.username || 'Anonymous' });
        }
      });
    
    return users;
  };
  
  // Get connection status display info
  const getConnectionInfo = () => {
    switch (ws.status) {
      case 'connecting':
        return {
          label: 'Connecting',
          color: 'bg-yellow-500',
          icon: <Loader2 className="animate-spin h-4 w-4" />
        };
      case 'connected':
        return {
          label: 'Connected',
          color: 'bg-green-500',
          icon: null
        };
      case 'disconnected':
        return {
          label: 'Disconnected',
          color: 'bg-gray-500',
          icon: null
        };
      case 'error':
        return {
          label: 'Error',
          color: 'bg-red-500',
          icon: <AlertCircle className="h-4 w-4" />
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-500',
          icon: null
        };
    }
  };
  
  const connectionInfo = getConnectionInfo();
  const activeUsers = getActiveUsers();
  
  return (
    <Layout title="WebSocket Demo">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connection Status Card */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>WebSocket Connection</CardTitle>
                <Badge 
                  variant="outline" 
                  className={`text-white ${connectionInfo.color}`}
                >
                  {connectionInfo.icon && <span className="mr-1">{connectionInfo.icon}</span>}
                  {connectionInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant={ws.status === 'connected' ? 'outline' : 'default'}
                  onClick={() => ws.connect()}
                  disabled={ws.status === 'connecting' || ws.status === 'connected'}
                >
                  Connect
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => ws.disconnect()}
                  disabled={ws.status !== 'connected'}
                >
                  Disconnect
                </Button>
                <Button 
                  size="sm" 
                  variant={ws.currentRoom ? 'outline' : 'default'}
                  onClick={() => ws.joinRoom(ROOM_ID)}
                  disabled={ws.status !== 'connected' || ws.currentRoom === ROOM_ID}
                >
                  Join Room
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => ws.leaveRoom()}
                  disabled={ws.status !== 'connected' || !ws.currentRoom}
                >
                  Leave Room
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => ws.clearMessages()}
                >
                  Clear Messages
                </Button>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>
                  Current Room: <span className="font-medium">{ws.currentRoom || 'None'}</span> 
                </p>
                <p>
                  Messages: <span className="font-medium">{ws.messages.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Users Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Users ({activeUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                {activeUsers.length > 0 ? (
                  <ul className="space-y-2">
                    {activeUsers.map((user) => (
                      <li key={user.userId} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.username}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active users
                  </p>
                )}
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium mb-1 block">Your Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Chat Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Real-time Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-y-auto border rounded-md p-3 mb-3">
                {ws.messages.filter(msg => msg.type === 'chat_message').length > 0 ? (
                  <div className="space-y-3">
                    {ws.messages
                      .filter(msg => msg.type === 'chat_message')
                      .map((msg, index) => (
                        <div key={index} className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              {msg.username || 'Anonymous'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                            </span>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md text-sm">
                            {msg.payload?.message}
                          </div>
                        </div>
                      ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                    <p>No messages yet</p>
                    <p className="text-sm">Be the first to send a message!</p>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={ws.status !== 'connected' || !ws.currentRoom}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={ws.status !== 'connected' || !ws.currentRoom || !message.trim()}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-3">
              {ws.status === 'connected' && ws.currentRoom ? (
                <p>
                  Connected to <span className="font-medium">{ws.currentRoom}</span> - Start chatting!
                </p>
              ) : (
                <p>
                  {ws.status === 'connected' 
                    ? 'Connected but not in a room. Join a room to start chatting.' 
                    : 'Connect to the WebSocket server to start chatting.'}
                </p>
              )}
            </CardFooter>
          </Card>
          
          {/* Raw Messages Log */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Message Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                className="font-mono text-xs h-48"
                value={ws.messages
                  .map((msg) => JSON.stringify(msg, null, 2))
                  .join('\n\n')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WebSocketDemoPage;