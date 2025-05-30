import { WebSocketMessage } from '@/hooks/use-enhanced-websocket';

/**
 * Session information for WebSocket collaborative sessions
 */
export interface CollaborationSession {
  roomId: string;
  username: string;
  sessionId: string;
  joinedAt: Date;
  userColor: string;
  userIcon?: string;
}

/**
 * User information for collaboration
 */
export interface CollaborationUser {
  id: string;
  username: string;
  userColor: string;
  userIcon?: string;
  cursorPosition?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  lastActivity: Date;
}

/**
 * WebSocketSessionManager
 * 
 * Manages WebSocket session state and user tracking for collaborative features.
 */
export class WebSocketSessionManager {
  private session: CollaborationSession | null = null;
  private users: Map<string, CollaborationUser> = new Map();
  private messageHandlers: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  
  /**
   * Creates a new session
   */
  public createSession(roomId: string, username: string = 'Anonymous'): CollaborationSession {
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Generate user color
    const userColor = this.generateRandomColor();
    
    // Create session
    this.session = {
      roomId,
      username,
      sessionId,
      joinedAt: new Date(),
      userColor
    };
    
    // Add self to users
    this.addUser(sessionId, username, userColor);
    
    return this.session;
  }
  
  /**
   * Adds a user to the session
   */
  public addUser(id: string, username: string, userColor: string, userIcon?: string): void {
    this.users.set(id, {
      id,
      username,
      userColor,
      userIcon,
      isActive: true,
      lastActivity: new Date()
    });
    
    // Notify handlers of user joined
    this.notifyHandlers('user-joined', {
      type: 'user-joined',
      userId: id,
      username,
      userColor,
      userIcon
    });
  }
  
  /**
   * Updates a user's cursor position
   */
  public updateUserCursor(id: string, lat: number, lng: number): void {
    const user = this.users.get(id);
    
    if (user) {
      user.cursorPosition = { lat, lng };
      user.lastActivity = new Date();
      user.isActive = true;
      
      this.users.set(id, user);
    }
  }
  
  /**
   * Gets all active users in the session
   */
  public getActiveUsers(): CollaborationUser[] {
    return Array.from(this.users.values())
      .filter(user => user.isActive)
      .sort((a, b) => a.username.localeCompare(b.username));
  }
  
  /**
   * Gets the current session information
   */
  public getSession(): CollaborationSession | null {
    return this.session;
  }
  
  /**
   * Registers a message handler for a specific message type
   */
  public registerHandler(messageType: string, handler: (message: WebSocketMessage) => void): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    
    this.messageHandlers.get(messageType)!.push(handler);
  }
  
  /**
   * Unregisters a message handler
   */
  public unregisterHandler(messageType: string, handler: (message: WebSocketMessage) => void): void {
    if (this.messageHandlers.has(messageType)) {
      const handlers = this.messageHandlers.get(messageType)!;
      const index = handlers.indexOf(handler);
      
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      
      if (handlers.length === 0) {
        this.messageHandlers.delete(messageType);
      }
    }
  }
  
  /**
   * Handles an incoming WebSocket message
   */
  public handleMessage(message: WebSocketMessage): void {
    const { type } = message;
    
    // Update user activity
    if (message.userId && this.users.has(message.userId)) {
      const user = this.users.get(message.userId)!;
      user.lastActivity = new Date();
      user.isActive = true;
      this.users.set(message.userId, user);
    }
    
    // Handle specific message types
    switch (type) {
      case 'user-joined':
        if (message.userId && message.username) {
          this.addUser(
            message.userId,
            message.username,
            message.userColor || this.generateRandomColor(),
            message.userIcon
          );
        }
        break;
        
      case 'user-left':
        if (message.userId && this.users.has(message.userId)) {
          this.users.delete(message.userId);
          
          // Notify handlers
          this.notifyHandlers('user-left', {
            type: 'user-left',
            userId: message.userId
          });
        }
        break;
        
      case 'cursor-update':
        if (message.userId && message.position) {
          this.updateUserCursor(
            message.userId,
            message.position.lat,
            message.position.lng
          );
          
          // Notify handlers
          this.notifyHandlers('cursor-update', message);
        }
        break;
    }
    
    // Notify all handlers for this message type
    this.notifyHandlers(type, message);
  }
  
  /**
   * Notifies all handlers for a message type
   */
  private notifyHandlers(messageType: string, message: WebSocketMessage): void {
    if (this.messageHandlers.has(messageType)) {
      for (const handler of this.messageHandlers.get(messageType)!) {
        try {
          handler(message);
        } catch (err) {
          console.error(`Error in WebSocket message handler for "${messageType}":`, err);
        }
      }
    }
  }
  
  /**
   * Generates a random color for users
   */
  private generateRandomColor(): string {
    // Use a pleasing set of pastel colors
    const colors = [
      '#4C6EF5', // Indigo
      '#DA77F2', // Purple
      '#FF8787', // Pink
      '#6AAFE6', // Blue
      '#63E6BE', // Mint
      '#FFA94D', // Orange
      '#A9E34B', // Green
      '#F783AC', // Rose
      '#9775FA', // Violet
      '#748FFC', // Blue
      '#20C997', // Teal
      '#FF922B'  // Orange
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Prepares a WebSocket message with session information
   */
  public prepareMessage(type: string, payload?: any): WebSocketMessage {
    return {
      type,
      roomId: this.session?.roomId,
      userId: this.session?.sessionId,
      username: this.session?.username,
      userColor: this.session?.userColor,
      timestamp: new Date().toISOString(),
      payload
    };
  }
}

// Create a singleton instance
export const sessionManager = new WebSocketSessionManager();

export default sessionManager;