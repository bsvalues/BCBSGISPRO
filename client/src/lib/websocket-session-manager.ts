import { WebSocketMessage, MessageTypeEnum } from '@/lib/websocket';

/**
 * User information for collaborative editing
 */
export interface CollaborativeUser {
  id: string;
  username?: string;
  lastActivity: number;
  rooms: Set<string>;
  cursor?: {
    lng: number;
    lat: number;
  };
}

/**
 * Room information for collaborative editing
 */
export interface CollaborativeRoom {
  id: string;
  users: Map<string, CollaborativeUser>;
  features: Map<string, any>; // Map of features indexed by ID
  annotations: Map<string, any>; // Map of annotations indexed by ID
  lastActivity: number;
}

/**
 * Type for room update callback
 */
type RoomUpdateCallback = (roomId: string, room: CollaborativeRoom) => void;

/**
 * Type for user update callback
 */
type UserUpdateCallback = (userId: string, user: CollaborativeUser) => void;

/**
 * Type for message callback
 */
type MessageCallback = (message: WebSocketMessage) => void;

/**
 * Singleton class for managing WebSocket collaboration sessions
 */
export class WebSocketSessionManager {
  private static instance: WebSocketSessionManager;
  
  private rooms: Map<string, CollaborativeRoom> = new Map();
  private users: Map<string, CollaborativeUser> = new Map();
  private roomUpdateListeners: Set<RoomUpdateCallback> = new Set();
  private userUpdateListeners: Set<UserUpdateCallback> = new Set();
  private messageListeners: Set<MessageCallback> = new Set();
  private currentUserId: string = '';
  private currentUsername: string = '';
  
  /**
   * Get the singleton instance of the WebSocketSessionManager
   */
  public static getInstance(): WebSocketSessionManager {
    if (!WebSocketSessionManager.instance) {
      WebSocketSessionManager.instance = new WebSocketSessionManager();
    }
    return WebSocketSessionManager.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize empty
  }
  
  /**
   * Set the current user information
   */
  public setCurrentUser(userId: string, username: string): void {
    this.currentUserId = userId;
    this.currentUsername = username;
  }
  
  /**
   * Get the current user information
   */
  public getCurrentUser(): { userId: string, username: string } {
    return {
      userId: this.currentUserId,
      username: this.currentUsername
    };
  }
  
  /**
   * Process incoming WebSocket message and update internal state
   */
  public processMessage(message: WebSocketMessage): void {
    // Skip processing empty messages
    if (!message || !message.type) return;
    
    // Notify message listeners
    this.notifyMessageListeners(message);
    
    // Process based on message type
    switch (message.type) {
      // Handle room joining
      case MessageTypeEnum.JOIN:
      case MessageTypeEnum.JOIN_ROOM:
        if (message.roomId && message.userId) {
          this.handleUserJoinedRoom(message.roomId, message.userId, message.username);
        }
        break;
        
      // Handle room leaving
      case MessageTypeEnum.LEAVE:
      case MessageTypeEnum.LEAVE_ROOM:
        if (message.roomId && message.userId) {
          this.handleUserLeftRoom(message.roomId, message.userId);
        }
        break;
        
      // Handle cursor movement
      case MessageTypeEnum.CURSOR_MOVE:
        if (message.roomId && message.userId && message.payload) {
          const position = message.payload.position || {
            lng: message.payload.lng,
            lat: message.payload.lat
          };
          
          this.handleCursorMove(message.roomId, message.userId, position);
        }
        break;
        
      // Handle feature changes
      case MessageTypeEnum.FEATURE_ADD:
      case MessageTypeEnum.FEATURE_CREATED:
        if (message.roomId && message.payload && message.payload.id) {
          this.handleFeatureCreated(message.roomId, message.payload);
        }
        break;
        
      case MessageTypeEnum.FEATURE_UPDATE:
      case MessageTypeEnum.FEATURE_UPDATED:
        if (message.roomId && message.payload && message.payload.id) {
          this.handleFeatureUpdated(message.roomId, message.payload);
        }
        break;
        
      case MessageTypeEnum.FEATURE_DELETE:
      case MessageTypeEnum.FEATURE_DELETED:
        if (message.roomId && message.payload && message.payload.id) {
          this.handleFeatureDeleted(message.roomId, message.payload.id);
        }
        break;
        
      // Handle annotation changes
      case MessageTypeEnum.ANNOTATION_ADD:
      case MessageTypeEnum.ANNOTATION_CREATED:
        if (message.roomId && message.payload && message.payload.id) {
          this.handleAnnotationCreated(message.roomId, message.payload);
        }
        break;
        
      case MessageTypeEnum.ANNOTATION_UPDATE:
      case MessageTypeEnum.ANNOTATION_UPDATED:
        if (message.roomId && message.payload && message.payload.id) {
          this.handleAnnotationUpdated(message.roomId, message.payload);
        }
        break;
        
      case MessageTypeEnum.ANNOTATION_DELETE:
      case MessageTypeEnum.ANNOTATION_DELETED:
        if (message.roomId && message.payload && message.payload.id) {
          this.handleAnnotationDeleted(message.roomId, message.payload.id);
        }
        break;
    }
  }
  
