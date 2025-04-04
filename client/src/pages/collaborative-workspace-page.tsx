import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { MapboxMap } from '@/components/maps/mapbox/mapbox-map';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users,
  User,
  MessageSquare, 
  Map as MapIcon, 
  MapPin, 
  Share2,
  Info,
  Copy,
  PenTool
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { CollaborativeMap } from '@/components/maps/collaborative-map';
import { useWebSocket, ConnectionStatus, MessageType } from '@/lib/websocket';
import { v4 as uuidv4 } from 'uuid';
import { useToast, toast } from '@/hooks/use-toast';

// Message types for chat
interface ChatMessage {
  id: string;
  userId: string;
  roomId: string;
  text: string;
  timestamp: string;
}

// Generate random room ID if not provided
function useRoomId(): string {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const roomFromParams = searchParams.get('room');
  
  return roomFromParams || 'default-room';
}

export function CollaborativeWorkspacePage() {
  // Room management
  const roomId = useRoomId();
  
  // Map state
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Connected users
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  
  // WebSocket connection
  const { 
    send, 
    lastMessage, 
    status: connectionStatus, 
    userId 
  } = useWebSocket(roomId);
  
  // Reference to the chat scroll area
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Toast notifications
  const { dismiss } = useToast(); // We'll use the imported toast function directly
  
  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      // Handle chat messages
      if (lastMessage.type === MessageType.CHAT && lastMessage.data) {
        const chatMessage = lastMessage.data as ChatMessage;
        setMessages(prev => [...prev, chatMessage]);
        
        // Scroll to bottom
        if (chatScrollRef.current) {
          setTimeout(() => {
            if (chatScrollRef.current) {
              chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
            }
          }, 100);
        }
      }
      
      // Handle presence updates
      if (lastMessage.type === MessageType.PRESENCE && lastMessage.data && lastMessage.data.users) {
        setConnectedUsers(lastMessage.data.users);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  }, [lastMessage]);
  
  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.CONNECTED) {
      toast({
        title: "Connected to collaboration server",
        description: "You can now collaborate with others in real-time",
        variant: "default"
      });
    } else if (connectionStatus === ConnectionStatus.RECONNECTING) {
      toast({
        title: "Reconnecting to server",
        description: "Attempting to reconnect to the collaboration server",
        variant: "destructive"
      });
    } else if (connectionStatus === ConnectionStatus.ERROR) {
      toast({
        title: "Connection error",
        description: "Failed to connect to the collaboration server",
        variant: "destructive"
      });
    }
  }, [connectionStatus]);
  
  // Send a chat message
  const sendChatMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    
    const chatMessage: ChatMessage = {
      id: uuidv4(),
      userId,
      roomId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Send via WebSocket
    send({
      type: MessageType.CHAT,
      roomId,
      source: userId,
      timestamp: chatMessage.timestamp,
      data: chatMessage
    });
    
    // Add to local messages
    setMessages(prev => [...prev, chatMessage]);
    
    // Clear input
    setNewMessage('');
    
    // Scroll to bottom
    if (chatScrollRef.current) {
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [newMessage, userId, roomId, send]);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Check if message is from current user
  const isCurrentUser = (messageUserId: string): boolean => {
    return messageUserId === userId;
  };
  
  // Generate a user color based on user ID
  const getUserColor = (userId: string): string => {
    // Generate a color based on the hash of the user ID
    const hash = Array.from(userId).reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const h = Math.abs(hash) % 360; // Hue (0-360)
    const s = 70 + (Math.abs(hash) % 20); // Saturation (70-90%)
    const l = 40 + (Math.abs(hash) % 10); // Lightness (40-50%)
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  };
  
  // Create shortened user ID for display
  const getShortenedUserId = (fullId: string): string => {
    return fullId.substring(0, 6);
  };
  
  // Copy room link to clipboard
  const copyRoomLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    navigator.clipboard.writeText(url.toString());
    
    toast({
      title: "Link copied",
      description: "Collaboration link copied to clipboard",
      variant: "default"
    });
  };
  
  // Handle map creation
  const handleMapCreated = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);
  }, []);
  
  // Handle keypress in chat input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  };
  
  // Get connection status display
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return <Badge variant="outline" className="text-green-500">Connected</Badge>;
      case ConnectionStatus.CONNECTING:
        return <Badge variant="outline" className="text-yellow-500">Connecting...</Badge>;
      case ConnectionStatus.RECONNECTING:
        return <Badge variant="outline" className="text-yellow-500">Reconnecting...</Badge>;
      default:
        return <Badge variant="outline" className="text-red-500">Disconnected</Badge>;
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-card border-b flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MapIcon className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Collaborative Workspace</h1>
          <Badge variant="secondary">Room: {roomId}</Badge>
          {getConnectionStatusDisplay()}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium mr-2">{connectedUsers.length}</span>
            
            {connectedUsers.length > 0 && (
              <div className="flex -space-x-2">
                {connectedUsers.slice(0, 3).map((user) => (
                  <TooltipProvider key={user}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-xs text-white"
                          style={{ backgroundColor: getUserColor(user) }}
                        >
                          {user.substring(0, 1).toUpperCase()}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>User {getShortenedUserId(user)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                
                {connectedUsers.length > 3 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                          +{connectedUsers.length - 3}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>And {connectedUsers.length - 3} more users</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm" onClick={copyRoomLink}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <MapboxMap 
            onMapCreated={handleMapCreated}
            style="mapbox://styles/mapbox/streets-v11"
            initialCenter={[-123.2620, 44.5646]} // Corvallis, OR
            initialZoom={13}
          />
          
          <div className="absolute inset-0">
            {map && (
              <CollaborativeMap 
                map={map} 
                roomId={roomId}
                onConnectionStatusChange={(status) => {
                  // The connection status is already handled at the page level
                  // Additional handling if needed
                }}
                onCollaboratorsChange={(users) => {
                  setConnectedUsers(users);
                }}
              />
            )}
          </div>
        </div>
        
        <div className="w-80 border-l flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start px-4 pt-2 rounded-none border-b">
              <TabsTrigger value="chat" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Info
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col mt-0 p-0">
              <ScrollArea ref={chatScrollRef} className="flex-1">
                <div className="p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`flex ${isCurrentUser(message.userId) ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            isCurrentUser(message.userId) 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          {!isCurrentUser(message.userId) && (
                            <div className="flex items-center mb-1">
                              <div 
                                className="h-4 w-4 rounded-full mr-1"
                                style={{ backgroundColor: getUserColor(message.userId) }}
                              />
                              <span className="text-xs font-medium">
                                User {getShortenedUserId(message.userId)}
                              </span>
                            </div>
                          )}
                          <p>{message.text}</p>
                          <div className={`text-xs mt-1 ${
                            isCurrentUser(message.userId) 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={sendChatMessage}>Send</Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="info" className="flex-1 p-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Collaborative Workspace</CardTitle>
                  <CardDescription>
                    This is a real-time collaborative workspace for mapping and GIS tasks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Room Information</h3>
                    <p className="text-sm text-muted-foreground">
                      You are currently in room <strong>{roomId}</strong> with {connectedUsers.length} users.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Available Tools</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center">
                        <PenTool className="h-4 w-4 mr-2" />
                        Drawing Tools - Create and share drawings
                      </li>
                      <li className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Annotations - Add notes to specific locations
                      </li>
                      <li className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat - Communicate with others in real-time
                      </li>
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Share Workspace</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Invite others to collaborate by sharing this link:
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex justify-between items-center"
                      onClick={copyRoomLink}
                    >
                      <span className="truncate">
                        {`${window.location.origin}${window.location.pathname}?room=${roomId}`}
                      </span>
                      <Copy className="h-4 w-4 ml-2 flex-shrink-0" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}