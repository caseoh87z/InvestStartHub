import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import Message from './models/Message';
import { log } from './vite';

let io: Server;

// Map to store active users
const activeUsers = new Map<string, string>();

export function setupSocketIO(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    log(`User connected to socket: ${socket.id}`, 'socket');
    
    // Get user ID from query
    const userId = socket.handshake.query.userId;
    if (userId) {
      activeUsers.set(userId as string, socket.id);
      log(`User ${userId} is now active with socket ${socket.id}`, 'socket');
    }

    // Join a room for direct messages
    socket.on('join', (room: string) => {
      socket.join(room);
      log(`Socket ${socket.id} joined room ${room}`, 'socket');
    });

    // Handle sending a message
    socket.on('send_message', async (messageData: { 
      senderId: string; 
      receiverId: string; 
      content: string;
    }) => {
      try {
        // Create new message document
        const newMessage = new Message({
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          content: messageData.content,
          read: false
        });
        
        // Save to database
        await newMessage.save();
        
        // Emit to sender
        socket.emit('message_sent', newMessage);
        
        // Emit to receiver if online
        const receiverSocketId = activeUsers.get(messageData.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', newMessage);
        }
      } catch (error) {
        log(`Error sending message: ${error}`, 'socket');
      }
    });

    // Handle reading messages
    socket.on('read_messages', async (data: { userId: string; contactId: string }) => {
      try {
        // Update messages as read in database
        await Message.updateMany(
          { 
            senderId: data.contactId, 
            receiverId: data.userId,
            read: false
          },
          { read: true }
        );
        
        // Notify sender that messages were read
        const senderSocketId = activeUsers.get(data.contactId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { 
            byUserId: data.userId,
            forUserId: data.contactId 
          });
        }
      } catch (error) {
        log(`Error marking messages as read: ${error}`, 'socket');
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove from active users
      activeUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          log(`User ${userId} disconnected`, 'socket');
        }
      });
    });
  });

  return io;
}

export function getSocketIO() {
  return io;
}