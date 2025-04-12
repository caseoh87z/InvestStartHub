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
  const { user, isLoading: authLoading, isAuth, authInitialized } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Log the auth state for debugging
  console.log("InvestorDashboardPage - Auth state:", { 
    authLoading, 
    isAuth, 
    authInitialized,
    userEmail: user?.email 
  });
  
  // Fetch startups data - only enabled when auth state is settled
  const { 
    data: startups = [], 
    isLoading: startupsLoading, 
    error: startupsError 
  } = useQuery({
    queryKey: ['/api/startups'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Fetching startups with token:', token ? 'Token exists' : 'No token');
      
      const res = await fetch('/api/startups', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!res.ok) {
        console.error('Failed to fetch startups, status:', res.status);
        throw new Error('Failed to fetch startups');
      }
      return res.json();
    },
    enabled: authInitialized // Only run this query when auth is fully initialized
  });

  // Fetch unread messages count - only enabled when authenticated
  const { 
    data: messagesData, 
    isLoading: messagesLoading 
  } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Fetching messages with token:', token ? 'Token exists' : 'No token');
      
      const res = await fetch('/api/messages/unread/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        console.error('Failed to fetch messages, status:', res.status);
        throw new Error('Failed to fetch unread messages');
      }
      return res.json();
    },
    enabled: isAuth // Only run this query when the user is authenticated
  });

  // Check if user already has a wallet connected
  React.useEffect(() => {
    const checkWallet = async () => {
      const account = await getCurrentAccount();
      if (account) {
        setWalletAddress(account);
      }
    };
    
    checkWallet();
  }, []);

  // Handle investment
  const handleInvest = () => {
    // This will be called after successful investment
    queryClient.invalidateQueries({ queryKey: ['/api/startups'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions/investor'] });
  };

  // Handle chat with founder
  const handleChatWithFounder = (startupId: number) => {
    // For now, just navigate to messages page
    navigate(`/messages/${startupId}`);
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 text-center">Preparing your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Startups loading state - but only show if auth is complete
  if (!authLoading && startupsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
                // Invalidate both auth and startups queries
                queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                queryClient.invalidateQueries({ queryKey: ['/api/startups'] });
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
