/**
 * Socket.io API Route Handler
 *
 * Initializes Socket.io server for Next.js API routes.
 * This allows Socket.io to work alongside your Next.js app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';

type NextApiResponseServerIO = NextResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

// Store the Socket.io server instance
let io: SocketIOServer;

export async function GET(req: NextRequest) {
  // Initialize Socket.io server if not already done
  if (!io) {
    console.log('🔌 Initializing Socket.io server...');

    // Create a mock HTTP server for Socket.io
    // In production, you might want to run this as a separate service
    const httpServer = require('http').createServer();

    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/api/socket.io',
      transports: ['websocket', 'polling']
    });

    // Socket.io event handlers
    io.on('connection', (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      // Join conversation room
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`🏠 Socket ${socket.id} joined conversation: ${conversationId}`);
      });

      // Leave conversation room
      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`🚪 Socket ${socket.id} left conversation: ${conversationId}`);
      });

      // Join user notifications
      socket.on('join-notifications', (userId: string) => {
        socket.join(`notifications:${userId}`);
        console.log(`🔔 Socket ${socket.id} joined notifications: ${userId}`);
      });

      // Handle typing indicators
      socket.on('typing', (data: { conversationId: string; userId: string; username: string; isTyping: boolean }) => {
        socket.to(`conversation:${data.conversationId}`).emit('user-typing', data);
        console.log(`⌨️ Typing: ${data.username} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
      });

      // Handle new messages (broadcast only - actual saving happens in your message API)
      socket.on('broadcast-message', (data: { conversationId: string; message: any }) => {
        socket.to(`conversation:${data.conversationId}`).emit('new-message', data.message);
        console.log(`📨 Broadcasting message to conversation: ${data.conversationId}`);
      });

      // Handle new notifications (broadcast only)
      socket.on('broadcast-notification', (data: { userId: string; notification: any }) => {
        socket.to(`notifications:${data.userId}`).emit('new-notification', data.notification);
        console.log(`🔔 Broadcasting notification to user: ${data.userId}`);
      });

      socket.on('disconnect', (reason) => {
        console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
      });
    });

    // Start the HTTP server on a different port for Socket.io
    const port = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT) : 3001;
    httpServer.listen(port, () => {
      console.log(`🚀 Socket.io server running on port ${port}`);
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Socket.io server initialized',
    socketUrl: `ws://localhost:${process.env.SOCKET_PORT || 3001}`
  });
}

// Helper function to get the Socket.io instance
export function getSocketIO(): SocketIOServer | null {
  return io || null;
}

// Helper functions for broadcasting events
export function broadcastToConversation(conversationId: string, event: string, data: any) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

export function broadcastToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`notifications:${userId}`).emit(event, data);
  }
}