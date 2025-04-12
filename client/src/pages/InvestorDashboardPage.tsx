import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import InvestorDashboard from '@/components/InvestorDashboard';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getCurrentAccount } from '@/lib/web3';

const InvestorDashboardPage: React.FC = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [startups, setStartups] = useState<any[]>([]);
  const [startupsError, setStartupsError] = useState<Error | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Simple direct authentication check
  const [user, setUser] = useState<any>(null);
  
  // Load startups directly without waiting for authInitialized
  React.useEffect(() => {
    console.log("InvestorDashboardPage - Loading startups directly");
    
    const loadData = async () => {
      setInitialLoading(true);
      try {
        // Get token directly
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error("No token found, redirecting to login");
          navigate('/auth/signin');
          return;
        }
        
        // Try to decode token to get user info
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const userData = JSON.parse(jsonPayload);
          setUser(userData);
          console.log("User data from token:", userData);
        } catch (e) {
          console.error("Error decoding token", e);
        }
        
        // Fetch startups directly
        console.log('Fetching startups with token:', token ? 'Token exists' : 'No token');
        const res = await fetch('/api/startups', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          console.error('Failed to fetch startups, status:', res.status);
          throw new Error('Failed to fetch startups');
        }
        
        const data = await res.json();
        console.log("Startups data loaded:", data);
        setStartups(data);
      } catch (error) {
        console.error("Error loading startups:", error);
        setStartupsError(error instanceof Error ? error : new Error('Unknown error'));
        toast({
          title: "Error loading startups",
          description: "Please try again",
          variant: "destructive"
        });
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadData();
  }, [navigate, toast]);

  // Check if user already has a wallet connected
  React.useEffect(() => {
    const checkWallet = async () => {
      try {
        const account = await getCurrentAccount();
        if (account) {
          setWalletAddress(account);
        }
      } catch (e) {
        console.error("Error checking wallet", e);
      }
    };
    
    checkWallet();
  }, []);

  // Handle investment - will reload data
  const handleInvest = async () => {
    // Reload the startups data
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await fetch('/api/startups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStartups(data);
      }
    } catch (e) {
      console.error("Error refreshing startup data", e);
    }
  };

  // Handle chat with founder
  const handleChatWithFounder = (startupId: number) => {
    // Find the startup's user ID first
    try {
      console.log("Chat with founder clicked, startupId:", startupId);
      console.log("Available startups:", startups);
      
      const startupToChat = startups.find(s => s.id === startupId);
      if (startupToChat) {
        console.log("Found startup to chat with:", startupToChat);
        // Use direct navigation to messages
        navigate('/messages');
        
        // Add a slight delay before setting the URL parameter to ensure the page has loaded
        setTimeout(() => {
          window.location.href = `/messages?userId=${startupToChat.userId}`;
        }, 100);
      } else {
        console.error("Could not find startup with ID:", startupId);
        toast({
          title: "Error",
          description: "Couldn't find the startup to chat with",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error navigating to chat:", error);
      toast({
        title: "Error",
        description: "There was a problem opening the chat",
        variant: "destructive"
      });
    }
  };

  // Initial loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 text-center">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (startupsError) {
    console.error('Startups error:', startupsError);
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">Failed to load startups. Please try again later.</p>
            <button 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600"
              onClick={() => {
                // Reload the page to retry
                window.location.reload();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>Investor Dashboard | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <InvestorDashboard 
        startups={startups}
        onInvest={handleInvest}
        onChatWithFounder={handleChatWithFounder}
      />
    </div>
  );
};

export default InvestorDashboardPage;
