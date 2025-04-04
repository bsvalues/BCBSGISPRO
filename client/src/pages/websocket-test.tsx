import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

export default function WebSocketTestPage() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('TestUser_' + Math.floor(Math.random() * 1000));
  const [roomId, setRoomId] = useState('test-room');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Array<{type: string, timestamp: number, data: any}>>([]);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [joinedRoom, setJoinedRoom] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);
  
  // Connect to WebSocket
  const connectWebSocket = () => {
    // Close existing connection if any
    if (socket) {
      socket.close();
    }
    
    try {
      // Establish new connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        setConnected(true);
        addSystemMessage('Connected to WebSocket server');
      };
      
      newSocket.onclose = () => {
        setConnected(false);
        setJoinedRoom('');
        addSystemMessage('Disconnected from WebSocket server');
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        addSystemMessage('Error: WebSocket connection error');
      };
      
      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle heartbeat messages separately
          if (message.type === 'heartbeat') {
            setLastPing(new Date());
            return;
          }
          
          // Add to message list
          setMessages(prevMessages => [...prevMessages, {
            type: message.type,
            timestamp: message.timestamp || Date.now(),
            data: message
          }]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      addSystemMessage('Connection Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Disconnect from WebSocket
  const disconnectWebSocket = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
    }
  };
  
  // Join a room
  const joinRoom = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      addSystemMessage('Cannot join room: Not connected to WebSocket server');
      return;
    }
    
    try {
      socket.send(JSON.stringify({
        type: 'join_room',
        roomId,
        userId: Math.random().toString(36).substring(2, 15),
        username,
        timestamp: Date.now()
      }));
      
      setJoinedRoom(roomId);
      addSystemMessage(`Joined room: ${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      addSystemMessage('Error joining room: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Leave the current room
  const leaveRoom = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !joinedRoom) {
      addSystemMessage('Cannot leave room: Not in a room or not connected');
      return;
    }
    
    try {
      socket.send(JSON.stringify({
        type: 'leave_room',
        roomId: joinedRoom,
        userId: Math.random().toString(36).substring(2, 15),
        username,
        timestamp: Date.now()
      }));
      
      setJoinedRoom('');
      addSystemMessage(`Left room: ${joinedRoom}`);
    } catch (error) {
      console.error('Failed to leave room:', error);
      addSystemMessage('Error leaving room: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Send a message
  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !joinedRoom) {
      addSystemMessage('Cannot send message: Not connected or not in a room');
      return;
    }
    
    if (!messageText.trim()) {
      return;
    }
    
    try {
      const messageObj = {
        type: 'chat_message',
        roomId: joinedRoom,
        userId: Math.random().toString(36).substring(2, 15),
        username,
        payload: {
          message: messageText.trim(),
          text: messageText.trim()
        },
        timestamp: Date.now()
      };
      
      socket.send(JSON.stringify(messageObj));
      setMessageText('');
      
      // Add sent message to the list
      setMessages(prevMessages => [...prevMessages, {
        type: 'sent',
        timestamp: Date.now(),
        data: messageObj
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      addSystemMessage('Error sending message: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Add a system message
  const addSystemMessage = (text: string) => {
    setMessages(prevMessages => [...prevMessages, {
      type: 'system',
      timestamp: Date.now(),
      data: { message: text }
    }]);
  };
  
  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">WebSocket Testing Console</CardTitle>
          <CardDescription>
            Test the WebSocket server connectivity and functionality
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={connected}
                />
              </div>
              
              <div className="flex gap-2">
                {!connected ? (
                  <Button 
                    onClick={connectWebSocket} 
                    className="flex-1"
                  >
                    Connect
                  </Button>
                ) : (
                  <Button 
                    onClick={disconnectWebSocket} 
                    variant="destructive" 
                    className="flex-1"
                  >
                    Disconnect
                  </Button>
                )}
              </div>
              
              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-1">Status:</div>
                {connected ? (
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-green-600 font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-red-600 font-medium">Disconnected</span>
                  </div>
                )}
              </div>
              
              {lastPing && (
                <div className="text-xs text-muted-foreground">
                  Last heartbeat: {lastPing.toLocaleTimeString()}
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID</Label>
                <Input 
                  id="roomId" 
                  value={roomId} 
                  onChange={(e) => setRoomId(e.target.value)}
                  disabled={!connected || joinedRoom !== ''}
                />
              </div>
              
              <div className="flex gap-2">
                {!joinedRoom ? (
                  <Button 
                    onClick={joinRoom} 
                    disabled={!connected}
                    className="flex-1"
                  >
                    Join Room
                  </Button>
                ) : (
                  <Button 
                    onClick={leaveRoom} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Leave Room
                  </Button>
                )}
              </div>
              
              {joinedRoom && (
                <div className="pt-2">
                  <div className="text-sm text-muted-foreground mb-1">Current Room:</div>
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {joinedRoom}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-2">
              <Tabs defaultValue="messages">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="messages" className="flex-1">
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1">
                    Custom Message
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="messages" className="space-y-4">
                  <div className="flex flex-col h-[400px]">
                    <ScrollArea ref={scrollAreaRef} className="flex-grow border rounded-md p-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">
                          No messages yet. Connect to the WebSocket server to get started.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg, index) => (
                            <div 
                              key={index} 
                              className={`p-2 rounded-lg ${
                                msg.type === 'system' 
                                  ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                                  : msg.type === 'sent' 
                                    ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300' 
                                    : 'bg-muted/50'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-medium text-xs">
                                  {msg.type === 'system' 
                                    ? 'SYSTEM' 
                                    : msg.type === 'sent' 
                                      ? 'SENT' 
                                      : msg.data.type}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimestamp(msg.timestamp)}
                                </div>
                              </div>
                              <div className="text-sm break-words">
                                {msg.type === 'system' 
                                  ? msg.data.message 
                                  : JSON.stringify(msg.data, null, 2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    
                    <div className="flex gap-2 mt-4">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        disabled={!connected || !joinedRoom}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!connected || !joinedRoom || !messageText.trim()}
                      >
                        Send
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={clearMessages} 
                      className="mt-2"
                    >
                      Clear Messages
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom">
                  <div className="space-y-4">
                    <Textarea
                      rows={10}
                      placeholder={`{
  "type": "chat_message",
  "roomId": "${joinedRoom || roomId}",
  "userId": "test-user-123",
  "username": "${username}",
  "payload": {
    "message": "Hello world",
    "text": "Hello world"
  }
}`}
                      className="font-mono text-sm"
                    />
                    
                    <Button 
                      disabled={!connected || !joinedRoom}
                      className="w-full"
                    >
                      Send Custom Message
                    </Button>
                    
                    <Alert className="mt-4">
                      <div className="text-sm">
                        <p className="font-medium">Custom Message Format:</p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          <li><span className="font-mono">type</span>: Message type (e.g., 'chat_message', 'cursor_move')</li>
                          <li><span className="font-mono">roomId</span>: Room identifier</li>
                          <li><span className="font-mono">userId</span>: Your user ID</li>
                          <li><span className="font-mono">username</span>: Your display name</li>
                          <li><span className="font-mono">payload</span>: Message data (object)</li>
                          <li><span className="font-mono">timestamp</span>: Current time (optional)</li>
                        </ul>
                      </div>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>WebSocket Documentation</CardTitle>
          <CardDescription>
            How to use the WebSocket API in your application
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Connection</h3>
            <div className="text-sm space-y-2">
              <p>Connect to the WebSocket server using the following URL pattern:</p>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                {`const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
const socket = new WebSocket(wsUrl);`}
              </pre>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Message Types</h3>
            <div className="text-sm space-y-2">
              <p>The WebSocket server supports these primary message types:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-mono">join_room</span>: Join a collaboration room</li>
                <li><span className="font-mono">leave_room</span>: Leave a collaboration room</li>
                <li><span className="font-mono">chat_message</span>: Send a text message to room members</li>
                <li><span className="font-mono">cursor_move</span>: Broadcast cursor position</li>
                <li><span className="font-mono">feature_add</span>: Add a map feature</li>
                <li><span className="font-mono">feature_update</span>: Update a map feature</li>
                <li><span className="font-mono">feature_delete</span>: Delete a map feature</li>
                <li><span className="font-mono">annotation_add</span>: Add a text annotation</li>
                <li><span className="font-mono">annotation_update</span>: Update an annotation</li>
                <li><span className="font-mono">annotation_delete</span>: Delete an annotation</li>
                <li><span className="font-mono">heartbeat</span>: Connection health check</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}