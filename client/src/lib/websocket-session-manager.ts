import { WebSocketMessage, ConnectionStatusEnum, MessageTypeEnum } from './websocket';

/**
 * Represents a user in a collaborative session
 */
export interface CollaborativeUser {
  id: string;
  username: string;
  rooms: Set<string>;
  cursorPosition?: { x: number, y: number };
  lastActivity: number;
  status: ConnectionStatusEnum;
}

/**
 * Room state for a collaboration session
 */
export interface CollaborativeRoom {
  id: string;
  users: Map<string, CollaborativeUser>;
  features: Map<string, any>;
  annotations: Map<string, any>;
  createdAt: number;
  lastActivity: number;
}

/**
 * Session manager for tracking users across WebSocket connections
 */
class WebSocketSessionManager {
  // Singleton instance
  private static _instance: WebSocketSessionManager | null = null;
  
  // Maps room IDs to room data
  private rooms: Map<string, CollaborativeRoom> = new Map();
  
  // Maps user IDs to user data
  private users: Map<string, CollaborativeUser> = new Map();
  
  // Current user info
  private currentUserId: string = '';
  private currentUsername: string = '';
  
  // Callbacks for various events
  private callbacks: {
    onRoomUpdated: Array<(roomId: string, room: CollaborativeRoom) => void>;
    onUserUpdated: Array<(userId: string, user: CollaborativeUser) => void>;
    onMessage: Array<(message: WebSocketMessage) => void>;
    onError: Array<(error: Error) => void>;
  };
  
  /**
   * Singleton accessor
   */
  public static getInstance(): WebSocketSessionManager {
    if (!WebSocketSessionManager._instance) {
      WebSocketSessionManager._instance = new WebSocketSessionManager();
    }
    return WebSocketSessionManager._instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.callbacks = {
      onRoomUpdated: [],
      onUserUpdated: [],
      onMessage: [],
      onError: []
    };
    
    console.log('WebSocketSessionManager initialized');
  }
  
  /**
   * Set current user information
   */
  public setCurrentUser(userId: string, username: string): void {
    this.currentUserId = userId;
    this.currentUsername = username;
    
    // Create or update user record
    this.getOrCreateUser(userId, username);
  }
  
  /**
   * Get current user information
   */
  public getCurrentUser(): { id: string, username: string } {
    return {
      id: this.currentUserId,
      username: this.currentUsername
    };
  }
  
  /**
   * Process a WebSocket message to update the session state
   */
  public processMessage(message: WebSocketMessage): void {
    try {
      const { type, userId, username, roomId, payload } = message;
      
      if (!userId || !roomId) {
        return; // Invalid message
      }
      
      // Ensure user and room exist
      const user = this.getOrCreateUser(userId, username || `User${userId.substring(0, 4)}`);
      this.ensureRoomExists(roomId);
      
      // Reference to the room
      const room = this.rooms.get(roomId)!;
      
      // Update last activity for room
      room.lastActivity = Date.now();
      
      // Update user's last activity
      user.lastActivity = Date.now();
      
      // User joining room
      if (type === MessageTypeEnum.JOIN) {
        user.rooms.add(roomId);
        room.users.set(userId, user);
        this.notifyRoomUpdated(roomId, room);
        this.notifyUserUpdated(userId, user);
      }
      // User leaving room
      else if (type === MessageTypeEnum.LEAVE) {
        user.rooms.delete(roomId);
        room.users.delete(userId);
        this.notifyRoomUpdated(roomId, room);
        this.notifyUserUpdated(userId, user);
      }
      // Cursor movement
      else if (type === MessageTypeEnum.CURSOR_MOVE && payload?.position) {
        user.cursorPosition = payload.position;
        this.notifyUserUpdated(userId, user);
      }
      // Feature created/updated
      else if (type === MessageTypeEnum.FEATURE_CREATED || type === MessageTypeEnum.FEATURE_UPDATED) {
        if (payload?.featureId && payload?.feature) {
          room.features.set(payload.featureId, payload.feature);
          this.notifyRoomUpdated(roomId, room);
        }
      }
      // Feature deleted
      else if (type === MessageTypeEnum.FEATURE_DELETED) {
        if (payload?.featureId) {
          room.features.delete(payload.featureId);
          this.notifyRoomUpdated(roomId, room);
        }
      }
      // Annotation created/updated
      else if (type === MessageTypeEnum.ANNOTATION_CREATED || type === MessageTypeEnum.ANNOTATION_UPDATED) {
        if (payload?.annotationId && payload?.annotation) {
          room.annotations.set(payload.annotationId, payload.annotation);
          this.notifyRoomUpdated(roomId, room);
        }
      }
      // Annotation deleted
      else if (type === MessageTypeEnum.ANNOTATION_DELETED) {
        if (payload?.annotationId) {
          room.annotations.delete(payload.annotationId);
          this.notifyRoomUpdated(roomId, room);
        }
      }
      // Status update
      else if (type === MessageTypeEnum.STATUS) {
        if (payload?.status) {
          user.status = payload.status as ConnectionStatusEnum;
          this.notifyUserUpdated(userId, user);
        }
      }
      
      // Notify message listeners
      this.callbacks.onMessage.forEach(callback => callback(message));
      
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      this.callbacks.onError.forEach(callback => callback(error as Error));
    }
  }
  
