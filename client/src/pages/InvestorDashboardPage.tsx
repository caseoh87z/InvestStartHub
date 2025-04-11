import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import InvestorDashboard from '@/components/InvestorDashboard';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const InvestorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Fetch all startups
  const { 
    data: startups = [], 
    isLoading: startupsLoading, 
    error: startupsError 
  } = useQuery({
    queryKey: ['/api/startups'],
    queryFn: async () => {
      const res = await fetch('/api/startups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch startups');
      }
      return res.json();
    }
  });

  // Handle investment success
  const handleInvestmentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/startups'] });
    toast({
      title: "Investment Successful",
      description: "Your investment has been processed successfully.",
    });
  };

  // Handle chat with founder
  const handleChatWithFounder = (startupId: number) => {
    // Find the startup to get founder's user ID
    const startup = startups.find(s => s.id === startupId);
    if (startup) {
      navigate(`/messages?userId=${startup.userId}`);
    } else {
      toast({
        title: "Error",
        description: "Could not find startup information.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (startupsLoading) {
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
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Card className="bg-white shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                <p className="text-gray-600 mb-6">Failed to load startups. Please try again later.</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/startups'] })}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>Discover Startups | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <InvestorDashboard
        startups={startups}
        onInvest={handleInvestmentSuccess}
        onChatWithFounder={handleChatWithFounder}
      />
    </div>
  );
};

export default InvestorDashboardPage;
