import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  useWebSocket, 
  MessageType, 
  ConnectionStatus,
  createChatMessage,
  WebSocketMessage
} from '@/lib/websocket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  WifiOff, 
  Send, 
  User, 
  Users, 
  Globe 
} from 'lucide-react';
import { CollaborativeMap } from '@/components/maps/collaborative-map';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isMe: boolean;
}

export default function WebSocketDemoPage() {
  // Generate a user ID for this session
  const [userId] = useState(() => {
    const storedId = localStorage.getItem('bentonGisUserId');
    if (storedId) return storedId;
    
    const newId = uuidv4();
    localStorage.setItem('bentonGisUserId', newId);
    return newId;
  });
  
  // User nickname
  const [nickname, setNickname] = useState(() => {
    const storedNickname = localStorage.getItem('bentonGisNickname');
    return storedNickname || `User_${userId.substring(0, 5)}`;
  });
  
  // Chat message and room
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [roomId, setRoomId] = useState('demo-room');
  const [joinedRoom, setJoinedRoom] = useState('demo-room');
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  
  // Message area ref for auto-scrolling
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to WebSocket
  const { status, lastMessage, send } = useWebSocket(MessageType.CHAT, joinedRoom);
  
  // Handle incoming chat messages
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== MessageType.CHAT) return;
    
    const { data, source, timestamp } = lastMessage;
    
    if (data?.message && source) {
      const isMe = source === userId;
      
      setChatMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          sender: isMe ? nickname : data.sender || 'Unknown',
          content: data.message,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          isMe
        }
      ]);
      
      // Scroll to bottom
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Update connected users if present
    if (data?.connectedUsers) {
      setConnectedUsers(data.connectedUsers);
    }
  }, [lastMessage, userId, nickname]);
  
  // Save nickname when it changes
  useEffect(() => {
    localStorage.setItem('bentonGisNickname', nickname);
  }, [nickname]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Send a chat message
  const sendChatMessage = () => {
    if (!message.trim()) return;
    
    const messageObj = createChatMessage(message, userId, joinedRoom);
    // Add sender nickname to data
    messageObj.data = {
      ...messageObj.data,
      sender: nickname
    };
    
    const success = send(messageObj);
    
    if (success) {
      setMessage('');
    }
  };
  
  // Join a room
  const joinRoom = () => {
    if (!roomId.trim()) return;
    setJoinedRoom(roomId);
    setChatMessages([]);
    
    // Add system message
    setChatMessages([{
      id: uuidv4(),
      sender: 'System',
      content: `You joined room: ${roomId}`,
      timestamp: new Date(),
      isMe: false
    }]);
  };
  
  // Connection status indicator
  const ConnectionStatusIndicator = () => {
    let Icon;
    let label;
    let color;
    
    switch (status) {
      case ConnectionStatus.CONNECTED:
        Icon = CheckCircle;
        label = 'Connected';
        color = 'bg-green-500';
        break;
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        Icon = Loader2;
        label = status === ConnectionStatus.CONNECTING ? 'Connecting' : 'Reconnecting';
        color = 'bg-yellow-500';
        break;
      case ConnectionStatus.ERROR:
        Icon = AlertCircle;
        label = 'Connection Error';
        color = 'bg-red-500';
        break;
      default:
        Icon = WifiOff;
        label = 'Disconnected';
        color = 'bg-gray-500';
    }
    
    return (
      <Badge className={`${color} gap-1`}>
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </Badge>
    );
  };
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-2">WebSocket Demo</h1>
      <p className="text-muted-foreground mb-6">
        Test real-time communication using WebSockets
      </p>
      
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="chat">Chat Demo</TabsTrigger>
          <TabsTrigger value="map">Collaborative Map</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Real-time Chat</CardTitle>
                  <CardDescription>
                    Connect with others in room: <strong>{joinedRoom}</strong>
                  </CardDescription>
                </div>
                <ConnectionStatusIndicator />
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="flex flex-col gap-4">
                {/* Room controls */}
                <div className="px-6 pt-2 flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="nickname">Your Nickname</Label>
                    <Input 
                      id="nickname" 
                      placeholder="Enter your nickname" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)} 
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="room-id">Room ID</Label>
                    <Input 
                      id="room-id" 
                      placeholder="Enter room ID" 
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                    />
                  </div>
                  <Button onClick={joinRoom} disabled={status !== ConnectionStatus.CONNECTED}>
                    Join Room
                  </Button>
                </div>
                
                {/* Connected users */}
                <div className="px-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{connectedUsers.length || 1} user{(connectedUsers.length || 1) !== 1 ? 's' : ''} connected</span>
                </div>
                
                {/* Messages */}
                <ScrollArea className="h-[400px] px-6">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <Globe className="h-10 w-10 mx-auto opacity-20" />
                        <p>No messages yet</p>
                        <p className="text-xs">Start chatting to see messages appear here</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      {chatMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`
                              max-w-[80%] rounded-lg px-4 py-2
                              ${msg.isMe 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                              }
                            `}
                          >
                            {!msg.isMe && (
                              <div className="flex items-center gap-1 mb-1">
                                <User className="h-3 w-3" />
                                <span className="text-xs font-medium">{msg.sender}</span>
                              </div>
                            )}
                            <p className="break-words">{msg.content}</p>
                            <p className="text-xs text-right mt-1 opacity-70">
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
            
            <CardFooter className="pt-6">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChatMessage();
                }}
                className="w-full flex gap-2"
              >
                <Input 
                  placeholder="Type a message..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={status !== ConnectionStatus.CONNECTED}
                />
                <Button 
                  type="submit" 
                  disabled={!message.trim() || status !== ConnectionStatus.CONNECTED}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </form>
            </CardFooter>
          </Card>
          
          <div className="bg-muted rounded-md p-4">
            <h3 className="font-medium mb-2">How This Works</h3>
            <p className="text-sm text-muted-foreground">
              This demo uses WebSockets to enable real-time communication. When you send a message, 
              it's transmitted to the server and then broadcasted to all clients in the same room.
              The connection automatically reconnects if interrupted.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="map">
          <div className="space-y-6">
            <CollaborativeMap roomId="demo-map" height="600px" />
            
            <div className="bg-muted rounded-md p-4">
              <h3 className="font-medium mb-2">How Collaborative Mapping Works</h3>
              <p className="text-sm text-muted-foreground">
                The collaborative map uses WebSockets to synchronize drawing actions between users.
                When you create, update, or delete features, these changes are sent to all users in the same room.
                Different colors indicate which user created each feature.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}