  /**
   * Register a callback for room updates
   */
  public onRoomUpdated(callback: (roomId: string, room: CollaborativeRoom) => void): () => void {
    this.callbacks.onRoomUpdated.push(callback);
    return () => {
      this.callbacks.onRoomUpdated = this.callbacks.onRoomUpdated.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Register a callback for user updates
   */
  public onUserUpdated(callback: (userId: string, user: CollaborativeUser) => void): () => void {
    this.callbacks.onUserUpdated.push(callback);
    return () => {
      this.callbacks.onUserUpdated = this.callbacks.onUserUpdated.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Register a callback for WebSocket messages
   */
  public onMessage(callback: (message: WebSocketMessage) => void): () => void {
    this.callbacks.onMessage.push(callback);
    return () => {
      this.callbacks.onMessage = this.callbacks.onMessage.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Register a callback for errors
   */
  public onError(callback: (error: Error) => void): () => void {
    this.callbacks.onError.push(callback);
    return () => {
      this.callbacks.onError = this.callbacks.onError.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Get all users in a room
   */
  public getRoomUsers(roomId: string): CollaborativeUser[] {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return [];
    }
    
    return Array.from(room.users.values());
  }
  
  /**
   * Get a specific user by ID
   */
  public getUser(userId: string): CollaborativeUser | undefined {
    return this.users.get(userId);
  }
  
  /**
   * Get a room by ID
   */
  public getRoom(roomId: string): CollaborativeRoom | undefined {
    return this.rooms.get(roomId);
  }
  
  /**
   * Get all rooms
   */
  public getAllRooms(): CollaborativeRoom[] {
    return Array.from(this.rooms.values());
  }
  
  /**
   * Create or retrieve a user
   */
  private getOrCreateUser(userId: string, username: string): CollaborativeUser {
    const existingUser = this.users.get(userId);
    
    if (existingUser) {
      // Update username if changed
      if (existingUser.username !== username) {
        existingUser.username = username;
      }
      return existingUser;
    }
    
    // Create new user
    const newUser: CollaborativeUser = {
      id: userId,
      username,
      rooms: new Set(),
      lastActivity: Date.now(),
      status: ConnectionStatusEnum.CONNECTED
    };
    
    this.users.set(userId, newUser);
    return newUser;
  }
  
  /**
   * Ensure a room exists
   */
  private ensureRoomExists(roomId: string): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        features: new Map(),
        annotations: new Map(),
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }
  }
  
  /**
   * Notify room update listeners
   */
  private notifyRoomUpdated(roomId: string, room: CollaborativeRoom): void {
    this.callbacks.onRoomUpdated.forEach(callback => callback(roomId, room));
  }
  
  /**
   * Notify user update listeners
   */
  private notifyUserUpdated(userId: string, user: CollaborativeUser): void {
    this.callbacks.onUserUpdated.forEach(callback => callback(userId, user));
  }
  
  /**
   * Clear session data
   */
  public clear(): void {
    this.rooms.clear();
    this.users.clear();
  }
}

export const getSessionManager = WebSocketSessionManager.getInstance;

/**
 * React hook for using the session manager
 */
export function useSessionManager() {
  return getSessionManager();
}