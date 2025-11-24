/**
 * Socket.io Server Configuration
 *
 * Handles real-time communication for messages, notifications, and typing indicators.
 * Replaces Supabase Realtime with a custom Socket.io implementation.
 */

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Types for Socket events
export interface ServerToClientEvents {
  // Messages
  'new-message': (message: any) => void;
  'message-updated': (message: any) => void;
  'message-deleted': (messageId: string) => void;

  // Notifications
  'new-notification': (notification: any) => void;
  'notification-updated': (notification: any) => void;

  // Typing indicators
  'user-typing': (data: { userId: string; username: string; isTyping: boolean }) => void;

  // Connection events
  'user-joined': (data: { userId: string; username: string }) => void;
  'user-left': (data: { userId: string; username: string }) => void;
}

export interface ClientToServerEvents {
  // Join/leave rooms
  'join-conversation': (conversationId: string) => void;
  'leave-conversation': (conversationId: string) => void;
  'join-user-notifications': (userId: string) => void;
  'leave-user-notifications': (userId: string) => void;

  // Messages
  'send-message': (data: { conversationId: string; content: string; userId: string }) => void;
  'broadcast-message': (data: { conversationId: string; message: any }) => void;

  // Notifications
  'broadcast-notification': (data: { userId: string; notification: any }) => void;

  // Typing indicators
  'typing': (data: { conversationId: string; userId: string; username: string; isTyping: boolean }) => void;

  // User presence
  'user-connect': (data: { userId: string; username: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  username?: string;
}

// Store active connections and rooms
const activeUsers = new Map<string, { socketId: string; userId: string; username: string }>();
const conversationRooms = new Map<string, Set<string>>(); // conversationId -> Set of socketIds

export function createSocketServer(port = 3001) {
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();

  return app.prepare().then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    const io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "https://webresevation-gbvm9a1l4-heinaungtestings-projects.vercel.app",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Middleware for authentication (optional)
    io.use((socket, next) => {
      // You can add JWT verification here if needed
      // const token = socket.handshake.auth.token;
      // if (!token) return next(new Error('Authentication error'));

      next();
    });

    io.on('connection', (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      // Handle user connection with user info
      socket.on('user-connect', ({ userId, username }) => {
        socket.data.userId = userId;
        socket.data.username = username;

        activeUsers.set(socket.id, { socketId: socket.id, userId, username });
        console.log(`👤 User connected: ${username} (${userId})`);
      });

      // Join conversation room
      socket.on('join-conversation', (conversationId) => {
        socket.join(`conversation:${conversationId}`);

        // Track users in conversation
        if (!conversationRooms.has(conversationId)) {
          conversationRooms.set(conversationId, new Set());
        }
        conversationRooms.get(conversationId)!.add(socket.id);

        const user = activeUsers.get(socket.id);
        if (user) {
          socket.to(`conversation:${conversationId}`).emit('user-joined', {
            userId: user.userId,
            username: user.username
          });
        }

        console.log(`🏠 User ${socket.data.username} joined conversation: ${conversationId}`);
      });

      // Leave conversation room
      socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);

        // Remove from conversation tracking
        conversationRooms.get(conversationId)?.delete(socket.id);

        const user = activeUsers.get(socket.id);
        if (user) {
          socket.to(`conversation:${conversationId}`).emit('user-left', {
            userId: user.userId,
            username: user.username
          });
        }

        console.log(`🚪 User ${socket.data.username} left conversation: ${conversationId}`);
      });

      // Join user notifications room
      socket.on('join-user-notifications', (userId) => {
        socket.join(`notifications:${userId}`);
        console.log(`🔔 User ${socket.data.username} joined notifications: ${userId}`);
      });

      // Leave user notifications room
      socket.on('leave-user-notifications', (userId) => {
        socket.leave(`notifications:${userId}`);
        console.log(`🔕 User ${socket.data.username} left notifications: ${userId}`);
      });

      // Handle message sending
      socket.on('send-message', async (data) => {
        try {
          // Here you would typically save to database first
          // For now, we'll just broadcast the message

          const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversation_id: data.conversationId,
            sender_id: data.userId,
            content: data.content,
            created_at: new Date().toISOString(),
            sender: activeUsers.get(socket.id)
          };

          // Broadcast to all users in the conversation (except sender)
          socket.to(`conversation:${data.conversationId}`).emit('new-message', message);

          console.log(`💬 Message sent in conversation ${data.conversationId}: "${data.content}"`);
        } catch (error) {
          console.error('Error sending message:', error);
        }
      });

      // Handle broadcast message (for external integrations)
      socket.on('broadcast-message', async (data) => {
        try {
          // Broadcast the provided message to all users in the conversation
          socket.to(`conversation:${data.conversationId}`).emit('new-message', data.message);

          console.log(`📢 Message broadcasted to conversation ${data.conversationId}`);
        } catch (error) {
          console.error('Error broadcasting message:', error);
        }
      });

      // Handle broadcast notification (for external integrations)
      socket.on('broadcast-notification', async (data) => {
        try {
          // Broadcast the notification to the specific user
          socket.to(`notifications:${data.userId}`).emit('new-notification', data.notification);

          console.log(`🔔 Notification broadcasted to user ${data.userId}`);
        } catch (error) {
          console.error('Error broadcasting notification:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        // Broadcast typing status to other users in the conversation
        socket.to(`conversation:${data.conversationId}`).emit('user-typing', {
          userId: data.userId,
          username: data.username,
          isTyping: data.isTyping
        });

        console.log(`⌨️ Typing indicator: ${data.username} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        const user = activeUsers.get(socket.id);

        if (user) {
          // Notify all conversations this user was in
          conversationRooms.forEach((socketIds, conversationId) => {
            if (socketIds.has(socket.id)) {
              socket.to(`conversation:${conversationId}`).emit('user-left', {
                userId: user.userId,
                username: user.username
              });
              socketIds.delete(socket.id);
            }
          });

          activeUsers.delete(socket.id);
          console.log(`👋 User ${user.username} disconnected: ${reason}`);
        }

        console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
      });
    });

    server.listen(port, () => {
      console.log(`🚀 Socket.io server running on port ${port}`);
    });

    return { server, io };
  });
}

// Helper functions for external use
export function broadcastNotification(io: SocketIOServer, userId: string, notification: any) {
  io.to(`notifications:${userId}`).emit('new-notification', notification);
}

export function broadcastMessageToConversation(io: SocketIOServer, conversationId: string, message: any) {
  io.to(`conversation:${conversationId}`).emit('new-message', message);
}

export function getActiveUsersInConversation(conversationId: string): Array<{ userId: string; username: string }> {
  const socketIds = conversationRooms.get(conversationId) || new Set();
  const users: Array<{ userId: string; username: string }> = [];

  socketIds.forEach(socketId => {
    const user = activeUsers.get(socketId);
    if (user) {
      users.push({ userId: user.userId, username: user.username });
    }
  });

  return users;
}