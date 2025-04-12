import React, { useState, useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

// Message type definition
interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  lastMessage?: string;
  unreadCount?: number;
}

interface MessageChatProps {
  userId: string;  // Current user ID
  contactId: string;  // ID of the user being chatted with
  contactName: string;  // Name of the contact
  onClose?: () => void;  // Optional callback to close the chat
}

const MessageChat: React.FC<MessageChatProps> = ({ 
  userId,
  contactId,
  contactName,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize Socket.io connection
  useEffect(() => {
    // Connect to the socket server
    const newSocket = io('/', {
      query: { userId }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle receiving new messages
    socket.on('receive_message', (message: Message) => {
      // Only add message if it's from the current contact
      if (message.senderId === contactId) {
        setMessages(prev => [...prev, message]);
        // Mark as read immediately
        socket.emit('read_messages', { userId, contactId });
      } else {
        // Show notification for messages from other contacts
        toast({
          title: "New message",
          description: "You received a new message from another contact.",
        });
      }
    });

    // Confirmation of sent messages
    socket.on('message_sent', (message: Message) => {
      if (message.receiverId === contactId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Handler for messages being read by the contact
    socket.on('messages_read', (data: { byUserId: string, forUserId: string }) => {
      if (data.byUserId === contactId && data.forUserId === userId) {
        // Update read status of all messages sent to this contact
        setMessages(prev => 
          prev.map(msg => 
            msg.senderId === userId && msg.receiverId === contactId
              ? { ...msg, read: true }
              : msg
          )
        );
      }
    });

    // Join a room dedicated to conversations between these two users
    const roomId = [userId, contactId].sort().join('-');
    socket.emit('join', roomId);

  }, [socket, userId, contactId, toast]);

  // Fetch message history
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await apiRequest<Message[]>(`/api/messages/${contactId}`);
        setMessages(response);
        
        // Mark all received messages as read
        if (socket && response.some(msg => !msg.read && msg.senderId === contactId)) {
          socket.emit('read_messages', { userId, contactId });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load message history.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (contactId) {
      fetchMessages();
    }
  }, [contactId, userId, socket, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      senderId: userId,
      receiverId: contactId,
      content: newMessage.trim()
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  // Handle Enter key press to send messages
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Render a message bubble
  const renderMessage = (message: Message, index: number) => {
    const isSender = message.senderId === userId;
    const showTimestamp = index === messages.length - 1 || 
      new Date(messages[index + 1].createdAt).getTime() - new Date(message.createdAt).getTime() > 5 * 60 * 1000;

    return (
      <div 
        key={message._id}
        className={`flex mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}
      >
        {!isSender && (
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>{getInitials(contactName)}</AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-[70%] ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}>
          <p className="text-sm break-words">{message.content}</p>
          {showTimestamp && (
            <p className={`text-xs mt-1 ${isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              {isSender && (
                <span className="ml-2">
                  {message.read ? '✓✓' : '✓'}
                </span>
              )}
            </p>
          )}
        </div>
        {isSender && (
          <Avatar className="h-8 w-8 ml-2">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback>{getInitials(contactName)}</AvatarFallback>
            </Avatar>
            <span>{contactName}</span>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => renderMessage(message, index))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MessageChat;