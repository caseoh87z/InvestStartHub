import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getNameInitials, formatDate } from '@/lib/utils';
import io from 'socket.io-client';

interface User {
  id: number;
  email: string;
  role: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Contact {
  userId: number;
  email: string;
  role: string;
  lastMessage?: string;
  unreadCount: number;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse URL parameters to get userId if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    if (userId) {
      setSelectedUserId(parseInt(userId));
    }
  }, [location]);

  // Setup socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(window.location.origin, {
      transports: ['websocket'],
      query: { userId: user.id }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsSocketConnected(true);
      newSocket.emit('join', user.id.toString());
    });

    newSocket.on('receive_message', (message: Message) => {
      if (selectedUserId === message.senderId) {
        setMessages(prev => [...prev, message]);
        // Mark as read
        markMessageRead(message.id);
      }
      // Update contacts
      updateContactWithNewMessage(message);
    });

    newSocket.on('message_sent', (message: Message) => {
      if (selectedUserId === message.receiverId) {
        setMessages(prev => [...prev, message]);
      }
      // Update contacts
      updateContactWithNewMessage(message);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsSocketConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, selectedUserId]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch contacts (users with whom there's a conversation)
  useEffect(() => {
    if (!user) return;

    const fetchContacts = async () => {
      try {
        // In a real app, you'd have an API endpoint for this
        // Here we'll simulate by fetching all users
        const res = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch contacts');
        }
        
        const users: User[] = await res.json();
        
        // Filter out current user
        const otherUsers = users.filter(u => u.id !== user.id);
        
        // Transform to contacts format
        const contactList: Contact[] = otherUsers.map(u => ({
          userId: u.id,
          email: u.email,
          role: u.role,
          unreadCount: 0 // Will be updated when fetching messages
        }));
        
        setContacts(contactList);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: "Error",
          description: "Failed to load contacts. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchContacts();
  }, [user, toast]);

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (!selectedUserId || !user) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${selectedUserId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const fetchedMessages: Message[] = await res.json();
        setMessages(fetchedMessages);
        
        // Mark unread messages as read
        fetchedMessages.forEach(msg => {
          if (msg.receiverId === user.id && !msg.read) {
            markMessageRead(msg.id);
          }
        });
        
        // Update contact unread count
        setContacts(prev => 
          prev.map(contact => 
            contact.userId === selectedUserId 
              ? { ...contact, unreadCount: 0 } 
              : contact
          )
        );
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchMessages();
  }, [selectedUserId, user, toast]);

  // Mark message as read
  const markMessageRead = async (messageId: number) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Update contact with new message
  const updateContactWithNewMessage = (message: Message) => {
    setContacts(prev => {
      return prev.map(contact => {
        if (
          (message.senderId === contact.userId) || 
          (message.receiverId === contact.userId)
        ) {
          return {
            ...contact,
            lastMessage: message.content,
            unreadCount: message.receiverId === user?.id && !message.read 
              ? contact.unreadCount + 1 
              : contact.unreadCount
          };
        }
        return contact;
      });
    });
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (!selectedUserId || !user || !messageInput.trim() || !isSocketConnected) return;
    
    socket.emit('send_message', {
      senderId: user.id,
      receiverId: selectedUserId,
      content: messageInput
    });
    
    setMessageInput('');
  };

  // Get selected contact
  const selectedContact = contacts.find(c => c.userId === selectedUserId);

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>Messages | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">
              Messages
            </h1>
          </header>
          
          <main className="mt-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Contacts List */}
              <div className="w-full md:w-1/3">
                <Card className="h-[calc(100vh-180px)]">
                  <CardHeader>
                    <CardTitle>Contacts</CardTitle>
                    <CardDescription>
                      Chat with startup founders and investors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-y-auto h-[calc(100%-146px)]">
                    <ul className="divide-y divide-gray-200">
                      {contacts.length > 0 ? (
                        contacts.map(contact => (
                          <li 
                            key={contact.userId}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                              selectedUserId === contact.userId ? 'bg-gray-50' : ''
                            }`}
                            onClick={() => setSelectedUserId(contact.userId)}
                          >
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {getNameInitials(contact.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {contact.email}
                                  </p>
                                  {contact.unreadCount > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                                      {contact.unreadCount}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {contact.role === 'founder' ? 'Startup Founder' : 'Investor'}
                                </p>
                                {contact.lastMessage && (
                                  <p className="text-xs text-gray-500 truncate mt-1">
                                    {contact.lastMessage}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-6 text-center text-gray-500">
                          No contacts yet. Start by browsing startups or investors.
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              {/* Chat Area */}
              <div className="w-full md:w-2/3">
                <Card className="h-[calc(100vh-180px)]">
                  {selectedUserId && selectedContact ? (
                    <>
                      <CardHeader className="border-b">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getNameInitials(selectedContact.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <CardTitle className="text-lg">{selectedContact.email}</CardTitle>
                            <CardDescription>
                              {selectedContact.role === 'founder' ? 'Startup Founder' : 'Investor'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 overflow-y-auto h-[calc(100%-200px)]">
                        <div className="space-y-4">
                          {messages.length > 0 ? (
                            messages.map(message => (
                              <div 
                                key={message.id}
                                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-3/4 rounded-lg px-4 py-2 ${
                                    message.senderId === user?.id ? 
                                    'bg-primary text-white' : 
                                    'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.senderId === user?.id ? 
                                    'text-blue-100' : 
                                    'text-gray-500'
                                  }`}>
                                    {formatDate(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              No messages yet. Start the conversation!
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </CardContent>
                      <CardFooter className="border-t p-4">
                        <div className="flex w-full space-x-2">
                          <Input 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type your message..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <Button 
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || !isSocketConnected}
                          >
                            <i className="fas fa-paper-plane mr-2"></i>
                            Send
                          </Button>
                        </div>
                      </CardFooter>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-6">
                        <div className="rounded-full bg-gray-100 p-6 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                          <i className="fas fa-comments text-gray-400 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Your Messages</h3>
                        <p className="text-gray-500 mb-4">
                          Select a contact to start chatting
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Messages;
