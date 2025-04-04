import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Users, Wifi, WifiOff, Send } from 'lucide-react';
import { useWebSocket, MessageTypeEnum, ConnectionStatusEnum } from '@/lib/websocket';
import { cn } from '@/lib/utils';

/**
 * Simple WebSocket demonstration component for real-time collaboration
 */
export function WebSocketDemo() {
  // State for room and user information
  const [roomId, setRoomId] = useState('demo-room');
  const [username, setUsername] = useState(`User_${Math.floor(Math.random() * 1000)}`);
  const [messageText, setMessageText] = useState('');
  
  // Ref for auto-scrolling messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize WebSocket connection
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
    userId: Math.random().toString(36).substring(2, 15),
    username
  });
  
  // Filter chat-related messages
  const chatMessages = messages.filter(
    msg => msg.type === MessageTypeEnum.CHAT || msg.type === MessageTypeEnum.CHAT_MESSAGE
  );
  
  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Function to handle connection and joining a room
  const handleConnect = () => {
    if (status === ConnectionStatusEnum.DISCONNECTED || status === ConnectionStatusEnum.ERROR) {
      connect();
    }
    
    if (status === ConnectionStatusEnum.CONNECTED && !currentRoom) {
      joinRoom(roomId);
    }
  };
  
  // Function to handle disconnection
  const handleDisconnect = () => {
    if (currentRoom) {
      leaveRoom();
    }
    disconnect();
  };
  
  // Function to send a chat message
  const handleSendMessage = () => {
    if (!messageText.trim() || !currentRoom) return;
    
    sendMessage({
      type: MessageTypeEnum.CHAT,
      roomId: currentRoom,
      payload: {
        text: messageText
      }
    });
    
    setMessageText('');
  };
  
  // Handle keyboard events for message input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format message timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Render connection status badge
  const getStatusBadge = () => {
    switch (status) {
      case ConnectionStatusEnum.CONNECTED:
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 flex items-center gap-1">
            <Wifi className="h-3 w-3" /> Connected
          </Badge>
        );
      case ConnectionStatusEnum.CONNECTING:
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 flex items-center gap-1">
            <Wifi className="h-3 w-3 animate-pulse" /> Connecting
          </Badge>
        );
      case ConnectionStatusEnum.DISCONNECTED:
        return (
          <Badge variant="outline" className="bg-slate-500/10 text-slate-500 flex items-center gap-1">
            <WifiOff className="h-3 w-3" /> Disconnected
          </Badge>
        );
      case ConnectionStatusEnum.ERROR:
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 flex items-center gap-1">
            <WifiOff className="h-3 w-3" /> Error
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Real-time Collaboration</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Collaborate with other users in real-time using WebSockets
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="username">Your Name</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              disabled={status === ConnectionStatusEnum.CONNECTED}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="room-id">Room ID</Label>
            <Input
              id="room-id"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              disabled={currentRoom !== ''}
              className="mt-1"
            />
          </div>
          
          <div className="flex items-end gap-2">
            {status !== ConnectionStatusEnum.CONNECTED || !currentRoom ? (
              <Button 
                onClick={handleConnect} 
                disabled={!roomId || !username}
                className="flex-1"
              >
                {status !== ConnectionStatusEnum.CONNECTED ? 'Connect' : 'Join Room'}
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                className="flex-1"
              >
                {currentRoom ? 'Leave Room' : 'Disconnect'}
              </Button>
            )}
            
            <Button 
              onClick={clearMessages}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </div>
        
        {/* Current Room Display */}
        {currentRoom && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Room:</span>
            <Badge variant="secondary">{currentRoom}</Badge>
          </div>
        )}
        
        <Separator />
        
        {/* Chat Messages */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Messages</h3>
          </div>
          
          <ScrollArea className="h-[300px] border rounded-md p-4">
            {chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {status !== ConnectionStatusEnum.CONNECTED ? 
                  'Connect to see messages' : 
                  currentRoom ? 'No messages yet' : 'Join a room to start chatting'}
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      msg.userId === username 
                        ? "ml-auto bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{msg.username || 'Unknown'}</span>
                      <span className="opacity-70">
                        {msg.timestamp ? formatTime(msg.timestamp) : ''}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">
                      {msg.payload?.text || msg.payload?.message || msg.data?.text || msg.data?.message || ''}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          
          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              disabled={status !== ConnectionStatusEnum.CONNECTED || !currentRoom}
              className="resize-none"
              rows={3}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || status !== ConnectionStatusEnum.CONNECTED || !currentRoom}
              className="self-end"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}