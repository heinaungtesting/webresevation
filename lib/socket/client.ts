/**
 * Socket.io Client Manager
 *
 * Manages Socket.io connections and provides a clean interface
 * for real-time communication. Replaces Supabase Realtime.
 */

import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from './server';

type SocketIOClient = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketManager {
  private socket: SocketIOClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  /**
   * Connect to Socket.io server
   */
  connect(userId?: string, username?: string): SocketIOClient {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket!;
    }

    this.isConnecting = true;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001';

    console.log(`🔌 Connecting to Socket.io server at ${socketUrl}...`);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: false,
      autoConnect: true,
      auth: {
        userId,
        username
      }
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected successfully');
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      // Send user info on connection
      if (userId && username) {
        this.socket?.emit('user-connect', { userId, username });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
      this.isConnecting = false;

      // Attempt to reconnect unless it was intentional
      if (reason !== 'io client disconnect') {
        this.handleReconnect();
      }
    });

    (this.socket as any).on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 Socket.io reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    (this.socket as any).on('reconnect_failed', () => {
      console.error('❌ Socket.io failed to reconnect after maximum attempts');
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket.io...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get current socket instance
   */
  getSocket(): SocketIOClient | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-conversation', conversationId);
    }
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-conversation', conversationId);
    }
  }

  /**
   * Join user notifications
   */
  joinNotifications(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-user-notifications', userId);
    }
  }

  /**
   * Leave user notifications
   */
  leaveNotifications(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-user-notifications', userId);
    }
  }

  /**
   * Send a typing indicator
   */
  sendTyping(conversationId: string, userId: string, username: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId, userId, username, isTyping });
    }
  }

  /**
   * Send a message
   */
  sendMessage(conversationId: string, content: string, userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('send-message', { conversationId, content, userId });
    }
  }

  /**
   * Listen for events
   */
  on<K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]): void {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * Remove event listener
   */
  off<K extends keyof ServerToClientEvents>(event: K, callback?: ServerToClientEvents[K]): void {
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Maximum reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.socket?.connected && !this.isConnecting) {
        this.connect();
      }
    }, delay);
  }
}

// Singleton instance
export const socketManager = new SocketManager();

// Export for convenience
export default socketManager;

// Utility functions for React components
export function useSocketConnection(userId?: string, username?: string) {
  const connect = () => socketManager.connect(userId, username);
  const disconnect = () => socketManager.disconnect();
  const isConnected = () => socketManager.isConnected();

  return { connect, disconnect, isConnected };
}

// Helper to ensure socket is initialized in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Initialize Socket.io API route
  fetch('/api/socket')
    .then(response => response.json())
    .then(data => {
      console.log('🔌 Socket.io API initialized:', data);
    })
    .catch(error => {
      console.error('❌ Failed to initialize Socket.io API:', error);
    });
}