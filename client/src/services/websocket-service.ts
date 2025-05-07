/**
 * Enhanced WebSocket Service
 * 
 * This service provides a robust WebSocket connection with automatic reconnection,
 * message queuing, and channel subscription management for the AI agent system.
 */

// Configuration
const WS_RECONNECT_INTERVAL = 2000; // Wait 2 seconds before reconnecting
const WS_MAX_RECONNECT_ATTEMPTS = 10; // Maximum reconnection attempts
const WS_PING_INTERVAL = 30000; // Send a ping every 30 seconds to keep connection alive
const WS_MESSAGE_QUEUE_SIZE = 50; // Maximum number of messages to keep in queue

// Message types
export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// Event types
export type WebSocketEvent = 
  | { type: 'connected' }
  | { type: 'disconnected', reason?: string }
  | { type: 'reconnecting', attempt: number }
  | { type: 'message', data: any }
  | { type: 'error', error: Error };

// Event listener type
type EventListener = (event: WebSocketEvent) => void;

// WebSocket service class
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private listeners: EventListener[] = [];
  private subscriptions: Set<string> = new Set();
  private isConnecting = false;
  private userId: number | null = null;
  private baseUrl: string;

  constructor() {
    // Determine the WebSocket URL based on the current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.baseUrl = `${protocol}//${window.location.host}/ws`;
    
    // Bind event handlers to preserve 'this' context
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onError = this.onError.bind(this);
    
    // Reconnect on window focus - helps recover from laptop sleep or network changes
    window.addEventListener('focus', () => {
      if (this.socket?.readyState !== WebSocket.OPEN && !this.isConnecting) {
        console.log('Window focused, reconnecting WebSocket...');
        this.connect();
      }
    });
    
    // Detect window/tab closing and clean up
    window.addEventListener('beforeunload', () => {
      this.disconnect('Page unloaded');
    });
  }

  /**
   * Set the current user ID for user-specific subscriptions
   */
  public setUserId(userId: number | null): void {
    if (this.userId !== userId) {
      this.userId = userId;
      
      // If connected, update subscriptions
      if (this.socket?.readyState === WebSocket.OPEN && userId) {
        // Subscribe to user-specific channels
        this.subscribeToUserChannels(userId);
      }
    }
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    
    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnected = () => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            resolve();
          } else {
            setTimeout(checkConnected, 100);
          }
        };
        checkConnected();
      });
    }
    
    this.isConnecting = true;
    
    return new Promise((resolve, reject) => {
      try {
        // Close existing socket if it exists
        if (this.socket) {
          this.socket.removeEventListener('open', this.onOpen);
          this.socket.removeEventListener('close', this.onClose);
          this.socket.removeEventListener('message', this.onMessage);
          this.socket.removeEventListener('error', this.onError);
          
          if (this.socket.readyState !== WebSocket.CLOSED) {
            this.socket.close();
          }
        }
        
        // Create new WebSocket connection
        this.socket = new WebSocket(this.baseUrl);
        
        // Set up event listeners
        this.socket.addEventListener('open', (event) => {
          this.onOpen(event);
          resolve();
        });
        this.socket.addEventListener('close', this.onClose);
        this.socket.addEventListener('message', this.onMessage);
        this.socket.addEventListener('error', (event) => {
          this.onError(event);
          reject(new Error('WebSocket connection failed'));
        });
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        this.isConnecting = false;
        reject(error);
        this.scheduleReconnect();
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(reason = 'Client disconnected'): void {
    // Clear any reconnect timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Clear ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    // Reset reconnect attempts
    this.reconnectAttempts = 0;
    
    // Close the socket if it exists
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.close(1000, reason);
        }
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      }
      
      this.socket = null;
    }
    
    this.isConnecting = false;
    this.emit({ type: 'disconnected', reason });
  }

  /**
   * Send a message to the WebSocket server
   */
  public send(message: WebSocketMessage): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.queueMessage(message);
        return false;
      }
    } else {
      // Queue the message if not connected
      this.queueMessage(message);
      
      // Try to connect if not already connecting
      if (!this.isConnecting) {
        this.connect().catch(error => {
          console.error('Failed to connect WebSocket for sending message:', error);
        });
      }
      
      return false;
    }
  }

  /**
   * Subscribe to a channel
   */
  public subscribe(channel: string): void {
    if (this.subscriptions.has(channel)) {
      return; // Already subscribed
    }
    
    this.subscriptions.add(channel);
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        channel
      });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(channel: string): void {
    if (!this.subscriptions.has(channel)) {
      return; // Not subscribed
    }
    
    this.subscriptions.delete(channel);
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'unsubscribe',
        channel
      });
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: EventListener): () => void {
    this.listeners.push(listener);
    
    // Return cleanup function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Check if the socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get the connection state
   */
  public getState(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      return 'disconnected';
    }
    
    if (this.socket.readyState === WebSocket.CONNECTING) {
      return 'connecting';
    }
    
    return 'connected';
  }

  /**
   * Reset the connection (force reconnect)
   */
  public reset(): Promise<void> {
    this.disconnect('Connection reset');
    return this.connect();
  }

  /**
   * Internal method to queue a message
   */
  private queueMessage(message: WebSocketMessage): void {
    // Add message to queue with limit
    this.messageQueue.push(message);
    
    // Trim queue if it gets too large
    if (this.messageQueue.length > WS_MESSAGE_QUEUE_SIZE) {
      this.messageQueue.shift();
    }
  }

  /**
   * Subscribe to user-specific channels
   */
  private subscribeToUserChannels(userId: number): void {
    // Subscribe to user-specific channels
    this.subscribe(`user-${userId}`);
    this.subscribe(`user-achievements-${userId}`);
    this.subscribe(`user-notifications-${userId}`);
    
    // For the AI agent system, subscribe to agent channels
    this.subscribe(`agent-updates`);
    
    // Team/group channels if applicable
    // this.subscribe(`team-${teamId}`);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    
    this.pingTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, WS_PING_INTERVAL);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
      console.log('Maximum reconnection attempts reached');
      this.emit({ 
        type: 'error', 
        error: new Error('Maximum WebSocket reconnection attempts reached') 
      });
      return;
    }
    
    const delay = Math.min(30000, WS_RECONNECT_INTERVAL * Math.pow(1.5, this.reconnectAttempts));
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit({ type: 'reconnecting', attempt: this.reconnectAttempts });
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${WS_MAX_RECONNECT_ATTEMPTS})...`);
      this.connect().catch(error => {
        console.error('Reconnection attempt failed:', error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  /**
   * Handle WebSocket open event
   */
  private onOpen(event: Event): void {
    console.log('WebSocket connection established');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.emit({ type: 'connected' });
    
    // Start ping interval
    this.startPingInterval();
    
    // Re-subscribe to all channels
    for (const channel of this.subscriptions) {
      this.send({
        type: 'subscribe',
        channel
      });
    }
    
    // Subscribe to user channels if user ID is set
    if (this.userId) {
      this.subscribeToUserChannels(this.userId);
    }
    
    // Send any queued messages
    const queuedMessages = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const message of queuedMessages) {
      this.send(message);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private onClose(event: CloseEvent): void {
    this.isConnecting = false;
    
    // Don't attempt to reconnect if the close was clean (code 1000)
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
    
    this.emit({ 
      type: 'disconnected', 
      reason: event.reason || `Connection closed (${event.code})` 
    });
  }

  /**
   * Handle WebSocket message event
   */
  private onMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle ping/pong messages internally
      if (data.type === 'ping') {
        this.send({ type: 'pong', timestamp: Date.now() });
        return;
      }
      
      if (data.type === 'pong') {
        return; // Ignore pong responses
      }
      
      // Emit the message to listeners
      this.emit({ type: 'message', data });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private onError(event: Event): void {
    this.isConnecting = false;
    console.error('WebSocket error:', event);
    this.emit({ 
      type: 'error', 
      error: new Error('WebSocket error occurred') 
    });
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: WebSocketEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in WebSocket event listener:', error);
      }
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

export default websocketService;