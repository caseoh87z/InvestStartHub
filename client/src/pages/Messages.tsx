import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/lib/context/AuthContext';
import MessageCenter from '@/components/MessageCenter';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  // Parse URL parameters to get userId if present
  const params = new URLSearchParams(window.location.search);
  const initialContactId = params.get('userId');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-muted-foreground">You need to be logged in to access messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Messages | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header>
            <h1 className="text-3xl font-bold">
              Messages
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect with founders and investors through direct messaging
            </p>
          </header>
          
          <main className="mt-8">
            {user && (
              <MessageCenter 
                currentUser={{
                  id: user.id.toString(),
                  email: user.email,
                  role: user.role
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Messages;
