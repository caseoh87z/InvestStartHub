import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { storage } from './storage';
import { Message, InsertMessage } from '@shared/schema';

let io: Server;

// Map to store active users
const activeUsers = new Map<number, string>();

export function setupSocketIO(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('User connected to socket:', socket.id);
    
    // Get user ID from query
    const userId = socket.handshake.query.userId;
    if (userId) {
      const userIdInt = parseInt(userId as string);
      activeUsers.set(userIdInt, socket.id);
      console.log(`User ${userIdInt} is now active with socket ${socket.id}`);
    }

    // Join a room for direct messages
    socket.on('join', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Handle sending a message
    socket.on('send_message', async (messageData: { 
      senderId: number; 
      receiverId: number; 
      content: string;
    }) => {
      try {
        // Create message in database
        const newMessageData: InsertMessage = {
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          content: messageData.content,
          read: false,
          createdAt: new Date().toISOString(),
        };
        
        const newMessage = await storage.createMessage(newMessageData);
        
        // Emit to sender
        socket.emit('message_sent', newMessage);
        
        // Emit to receiver if online
        const receiverSocketId = activeUsers.get(messageData.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', newMessage);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle reading messages
    socket.on('read_messages', async (data: { userId: number; contactId: number }) => {
      try {
        // Update messages as read in database
        const messages = await storage.getMessagesBetweenUsers(data.userId, data.contactId);
        for (const message of messages) {
          if (message.receiverId === data.userId && !message.read) {
            await storage.markMessageAsRead(message.id);
          }
        }
        
        // Notify sender that messages were read
        const senderSocketId = activeUsers.get(data.contactId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { 
            byUserId: data.userId,
            forUserId: data.contactId 
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove from active users
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}

export function getSocketIO() {
  return io;
}