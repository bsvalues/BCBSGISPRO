/**
 * WebSocket utility for BentonGeoPro
 * 
 * This file provides utilities for establishing and managing WebSocket connections.
 */
import { useEffect, useState } from "react";

// WebSocket connection status enum
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// WebSocket message types
export enum MessageType {
  PING = 'ping',
  PONG = 'pong',
  DRAWING_UPDATE = 'drawing_update',
  CONNECTION = 'connection',
  ERROR = 'error',
  ECHO = 'echo'
}

// Base message interface
export interface WebSocketMessage {
  type: MessageType | string;
  timestamp?: string;
}

// Connection message interface
export interface ConnectionMessage extends WebSocketMessage {
  type: MessageType.CONNECTION;
  message: string;
}

// Drawing update message interface
export interface DrawingUpdateMessage extends WebSocketMessage {
  type: MessageType.DRAWING_UPDATE;
  data: any;
  source: string;
}

// Error message interface
export interface ErrorMessage extends WebSocketMessage {
  type: MessageType.ERROR;
  message: string;
}

// A class to manage WebSocket connections
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 2000; // Start with 2 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  
  // Initialize connection
  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    // Clear any existing reconnection attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.setStatus(ConnectionStatus.CONNECTING);
    
    try {
      // Determine the correct protocol based on page protocol
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.addEventListener('open', this.handleOpen);
      this.socket.addEventListener('message', this.handleMessage);
      this.socket.addEventListener('close', this.handleClose);
      this.socket.addEventListener('error', this.handleError);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.setStatus(ConnectionStatus.ERROR);
      this.scheduleReconnect();
    }
  }
  
  // Disconnect from the server
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }
  
  // Send a message to the server
  public send(message: WebSocketMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not connected');
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }
  
  // Subscribe to a specific message type
  public on(messageType: MessageType | string, callback: (data: any) => void): void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set());
    }
    
    this.listeners.get(messageType)?.add(callback);
  }
  
  // Unsubscribe from a specific message type
  public off(messageType: MessageType | string, callback: (data: any) => void): void {
    const callbackSet = this.listeners.get(messageType);
    if (callbackSet) {
      callbackSet.delete(callback);
      if (callbackSet.size === 0) {
        this.listeners.delete(messageType);
      }
    }
  }
  
  // Subscribe to connection status changes
  public onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusListeners.add(callback);
    
    // Immediately call with current status
    callback(this.status);
  }
  
  // Unsubscribe from connection status changes
  public offStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusListeners.delete(callback);
  }
  
  // Get current connection status
  public getStatus(): ConnectionStatus {
    return this.status;
  }
  
  // Update connection status and notify listeners
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach(listener => listener(status));
  }
  
  // Handle WebSocket open event
  private handleOpen = (): void => {
    console.log('WebSocket connection established');
    this.setStatus(ConnectionStatus.CONNECTED);
    this.reconnectAttempts = 0;
    this.reconnectTimeout = 2000; // Reset reconnect timeout to initial value
    
    // Send a ping to test the connection
    this.send({
      type: MessageType.PING,
      timestamp: new Date().toISOString()
    });
  };
  
  // Handle WebSocket message event
  private handleMessage = (event: MessageEvent): void => {
    try {
      const data = JSON.parse(event.data);
      const messageType = data.type || 'unknown';
      
      // Notify listeners for this message type
      const listeners = this.listeners.get(messageType);
      if (listeners) {
        listeners.forEach(callback => callback(data));
      }
      
      // Also notify 'all' listeners
      const allListeners = this.listeners.get('all');
      if (allListeners) {
        allListeners.forEach(callback => callback(data));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };
  
  // Handle WebSocket close event
  private handleClose = (event: CloseEvent): void => {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.socket = null;
    
    if (event.code === 1000) {
      // Normal closure
      this.setStatus(ConnectionStatus.DISCONNECTED);
    } else {
      // Abnormal closure
      this.setStatus(ConnectionStatus.DISCONNECTED);
      this.scheduleReconnect();
    }
  };
  
  // Handle WebSocket error event
  private handleError = (event: Event): void => {
    console.error('WebSocket error:', event);
    this.setStatus(ConnectionStatus.ERROR);
    // Let the close handler schedule the reconnect
  };
  
  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Exponential backoff for reconnect timeout (with a maximum of 30 seconds)
    this.reconnectTimeout = Math.min(
      this.reconnectTimeout * 1.5, 
      30000
    );
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${this.reconnectTimeout}ms`);
    this.setStatus(ConnectionStatus.RECONNECTING);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, this.reconnectTimeout);
  }
}

// Create a singleton instance for the application
export const webSocketClient = new WebSocketClient();

// React hook for using WebSocket client in components
export function useWebSocket(messageType?: MessageType | string) {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [status, setStatus] = useState<ConnectionStatus>(webSocketClient.getStatus());
  
  useEffect(() => {
    // Subscribe to status changes
    webSocketClient.onStatusChange(setStatus);
    
    // Connect if not already connected
    if (status === ConnectionStatus.DISCONNECTED) {
      webSocketClient.connect();
    }
    
    // Message handler
    const handleMessage = (data: any) => {
      setLastMessage(data);
    };
    
    // Subscribe to specified message type or all messages
    if (messageType) {
      webSocketClient.on(messageType, handleMessage);
    } else {
      webSocketClient.on('all', handleMessage);
    }
    
    // Cleanup function
    return () => {
      webSocketClient.offStatusChange(setStatus);
      if (messageType) {
        webSocketClient.off(messageType, handleMessage);
      } else {
        webSocketClient.off('all', handleMessage);
      }
    };
  }, [messageType]);
  
  // Return connection status, last message, and send function
  return {
    status,
    lastMessage,
    send: webSocketClient.send.bind(webSocketClient),
  };
}

// Helper to create a drawing update message
export function createDrawingUpdateMessage(drawingData: any, source: string = 'unknown'): DrawingUpdateMessage {
  return {
    type: MessageType.DRAWING_UPDATE,
    data: drawingData,
    source,
    timestamp: new Date().toISOString()
  };
}

// Helper to detect if WebSockets are supported in the current browser
export function isWebSocketSupported(): boolean {
  return 'WebSocket' in window;
}