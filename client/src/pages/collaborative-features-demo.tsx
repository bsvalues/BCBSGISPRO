import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPresence } from '@/components/collaborative/user-presence';
import { RoomActivity } from '@/components/collaborative/room-activity';
import { CollaborativeCursors } from '@/components/collaborative/collaborative-cursors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { generateId } from '@/lib/utils';
import { ConnectionStatusEnum } from '@/lib/websocket';
import { useEnhancedWebSocket } from '@/hooks/use-enhanced-websocket';
import { useSessionManager, CollaborativeUser } from '@/lib/websocket-session-manager';
import { useToast } from '@/hooks/use-toast';

/**
 * Collaborative Features Demo Page
 */
export default function CollaborativeFeaturesDemo() {
  // Use refs for stable IDs
  const userIdRef = useRef<string>(generateId(8));
  const usernameRef = useRef<string>(`User_${generateId(4)}`);
  // State for UI and user inputs
  const [username, setUsername] = useState<string>(usernameRef.current);
  const [roomId, setRoomId] = useState<string>('demo-room');
  const [currentTab, setCurrentTab] = useState<string>('user-presence');
  
  // Reference for cursor container
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Access toast
  const { toast } = useToast();
  
  // Use session manager - get a reference to avoid recreating on each render
  const sessionManagerRef = useRef(useSessionManager());
  const sessionManager = sessionManagerRef.current;
  
  // Use enhanced WebSocket
  const websocket = useEnhancedWebSocket({
    roomId,
    userId: userIdRef.current,
    username: usernameRef.current,
    autoJoin: false,
    onRoomJoined: (joinedRoomId) => {
      toast({
        title: 'Room Joined',
        description: `You've joined room: ${joinedRoomId}`,
      });
    },
    onUserJoined: (user) => {
      toast({
        title: 'User Joined',
        description: `${user.username} has joined the room`,
        variant: 'default',
      });
    },
    onUserLeft: (user) => {
      toast({
        title: 'User Left',
        description: `${user.username} has left the room`,
        variant: 'destructive',
      });
    },
    onStatusChange: (status) => {
      if (status === ConnectionStatusEnum.CONNECTED) {
        toast({
          title: 'Connected',
          description: 'WebSocket connection established',
          variant: 'default',
        });
      } else if (status === ConnectionStatusEnum.DISCONNECTED || status === ConnectionStatusEnum.ERROR) {
        toast({
          title: 'Disconnected',
          description: 'WebSocket connection lost',
          variant: 'destructive',
        });
      }
    }
  });
  
  // Connect the WebSocket when the component mounts - using ref to stabilize
  const websocketRef = useRef(websocket);
  
  useEffect(() => {
    websocketRef.current = websocket;
  }, [websocket]);
  
  useEffect(() => {
    websocketRef.current.connect();
  }, []);
  
  // Handle user selection
  const handleUserSelected = useCallback((user: CollaborativeUser) => {
    toast({
      title: 'User Selected',
      description: `You selected ${user.username}`,
    });
  }, [toast]);
  
  // Handle joining room manually
  const handleJoinRoom = useCallback(() => {
    websocket.joinRoom(roomId);
  }, [websocket, roomId]);
  
  // Handle leaving room manually
  const handleLeaveRoom = useCallback(() => {
    websocket.leaveRoom();
  }, [websocket]);
  
  // Handle username change
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    sessionManager.setCurrentUser(userIdRef.current, newUsername);
  }, [sessionManager]);
  
  // Handle room ID change
  const handleRoomIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(e.target.value);
  }, []);
  
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Collaborative Features Demo</CardTitle>
            <CardDescription>
              Explore real-time collaboration capabilities with WebSocket-based components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Your Username</Label>
                  <Input 
                    id="username" 
                    value={username} 
                    onChange={handleUsernameChange} 
                    placeholder="Enter your username" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomId">Room ID</Label>
                  <Input 
                    id="roomId" 
                    value={roomId} 
                    onChange={handleRoomIdChange} 
                    placeholder="Enter room ID" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <div className="flex items-center gap-2 text-sm">
                  <span>Connection Status:</span>
                  <Badge 
                    variant={websocket.status === ConnectionStatusEnum.CONNECTED ? 'default' : 'outline'}
                    className="capitalize"
                  >
                    {websocket.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Current Room:</span>
                  {websocket.currentRoom ? (
                    <Badge variant="secondary">{websocket.currentRoom}</Badge>
                  ) : (
                    <Badge variant="outline">None</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    onClick={handleJoinRoom} 
                    disabled={
                      websocket.status !== ConnectionStatusEnum.CONNECTED || 
                      websocket.currentRoom === roomId
                    }
                  >
                    Join Room
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleLeaveRoom} 
                    disabled={!websocket.currentRoom}
                  >
                    Leave Room
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              User ID: <code className="bg-muted px-1 py-0.5 rounded">{userIdRef.current}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Connected Users:
              </span>
              <UserPresence 
                roomId={roomId} 
                userId={userIdRef.current} 
                username={username}
                compact 
              />
            </div>
          </CardFooter>
        </Card>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="user-presence">User Presence</TabsTrigger>
            <TabsTrigger value="room-activity">Room Activity</TabsTrigger>
            <TabsTrigger value="collaborative-cursors">Collaborative Cursors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user-presence" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Presence Component</CardTitle>
                <CardDescription>
                  Track and visualize users in your collaborative workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserPresence 
                  roomId={roomId} 
                  userId={userIdRef.current} 
                  username={username} 
                  onUserSelected={handleUserSelected}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="room-activity" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Room Activity Component</CardTitle>
                <CardDescription>
                  Monitor collaboration activity and metrics for rooms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RoomActivity 
                    roomId={roomId} 
                    onJoinRoom={handleJoinRoom}
                  />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">List View Example</h3>
                    <Separator />
                    <RoomActivity 
                      roomId={roomId} 
                      displayMode="list-item"
                      onJoinRoom={handleJoinRoom}
                    />
                    <RoomActivity 
                      roomId={`${roomId}-2`} 
                      displayMode="list-item"
                      onJoinRoom={(newRoomId) => setRoomId(newRoomId)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="collaborative-cursors" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Collaborative Cursors Component</CardTitle>
                <CardDescription>
                  See and interact with other users' cursors in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={containerRef}
                  className="relative border-2 border-dashed border-muted-foreground/25 rounded-md h-96 overflow-hidden" 
                >
                  <div className="absolute inset-0 p-4 flex flex-col items-center justify-center">
                    <p className="text-center text-muted-foreground">
                      Move your cursor around this area to see real-time cursor sharing.
                      <br />
                      The position will be broadcast to other users in the same room.
                    </p>
                    
                    {websocket.status === ConnectionStatusEnum.CONNECTED && websocket.currentRoom ? (
                      <Badge className="mt-4" variant="default">
                        Active - Try moving your cursor
                      </Badge>
                    ) : (
                      <Badge className="mt-4" variant="outline">
                        Join a room to see cursors
                      </Badge>
                    )}
                  </div>
                  
                  {containerRef.current && (
                    <CollaborativeCursors 
                      roomId={roomId}
                      containerRef={containerRef}
                      showUsernames
                    />
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground">
                  Cursor positions are throttled to minimize network traffic
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}