  /**
   * Subscribe to room updates
   * @returns Unsubscribe function
   */
  public onRoomUpdated(callback: RoomUpdateCallback): () => void {
    this.roomUpdateListeners.add(callback);
    return () => {
      this.roomUpdateListeners.delete(callback);
    };
  }
  
  /**
   * Subscribe to user updates
   * @returns Unsubscribe function
   */
  public onUserUpdated(callback: UserUpdateCallback): () => void {
    this.userUpdateListeners.add(callback);
    return () => {
      this.userUpdateListeners.delete(callback);
    };
  }
  
  /**
   * Subscribe to all messages
   * @returns Unsubscribe function
   */
  public onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
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
  public getRooms(): CollaborativeRoom[] {
    return Array.from(this.rooms.values());
  }
  
  /**
   * Get a user by ID
   */
  public getUser(userId: string): CollaborativeUser | undefined {
    return this.users.get(userId);
  }
  
  /**
   * Get all users
   */
  public getUsers(): CollaborativeUser[] {
    return Array.from(this.users.values());
  }
  
  /**
   * Get users in a specific room
   */
  public getUsersInRoom(roomId: string): CollaborativeUser[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.users.values());
  }
  
  /**
   * Clear all session data
   */
  public clear(): void {
    this.rooms.clear();
    this.users.clear();
  }
  
  // --- Private helper methods ---
  
  /**
   * Ensure a room exists
   */
  private ensureRoom(roomId: string): CollaborativeRoom {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        users: new Map(),
        features: new Map(),
        annotations: new Map(),
        lastActivity: Date.now()
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }
  
  /**
   * Ensure a user exists
   */
  private ensureUser(userId: string, username?: string): CollaborativeUser {
    let user = this.users.get(userId);
    if (!user) {
      user = {
        id: userId,
        username,
        lastActivity: Date.now(),
        rooms: new Set()
      };
      this.users.set(userId, user);
    } else if (username && user.username !== username) {
      user.username = username;
    }
    return user;
  }
  
  /**
   * Notify room update listeners
   */
  private notifyRoomListeners(roomId: string, room: CollaborativeRoom): void {
    this.roomUpdateListeners.forEach(listener => {
      try {
        listener(roomId, room);
      } catch (error) {
        console.error('Error in room update listener:', error);
      }
    });
  }
  
  /**
   * Notify user update listeners
   */
  private notifyUserListeners(userId: string, user: CollaborativeUser): void {
    this.userUpdateListeners.forEach(listener => {
      try {
        listener(userId, user);
      } catch (error) {
        console.error('Error in user update listener:', error);
      }
    });
  }
  
  /**
   * Notify message listeners
   */
  private notifyMessageListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }
  
  // --- Event handlers ---
  
  /**
   * Handle a user joining a room
   */
  private handleUserJoinedRoom(roomId: string, userId: string, username?: string): void {
    const room = this.ensureRoom(roomId);
    const user = this.ensureUser(userId, username);
    
    // Update user and room state
    user.rooms.add(roomId);
    user.lastActivity = Date.now();
    room.users.set(userId, user);
    room.lastActivity = Date.now();
    
    // Notify listeners
    this.notifyUserListeners(userId, user);
    this.notifyRoomListeners(roomId, room);
  }
  
  /**
   * Handle a user leaving a room
   */
  private handleUserLeftRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    const user = this.users.get(userId);
    
    if (room && user) {
      // Update user and room state
      user.rooms.delete(roomId);
      user.lastActivity = Date.now();
      room.users.delete(userId);
      room.lastActivity = Date.now();
      
      // Notify listeners
      this.notifyUserListeners(userId, user);
      this.notifyRoomListeners(roomId, room);
      
      // Clean up if the room is empty
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
      
      // Clean up if the user is not in any rooms
      if (user.rooms.size === 0) {
        this.users.delete(userId);
      }
    }
  }
  
  /**
   * Handle cursor movement
   */
  private handleCursorMove(roomId: string, userId: string, position: { lng: number, lat: number }): void {
    const user = this.users.get(userId);
    
    if (user) {
      // Update user state
      user.cursor = {
        lng: position.lng,
        lat: position.lat
      };
      user.lastActivity = Date.now();
      
      // Notify listeners
      this.notifyUserListeners(userId, user);
    }
  }
  
  /**
   * Handle feature created
   */
  private handleFeatureCreated(roomId: string, feature: any): void {
    const room = this.ensureRoom(roomId);
    
    // Update room state
    room.features.set(feature.id, feature);
    room.lastActivity = Date.now();
    
    // Notify listeners
    this.notifyRoomListeners(roomId, room);
  }
  
  /**
   * Handle feature updated
   */
  private handleFeatureUpdated(roomId: string, feature: any): void {
    const room = this.rooms.get(roomId);
    
    if (room && room.features.has(feature.id)) {
      // Update room state with merged feature data
      const existingFeature = room.features.get(feature.id);
      room.features.set(feature.id, {
        ...existingFeature,
        ...feature
      });
      room.lastActivity = Date.now();
      
      // Notify listeners
      this.notifyRoomListeners(roomId, room);
    }
  }
  
  /**
   * Handle feature deleted
   */
  private handleFeatureDeleted(roomId: string, featureId: string): void {
    const room = this.rooms.get(roomId);
    
    if (room && room.features.has(featureId)) {
      // Update room state
      room.features.delete(featureId);
      room.lastActivity = Date.now();
      
      // Notify listeners
      this.notifyRoomListeners(roomId, room);
    }
  }
  
  /**
   * Handle annotation created
   */
  private handleAnnotationCreated(roomId: string, annotation: any): void {
    const room = this.ensureRoom(roomId);
    
    // Update room state
    room.annotations.set(annotation.id, annotation);
    room.lastActivity = Date.now();
    
    // Notify listeners
    this.notifyRoomListeners(roomId, room);
  }
  
  /**
   * Handle annotation updated
   */
  private handleAnnotationUpdated(roomId: string, annotation: any): void {
    const room = this.rooms.get(roomId);
    
    if (room && room.annotations.has(annotation.id)) {
      // Update room state with merged annotation data
      const existingAnnotation = room.annotations.get(annotation.id);
      room.annotations.set(annotation.id, {
        ...existingAnnotation,
        ...annotation
      });
      room.lastActivity = Date.now();
      
      // Notify listeners
      this.notifyRoomListeners(roomId, room);
    }
  }
  
  /**
   * Handle annotation deleted
   */
  private handleAnnotationDeleted(roomId: string, annotationId: string): void {
    const room = this.rooms.get(roomId);
    
    if (room && room.annotations.has(annotationId)) {
      // Update room state
      room.annotations.delete(annotationId);
      room.lastActivity = Date.now();
      
      // Notify listeners
      this.notifyRoomListeners(roomId, room);
    }
  }
}

/**
 * Get the session manager singleton instance
 */
export const getSessionManager = WebSocketSessionManager.getInstance;