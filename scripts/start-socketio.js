#!/usr/bin/env node

/**
 * Socket.io Server Startup Script
 *
 * Standalone Socket.io server for development and production.
 * Run this script to start your Socket.io server.
 */

const { Server } = require('socket.io');
const { createServer } = require('http');

// Configuration
const PORT = process.env.SOCKET_PORT || 3001;
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store active connections
const activeUsers = new Map();
const conversationRooms = new Map();

console.log('🚀 Starting Socket.io server...');
console.log(`📡 CORS Origin: ${CORS_ORIGIN}`);

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Handle user connection
  socket.on('user-connect', ({ userId, username }) => {
    socket.userId = userId;
    socket.username = username;

    activeUsers.set(socket.id, { socketId: socket.id, userId, username });
    console.log(`👤 User connected: ${username} (${userId})`);
  });

  // Join conversation room
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);

    if (!conversationRooms.has(conversationId)) {
      conversationRooms.set(conversationId, new Set());
    }
    conversationRooms.get(conversationId).add(socket.id);

    console.log(`🏠 ${socket.username || socket.id} joined conversation: ${conversationId}`);

    // Notify others in the room
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.to(`conversation:${conversationId}`).emit('user-joined', {
        userId: user.userId,
        username: user.username
      });
    }
  });

  // Leave conversation room
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);

    conversationRooms.get(conversationId)?.delete(socket.id);
    console.log(`🚪 ${socket.username || socket.id} left conversation: ${conversationId}`);

    // Notify others in the room
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.to(`conversation:${conversationId}`).emit('user-left', {
        userId: user.userId,
        username: user.username
      });
    }
  });

  // Join user notifications
  socket.on('join-user-notifications', (userId) => {
    socket.join(`notifications:${userId}`);
    console.log(`🔔 ${socket.username || socket.id} joined notifications: ${userId}`);
  });

  // Leave user notifications
  socket.on('leave-user-notifications', (userId) => {
    socket.leave(`notifications:${userId}`);
    console.log(`🔕 ${socket.username || socket.id} left notifications: ${userId}`);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { conversationId, userId, username, isTyping } = data;

    // Broadcast to others in the conversation
    socket.to(`conversation:${conversationId}`).emit('user-typing', {
      userId,
      username,
      isTyping
    });

    console.log(`⌨️ Typing: ${username} is ${isTyping ? 'typing' : 'stopped typing'} in ${conversationId}`);
  });

  // Handle message broadcasting (actual message saving should happen in your API)
  socket.on('broadcast-message', (data) => {
    const { conversationId, message } = data;

    // Broadcast to all users in the conversation except sender
    socket.to(`conversation:${conversationId}`).emit('new-message', message);

    console.log(`📨 Broadcasting message to conversation ${conversationId}`);
  });

  // Handle notification broadcasting
  socket.on('broadcast-notification', (data) => {
    const { userId, notification } = data;

    // Broadcast to the specific user
    socket.to(`notifications:${userId}`).emit('new-notification', notification);

    console.log(`🔔 Broadcasting notification to user ${userId}`);
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

// Error handling
httpServer.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`✅ Socket.io server running on http://localhost:${PORT}`);
  console.log(`📊 Active users: ${activeUsers.size}`);
  console.log(`🏠 Active conversations: ${conversationRooms.size}`);
  console.log('');
  console.log('Ready to handle real-time connections! 🎉');
  console.log('');
  console.log('💡 To test: http://localhost:3000/test-socketio');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});