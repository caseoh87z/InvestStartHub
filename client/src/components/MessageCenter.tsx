import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { Search, MessageSquare, UserPlus } from 'lucide-react';
import MessageChat from './MessageChat';

// Interface definitions
interface User {
  id: string;
  email: string;
  role: 'founder' | 'investor' | string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  role: 'founder' | 'investor' | string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface MessageCenterProps {
  currentUser: User;
  initialContactId?: string;
}

const MessageCenter: React.FC<MessageCenterProps> = ({ currentUser, initialContactId }) => {
  const [activeTab, setActiveTab] = useState<string>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Fetch user's contacts
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const data = await apiRequest<Contact[]>('/api/users');
        
        // Filter out current user
        const filteredContacts = data.filter(contact => contact.id !== currentUser.id);
        setContacts(filteredContacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: "Error",
          description: "Failed to load contacts.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [currentUser.id, toast]);

  // Fetch unread message counts for each contact
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const data = await apiRequest<{userId: string, count: number}[]>('/api/messages/unread/count');
        const countsMap: Record<string, number> = {};
        
        data.forEach(item => {
          countsMap[item.userId] = item.count;
        });
        
        setUnreadCounts(countsMap);
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();
    
    // Set up a timer to poll for unread counts
    const intervalId = setInterval(fetchUnreadCounts, 30000); // every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handler for selecting a contact
  const handleContactSelect = useCallback((contact: Contact) => {
    setActiveContact(contact);
    setActiveTab('chat');
    
    // Reset unread count for this contact
    setUnreadCounts(prev => ({
      ...prev,
      [contact.id]: 0
    }));
  }, []);
  
  // Handle initialContactId if provided
  useEffect(() => {
    // If we have contacts loaded and an initialContactId was provided
    if (contacts.length > 0 && initialContactId) {
      console.log("Checking for initial contact with ID:", initialContactId);
      const foundContact = contacts.find(c => c.id === initialContactId);
      if (foundContact) {
        console.log("Found initial contact:", foundContact.name);
        handleContactSelect(foundContact);
      } else {
        console.log("Initial contact not found in contacts list");
      }
    }
  }, [contacts, initialContactId, handleContactSelect]);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Handler for closing the chat
  const handleCloseChat = () => {
    setActiveContact(null);
    setActiveTab('contacts');
  };

  // Render contact list
  const renderContactList = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <ScrollArea className="h-[60vh]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No contacts found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map(contact => (
              <div 
                key={contact.id}
                onClick={() => handleContactSelect(contact)}
                className="p-3 rounded-lg hover:bg-muted cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.role === 'founder' ? 'Startup Founder' : 'Investor'}
                    </p>
                  </div>
                </div>
                {unreadCounts[contact.id] > 0 && (
                  <Badge variant="destructive" className="rounded-full px-2">
                    {unreadCounts[contact.id]}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
        <CardDescription>
          Connect with founders and investors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts" className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="chat" disabled={!activeContact} className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
              {activeContact && (
                <span className="ml-2 text-xs">
                  with {activeContact.name}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contacts">
            {renderContactList()}
          </TabsContent>
          <TabsContent value="chat">
            {activeContact && (
              <div className="h-[65vh]">
                <MessageChat
                  userId={currentUser.id}
                  contactId={activeContact.id}
                  contactName={activeContact.name}
                  onClose={handleCloseChat}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MessageCenter;