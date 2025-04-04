import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout';
import { useWebSocket, WebSocketMessage, ConnectionStatus, MessageTypeEnum, ConnectionStatusEnum } from '@/lib/websocket';
import { 
  Send, 
  Users, 
  Play, 
  Square, 
  Trash, 
  WifiOff, 
  Wifi,
  MessageSquare,
  Plus,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import { CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { TabsContent } from '@/components/ui/tabs';
import { TabsList } from '@/components/ui/tabs';
import { TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * WebSocket Demo Page for testing WebSocket functionality
 */
export default function WebSocketDemoPage() {
  // Room ID and user info
  const [roomId, setRoomId] = useState("demo-room");
  // Use useRef for initial username to prevent recreation on re-renders
  const usernameRef = useRef<string>(`User_${Math.floor(Math.random() * 1000)}`);
  const [username, setUsername] = useState(usernameRef.current);
  const [messageText, setMessageText] = useState("");
  
  // Generate a stable user ID that won't change on re-renders
  const userIdRef = useRef<string>(`user_${Math.floor(Math.random() * 10000)}`);
  
  // WebSocket connection
  const {
    status,
    messages,
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
    clearMessages,
    currentRoom
  } = useWebSocket({
    autoReconnect: true,
    userId: userIdRef.current,
    username
  });
  
  // Filter messages by type
  const chatMessages = messages.filter(msg => msg.type === MessageTypeEnum.CHAT);
  const joinLeaveMessages = messages.filter(
    msg => msg.type === MessageTypeEnum.JOIN_ROOM || msg.type === MessageTypeEnum.LEAVE_ROOM
  );
  
  // User list derived from join/leave messages
  const [users, setUsers] = useState<Set<string>>(new Set());
  
  // Set up automatic scrolling for messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Update users list when join/leave messages are received
  useEffect(() => {
    const usernames = new Set<string>();
    
    joinLeaveMessages.forEach(msg => {
      if (msg.type === MessageTypeEnum.JOIN_ROOM && msg.username) {
        usernames.add(msg.username);
      } else if (msg.type === MessageTypeEnum.LEAVE_ROOM && msg.username) {
        usernames.delete(msg.username);
      }
    });
    
    // Add current user
    if (status === ConnectionStatusEnum.CONNECTED && currentRoom) {
      usernames.add(username);
    }
    
    setUsers(usernames);
  }, [joinLeaveMessages, status, currentRoom, username]);
  
  // Function to get connection status badge color
  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case ConnectionStatusEnum.CONNECTED:
        return 'bg-green-500';
      case ConnectionStatusEnum.CONNECTING:
        return 'bg-yellow-500';
      case ConnectionStatusEnum.DISCONNECTED:
        return 'bg-gray-500';
      case ConnectionStatusEnum.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Render status text with icon
  const renderStatusWithIcon = () => {
    switch (status) {
      case ConnectionStatusEnum.CONNECTED:
        return (
          <span className="flex items-center gap-2">
            <Wifi className="h-4 w-4" /> Connected
          </span>
        );
      case ConnectionStatusEnum.CONNECTING:
        return (
          <span className="flex items-center gap-2">
            <Wifi className="h-4 w-4 animate-pulse" /> Connecting
          </span>
        );
      case ConnectionStatusEnum.DISCONNECTED:
        return (
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" /> Disconnected
          </span>
        );
      case ConnectionStatusEnum.ERROR:
        return (
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-red-500" /> Connection Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" /> Unknown
          </span>
        );
    }
  };
  
  // Handle sending a chat message
  const handleSendMessage = () => {
    if (!messageText.trim() || status !== ConnectionStatusEnum.CONNECTED || !currentRoom) return;
    
    sendMessage({
      type: MessageTypeEnum.CHAT,
      roomId: currentRoom,
      payload: {
        text: messageText.trim()
      }
    });
    
    setMessageText("");
  };
  
  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Connect and join room
  const handleConnectAndJoin = () => {
    if (status === ConnectionStatusEnum.DISCONNECTED || status === ConnectionStatusEnum.ERROR) {
      connect();
    }
    
    if (status === ConnectionStatusEnum.CONNECTED && !currentRoom && roomId) {
      joinRoom(roomId);
    }
  };
  
  // Disconnect and leave room
  const handleDisconnect = () => {
    if (currentRoom) {
      leaveRoom();
    }
    
    disconnect();
  };
  
  // Clear all messages
  const handleClearMessages = () => {
    clearMessages();
  };
  
  return (
    <Layout title="WebSocket Demo">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Controls */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>WebSocket Connection</CardTitle>
              <Badge
                className={cn(
                  "text-white px-3 py-1",
                  getStatusColor(status)
                )}
              >
                {renderStatusWithIcon()}
              </Badge>
            </div>
            <CardDescription>
              Establish a WebSocket connection and join a room to test real-time messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="max-w-xs"
                  disabled={status === ConnectionStatusEnum.CONNECTED}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="room">Room ID</Label>
                <Input
                  id="room"
                  value={roomId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value)}
                  placeholder="Room identifier"
                  className="max-w-xs"
                  disabled={currentRoom !== ''}
                />
              </div>
              <div className="flex gap-2">
                {(!currentRoom || status !== ConnectionStatusEnum.CONNECTED) ? (
                  <Button 
                    onClick={handleConnectAndJoin}
                    disabled={!roomId || !username || status === ConnectionStatusEnum.CONNECTING || currentRoom !== ''}
                    className="flex gap-2 items-center"
                  >
                    <Play className="h-4 w-4" />
                    {status !== ConnectionStatusEnum.CONNECTED ? 'Connect' : 'Join Room'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleDisconnect}
                    variant="destructive" 
                    className="flex gap-2 items-center"
                  >
                    <Square className="h-4 w-4" />
                    {currentRoom ? 'Leave Room' : 'Disconnect'}
                  </Button>
                )}
                <Button 
                  onClick={handleClearMessages}
                  variant="outline" 
                  className="flex gap-2 items-center"
                >
                  <Trash className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Message Display */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <span>Messages</span>
                {currentRoom && (
                  <Badge variant="outline" className="font-mono">
                    Room: {currentRoom}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Real-time messages received from the WebSocket server
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden flex flex-col">
              <Tabs defaultValue="chat" className="flex-grow flex flex-col">
                <TabsList>
                  <TabsTrigger value="chat" className="flex gap-2 items-center">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex gap-2 items-center">
                    <Users className="h-4 w-4" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="flex gap-2 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                    Raw
                  </TabsTrigger>
                </TabsList>
                
                {/* Chat Messages Tab */}
                <TabsContent value="chat" className="flex-grow flex flex-col data-[state=active]:flex">
                  <div className="flex-grow overflow-auto p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No chat messages yet. Start a conversation!
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={cn(
                          "flex max-w-[80%] group",
                          msg.userId === username ? "ml-auto" : ""
                        )}>
                          <div className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            msg.userId === username 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          )}>
                            <div className="font-medium">
                              {msg.username || "Unknown User"}
                              <span className="ml-2 text-xs opacity-50">
                                {msg.timestamp ? formatTime(msg.timestamp) : ""}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap break-words">{msg.payload?.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="pt-3 pb-3 border-t">
                    <div className="flex gap-2">
                      <Textarea 
                        value={messageText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="resize-none min-h-[80px]"
                        disabled={status !== ConnectionStatusEnum.CONNECTED || !currentRoom}
                      />
                      <Button 
                        className="self-end"
                        disabled={!messageText.trim() || status !== ConnectionStatusEnum.CONNECTED || !currentRoom}
                        onClick={handleSendMessage}
                      >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Event Messages Tab */}
                <TabsContent value="events" className="flex-grow overflow-auto p-4 space-y-4 data-[state=active]:block">
                  {joinLeaveMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No room events yet.
                    </div>
                  ) : (
                    joinLeaveMessages.map((msg, idx) => (
                      <div key={idx} className="p-2 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-sm">
                        <div className="text-sm flex justify-between">
                          <span>
                            <span className="font-semibold">{msg.username}</span>
                            <span> {msg.type === MessageTypeEnum.JOIN_ROOM ? 'joined' : 'left'} the room</span>
                          </span>
                          <span className="text-xs opacity-70">
                            {msg.timestamp ? formatTime(msg.timestamp) : ""}
                          </span>
                        </div>
                        {msg.payload?.userCount !== undefined && (
                          <div className="text-xs mt-1 opacity-80">
                            Users in room: {msg.payload.userCount}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>
                
                {/* Raw Messages Tab */}
                <TabsContent value="raw" className="flex-grow overflow-auto data-[state=active]:block">
                  <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                    {messages.length === 0 
                      ? "No messages received" 
                      : messages.map((msg, idx) => (
                        <div key={idx} className="mb-2 pb-2 border-b border-muted">
                          <span className="text-muted-foreground">{`[${formatTime(msg.timestamp || 0)}]`}</span>
                          <details>
                            <summary className="cursor-pointer hover:text-primary transition-colors select-none">
                              <span className="font-semibold">{msg.type}</span> from {msg.username}
                            </summary>
                            <div className="pl-4 mt-1 text-muted-foreground">
                              {JSON.stringify(msg, null, 2)}
                            </div>
                          </details>
                        </div>
                      ))
                    }
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Connected Users */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between">
              <span>Users</span>
              <Badge>{users.size}</Badge>
            </CardTitle>
            <CardDescription>
              Users currently connected to the room
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto">
            {users.size === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No users connected
              </div>
            ) : (
              <ul className="space-y-2">
                {Array.from(users).map((user, index) => (
                  <li key={index} className="p-3 bg-muted rounded-md flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {user.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium">{user}</span>
                    {user === username && (
                      <Badge variant="outline" className="ml-auto text-xs">You</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        {/* Connection Status Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle>WebSocket Status</CardTitle>
            <CardDescription>
              Details about the current WebSocket connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg bg-background">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Status</div>
                <div className="font-semibold">{status}</div>
              </div>
              <div className="p-4 border rounded-lg bg-background">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Current Room</div>
                <div className="font-semibold font-mono">{currentRoom || "Not joined"}</div>
              </div>
              <div className="p-4 border rounded-lg bg-background">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Messages Received</div>
                <div className="font-semibold">{messages.length}</div>
              </div>
              <div className="p-4 border rounded-lg bg-background">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Connected Users</div>
                <div className="font-semibold">{users.size}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}