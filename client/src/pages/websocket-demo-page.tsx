import { useState, useEffect } from "react";
import { useWebSocket, MessageType, ConnectionStatus, WebSocketMessage, createDrawingUpdateMessage } from "@/lib/websocket";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Send, 
  GitCommit, 
  RefreshCw, 
  WifiOff, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightCircle,
  Wifi
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Status badge colors
const statusColors: Record<ConnectionStatus, string> = {
  [ConnectionStatus.CONNECTED]: "bg-green-500",
  [ConnectionStatus.CONNECTING]: "bg-yellow-500",
  [ConnectionStatus.DISCONNECTED]: "bg-gray-500",
  [ConnectionStatus.RECONNECTING]: "bg-yellow-500",
  [ConnectionStatus.ERROR]: "bg-red-500"
};

// Status icons
const StatusIcon = ({ status }: { status: ConnectionStatus }) => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case ConnectionStatus.CONNECTING:
      return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
    case ConnectionStatus.DISCONNECTED:
      return <WifiOff className="h-4 w-4 text-gray-500" />;
    case ConnectionStatus.RECONNECTING:
      return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
    case ConnectionStatus.ERROR:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Wifi className="h-4 w-4" />;
  }
};

// Message component for the messages list
const Message = ({ data, isSent }: { data: any, isSent: boolean }) => {
  return (
    <div className={`flex items-start gap-2 p-2 ${isSent ? "flex-row-reverse" : ""}`}>
      <div className={`rounded-full p-2 ${isSent ? "bg-primary/10" : "bg-muted"}`}>
        {isSent ? <ArrowRightCircle className="h-4 w-4" /> : <GitCommit className="h-4 w-4" />}
      </div>
      <div className={`rounded-lg p-2 max-w-[80%] ${isSent ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <div className="text-xs font-semibold flex justify-between">
          <span>{data.type || "Unknown"}</span>
          <span className="opacity-70">{new Date(data.timestamp || Date.now()).toLocaleTimeString()}</span>
        </div>
        <div className="text-sm mt-1 break-words">
          {typeof data === 'object' ? 
            <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre> : 
            String(data)
          }
        </div>
      </div>
    </div>
  );
};

export default function WebSocketDemoPage() {
  // Use our WebSocket hook
  const { status, lastMessage, send } = useWebSocket();
  
  // State for message history
  const [messages, setMessages] = useState<Array<{data: any, sent: boolean}>>([]);
  
  // State for message input
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<string>(MessageType.PING);
  
  // State for drawing simulation
  const [drawingId, setDrawingId] = useState("drawing-1");
  const [drawingData, setDrawingData] = useState<any>({
    type: "point",
    coordinates: [-123.0, 45.5],
    properties: {
      label: "Test Point",
      timestamp: new Date().toISOString()
    }
  });
  
  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, { data: lastMessage, sent: false }]);
    }
  }, [lastMessage]);
  
  // Handle sending messages
  const handleSendMessage = () => {
    try {
      // Parse JSON input if possible
      let messageData: any;
      try {
        messageData = JSON.parse(messageText);
      } catch {
        // If not valid JSON, use as string
        messageData = messageText;
      }
      
      // Prepare message object
      const message: WebSocketMessage = {
        type: messageType,
        ...(typeof messageData === 'object' ? messageData : { message: messageData }),
        timestamp: new Date().toISOString()
      };
      
      // Send via WebSocket
      if (send(message)) {
        setMessages(prev => [...prev, { data: message, sent: true }]);
        setMessageText("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // Send drawing update
  const sendDrawingUpdate = () => {
    // Randomize coordinates slightly to simulate movement
    const updatedDrawing = {
      ...drawingData,
      coordinates: [
        drawingData.coordinates[0] + (Math.random() * 0.02 - 0.01),
        drawingData.coordinates[1] + (Math.random() * 0.02 - 0.01)
      ],
      properties: {
        ...drawingData.properties,
        timestamp: new Date().toISOString()
      }
    };
    
    // Update local state
    setDrawingData(updatedDrawing);
    
    // Create and send the message
    const message = createDrawingUpdateMessage({
      id: drawingId,
      geometry: updatedDrawing
    }, "demo-page");
    
    if (send(message)) {
      setMessages(prev => [...prev, { data: message, sent: true }]);
    }
  };
  
  // Handle ping test
  const sendPing = () => {
    const pingMessage = {
      type: MessageType.PING,
      timestamp: new Date().toISOString()
    };
    
    if (send(pingMessage)) {
      setMessages(prev => [...prev, { data: pingMessage, sent: true }]);
    }
  };
  
  // Clear message history
  const clearMessages = () => {
    setMessages([]);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WebSocket Demo</h1>
          <p className="text-muted-foreground">Test the WebSocket connection and features</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon status={status} />
          <Badge className={statusColors[status]}>
            {status}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Panel */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Connection Controls</CardTitle>
            <CardDescription>Manage WebSocket connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Connection Status</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <StatusIcon status={status} />
                <span className="font-medium">{status}</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label>Connection URL</Label>
              <div className="p-2 bg-muted rounded-md text-sm font-mono truncate">
                {window.location.protocol === "https:" ? "wss:" : "ws:"}//{window.location.host}/ws
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
            <Button 
              onClick={clearMessages} 
              variant="outline"
            >
              Clear Messages
            </Button>
          </CardFooter>
        </Card>
        
        {/* Tabs for different message types */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Send Messages</CardTitle>
            <CardDescription>Test different WebSocket message types</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="custom">
              <TabsList className="mb-4">
                <TabsTrigger value="custom">Custom Message</TabsTrigger>
                <TabsTrigger value="drawing">Drawing Update</TabsTrigger>
                <TabsTrigger value="ping">Ping Test</TabsTrigger>
              </TabsList>
              
              <TabsContent value="custom">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="messageType">Message Type</Label>
                      <Input
                        id="messageType"
                        value={messageType}
                        onChange={(e) => setMessageType(e.target.value)}
                        placeholder="Enter message type"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="messageContent">Message Content (JSON or text)</Label>
                      <Textarea
                        id="messageContent"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Enter message content (can be JSON or plain text)"
                        className="h-[120px] font-mono text-sm"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    className="w-full" 
                    disabled={status !== ConnectionStatus.CONNECTED || !messageText}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="drawing">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="drawingId">Drawing ID</Label>
                    <Input
                      id="drawingId"
                      value={drawingId}
                      onChange={(e) => setDrawingId(e.target.value)}
                      placeholder="Enter drawing ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drawingJson">Drawing Data (GeoJSON)</Label>
                    <Textarea
                      id="drawingJson"
                      value={JSON.stringify(drawingData, null, 2)}
                      onChange={(e) => {
                        try {
                          setDrawingData(JSON.parse(e.target.value));
                        } catch (error) {
                          console.error("Invalid JSON:", error);
                        }
                      }}
                      placeholder="Enter GeoJSON data"
                      className="h-[120px] font-mono text-sm"
                    />
                  </div>
                  <Button 
                    onClick={sendDrawingUpdate} 
                    className="w-full" 
                    disabled={status !== ConnectionStatus.CONNECTED}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Drawing Update
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="ping">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Send a simple ping message to test the WebSocket connection.
                    The server should respond with a "pong" message.
                  </p>
                  <Button 
                    onClick={sendPing} 
                    className="w-full" 
                    disabled={status !== ConnectionStatus.CONNECTED}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Ping
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Message Log */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Log
            </CardTitle>
            <CardDescription>Real-time WebSocket messages</CardDescription>
            <Separator />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <Message 
                      key={index} 
                      data={msg.data} 
                      isSent={msg.sent} 
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                    <p>No messages yet. Send a message to see it appear here.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}