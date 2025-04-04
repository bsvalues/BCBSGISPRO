import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Info } from 'lucide-react';
import { useWebSocket, MessageType, ConnectionStatus, createChatMessage } from '@/lib/websocket';

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  isSystem?: boolean;
}

interface CollaborativeChatProps {
  roomId: string;
  height?: string | number;
  className?: string;
}

// Helper to get user initials for avatar
function getUserInitials(userId: string): string {
  return userId.substring(0, 2).toUpperCase();
}

// Helper to generate a color based on user ID
function getUserColor(userId: string): string {
  // Generate a color based on the hash of the user ID
  const hash = Array.from(userId).reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const h = Math.abs(hash) % 360; // Hue (0-360)
  const s = 70 + (Math.abs(hash) % 20); // Saturation (70-90%)
  const l = 40 + (Math.abs(hash) % 10); // Lightness (40-50%)
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function CollaborativeChat({ roomId, height = 400, className = '' }: CollaborativeChatProps) {
  // WebSocket connection
  const { send, lastMessage, status, userId } = useWebSocket(roomId);
  
  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Current message input
  const [messageInput, setMessageInput] = useState('');
  
  // Scroll area reference for auto-scrolling
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Track if the user has seen all messages
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    // Only process chat messages
    if (lastMessage.type !== MessageType.CHAT) return;
    
    try {
      // Create ChatMessage from the WebSocket message
      const newMessage: ChatMessage = {
        id: lastMessage.id || crypto.randomUUID(),
        content: lastMessage.data?.message || '',
        sender: lastMessage.source || 'unknown',
        timestamp: lastMessage.timestamp || new Date().toISOString()
      };
      
      // Add to messages state
      setMessages(prev => [...prev, newMessage]);
      
      // Mark as unread if they are not at the bottom of the chat
      if (scrollAreaRef.current) {
        const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
        const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
        
        if (!isAtBottom) {
          setHasUnreadMessages(true);
        }
      }
    } catch (err) {
      console.error('Error processing chat message:', err);
    }
  }, [lastMessage]);
  
  // Add system message when connection status changes
  useEffect(() => {
    const timestamp = new Date().toISOString();
    let systemMessage: ChatMessage | null = null;
    
    if (status === ConnectionStatus.CONNECTED) {
      systemMessage = {
        id: crypto.randomUUID(),
        content: 'Connected to chat',
        sender: 'system',
        timestamp,
        isSystem: true
      };
    } else if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
      systemMessage = {
        id: crypto.randomUUID(),
        content: 'Disconnected from chat',
        sender: 'system',
        timestamp,
        isSystem: true
      };
    }
    
    if (systemMessage) {
      setMessages(prev => [...prev, systemMessage!]);
    }
  }, [status]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
      
      if (isAtBottom || messages[messages.length - 1].sender === userId) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        setHasUnreadMessages(false);
      }
    }
  }, [messages, userId]);
  
  // Send message handler
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // Create and send the message
    const chatMessage = createChatMessage(messageInput, userId, roomId);
    send(chatMessage);
    
    // Clear input
    setMessageInput('');
  };
  
  // Handle keyboard submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Scroll to bottom handler
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      setHasUnreadMessages(false);
    }
  };
  
  // Format timestamp
  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Collaboration Chat</span>
          <Badge 
            variant={status === ConnectionStatus.CONNECTED ? "outline" : "destructive"} 
            className="text-xs"
          >
            {status === ConnectionStatus.CONNECTED ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <ScrollArea 
          ref={scrollAreaRef} 
          className="p-4" 
          style={{ height: typeof height === 'number' ? `${height - 120}px` : height }}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start gap-2 ${message.isSystem ? 'justify-center' : message.sender === userId ? 'justify-end' : 'justify-start'}`}>
                  {message.isSystem ? (
                    <div className="text-xs text-center py-1 px-3 rounded-full bg-muted text-muted-foreground">
                      {message.content}
                    </div>
                  ) : message.sender === userId ? (
                    <div className="flex flex-col items-end space-y-1 max-w-[80%]">
                      <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-tr-none">
                        {message.content}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                    </div>
                  ) : (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback style={{ backgroundColor: getUserColor(message.sender) }}>
                          {getUserInitials(message.sender)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 max-w-[80%]">
                        <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                          {message.content}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {message.sender.substring(0, 8)} • {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {hasUnreadMessages && (
          <div className="absolute bottom-2 right-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="rounded-full h-8 px-2" 
              onClick={scrollToBottom}
            >
              New messages ↓
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-2">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={status !== ConnectionStatus.CONNECTED}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={status !== ConnectionStatus.CONNECTED || !messageInput.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}