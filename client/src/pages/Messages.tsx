import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/lib/context/AuthContext';
import MessageCenter from '@/components/MessageCenter';

const Messages: React.FC = () => {
  const { user, isLoading, isAuth } = useAuth();
  const [location, setLocation] = useLocation();

  // Parse URL parameters to get userId if present
  const params = new URLSearchParams(window.location.search);
  const initialContactId = params.get('userId');
  
  // Log for debugging
  console.log("Messages page - initialContactId from URL:", initialContactId);
  
  // Use a useEffect to track and handle URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const newParams = new URLSearchParams(window.location.search);
      const newUserId = newParams.get('userId');
      console.log("URL changed, new userId parameter:", newUserId);
      
      // Force reload the page if the userId parameter changes
      if (newUserId && newUserId !== initialContactId) {
        console.log("UserId changed, reloading page");
        window.location.reload();
      }
    };
    
    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [initialContactId]);

  // Show loading state when authentication status is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we retrieve your data.</p>
        </div>
      </div>
    );
  }

  // If not loading and no user, then user is definitely not authenticated
  if (!isLoading && !isAuth) {
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
                  role: (user.role as 'founder' | 'investor')
                }}
                initialContactId={initialContactId || undefined}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Messages;
