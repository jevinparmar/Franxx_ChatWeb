import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;
const onlineUsers = new Map(); // Map<userId, Set<socketId>>

export const initSocket = (server, clientUrl) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    clientUrl
  ].filter(Boolean);

  io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Strict Socket middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id.toString();
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    } else {
      next(new Error('Authentication error: No token provided'));
    }
  });

  io.on('connection', (socket) => {
    let currentUserId = socket.userId;

    // Register / Setup user session using strict verified identity
    socket.on('setup', async (userData) => {
      if (currentUserId) {
        socket.join(currentUserId);
        socket.join(`user:${currentUserId}`);

        // Track multi-device / multi-tab socket connections
        if (!onlineUsers.has(currentUserId)) {
          onlineUsers.set(currentUserId, new Set());
        }
        onlineUsers.get(currentUserId).add(socket.id);

        // Update database user status and emit presence if this is the user's first active connection
        if (onlineUsers.get(currentUserId).size === 1) {
          await User.findByIdAndUpdate(currentUserId, { status: 'Online', lastSeen: new Date() }).catch(() => {});
          io.emit('user_online', { userId: currentUserId, onlineUsers: Array.from(onlineUsers.keys()) });
        }

        socket.emit('connected');
        socket.emit('get_online_users', Array.from(onlineUsers.keys()));
      }
    });

    // Register user explicitly
    socket.on('register-user', (userId) => {
      if (currentUserId) {
        socket.join(currentUserId);
        socket.join(`user:${currentUserId}`);
      }
    });

    // Join chat room with membership authorization check
    socket.on('join chat', async (room) => {
      if (room && currentUserId) {
        try {
          const Chat = (await import('../models/Chat.js')).default;
          const chat = await Chat.findOne({ _id: room, members: currentUserId });
          if (chat) {
            socket.join(room);
          }
        } catch (err) {
          console.error('Socket join chat authorization error:', err);
        }
      }
    });

    // Leave chat room
    socket.on('leave chat', (room) => {
      if (room) {
        socket.leave(room);
      }
    });

    // Real-time typing indicators
    socket.on('typing', (data) => {
      // payload: { room, senderId, receiverId, user }
      const room = typeof data === 'string' ? data : data?.room;
      if (room) {
        socket.to(room).emit('typing', data);
      }
    });

    socket.on('stop typing', (data) => {
      const room = typeof data === 'string' ? data : data?.room;
      if (room) {
        socket.to(room).emit('stop typing', data);
      }
    });

    // Handle new messages
    socket.on('new message', (newMessageReceived) => {
      const chat = newMessageReceived.chat;
      if (!chat) return;

      const chatIdStr = (chat._id || chat).toString();

      // Broadcast message to active chat room (excluding sender)
      socket.to(chatIdStr).emit('message received', newMessageReceived);

      // Emit to each member's personal user room if members array exists
      if (Array.isArray(chat.members)) {
        chat.members.forEach((member) => {
          const memberIdStr = (member._id || member).toString();
          const senderIdStr = (newMessageReceived.sender?._id || newMessageReceived.sender)?.toString();

          if (memberIdStr !== senderIdStr) {
            io.to(`user:${memberIdStr}`).to(memberIdStr).emit('message received', newMessageReceived);
          }
        });
      }
    });

    // Handle read receipts
    socket.on('mark_read', (data) => {
      if (data && data.chatId) {
        socket.to(data.chatId).emit('messages_read', data);
      } 
    });

    // Disconnect handling (only mark offline when LAST socket for user disconnects)
    socket.on('disconnect', async () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(currentUserId);
          await User.findByIdAndUpdate(currentUserId, { status: 'Offline', lastSeen: new Date() }).catch(() => {});
          io.emit('user_offline', { userId: currentUserId, onlineUsers: Array.from(onlineUsers.keys()) });
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};
