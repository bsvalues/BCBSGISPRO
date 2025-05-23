import { useState } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function WebSocketTester() {
  const [messageText, setMessageText] = useState('');
  const { isConnected, messages, sendMessage } = useWebSocket();
  
  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Send custom message through WebSocket
      sendMessage({
        type: 'custom',
        text: messageText
      });
      setMessageText('');
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>WebSocket Test Console</CardTitle>
        <CardDescription>
          Test real-time communication using WebSockets
        </CardDescription>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded border p-4">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No messages yet. Try sending one!
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className="p-3 rounded bg-muted">
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant="outline">{msg.type}</Badge>
                    {msg.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(msg, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={!isConnected}
        />
        <Button onClick={handleSendMessage} disabled={!isConnected}>
          Send
        </Button>
      </CardFooter>
    </Card>
  );
}