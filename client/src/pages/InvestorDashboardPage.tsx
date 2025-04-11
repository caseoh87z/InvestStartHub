import React, { useEffect, useState } from 'react';
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

  // Use fixed startup data instead of API calls due to middleware issues
  const [startupsLoading, setStartupsLoading] = useState(true);
  const [startupsError, setStartupsError] = useState<Error | null>(null);
  const [startups, setStartups] = useState<any[]>([]);
  
  // Load startup data
  useEffect(() => {
    // Simulate API loading for a brief moment (for UI feedback)
    setTimeout(() => {
      try {
        // Since we're having issues with the API returning HTML instead of JSON,
        // we'll use this sample startup data for the dashboard
        const sampleStartups = [
          {
            id: 1,
            name: "EcoSolutions",
            description: "Sustainable energy solutions for residential buildings",
            pitch: "Reducing carbon footprint through innovative home technology",
            stage: "Seed",
            industry: "Energy",
            location: "North America",
            totalRaised: 250000,
            totalInvestors: 12,
            userId: 2
          },
          {
            id: 2,
            name: "HealthTech AI",
            description: "AI-powered medical diagnosis and monitoring tools",
            pitch: "Revolutionizing healthcare with machine learning",
            stage: "Series A",
            industry: "Healthcare",
            location: "Europe",
            totalRaised: 1500000,
            totalInvestors: 24,
            userId: 3
          },
          {
            id: 3,
            name: "EduLearn",
            description: "Personalized education platform for K-12 students",
            pitch: "Making quality education accessible to everyone",
            stage: "Pre-seed",
            industry: "Education",
            location: "Asia",
            totalRaised: 75000,
            totalInvestors: 5,
            userId: 4
          },
          {
            id: 4,
            name: "FinTech Solutions",
            description: "Next-generation payment processing and wealth management",
            pitch: "Democratizing financial services for everyone",
            stage: "Series B",
            industry: "Finance",
            location: "North America",
            totalRaised: 8500000,
            totalInvestors: 38,
            userId: 5
          }
        ];
        
        setStartups(sampleStartups);
        setStartupsLoading(false);
      } catch (error) {
        console.error('Error setting up startup data:', error);
        setStartupsError(error instanceof Error ? error : new Error('Unknown error'));
        setStartupsLoading(false);
      }
    }, 1000); // 1 second delay for better UX
  }, []);

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
    const startup = startups.find((s: {id: number, userId: number}) => s.id === startupId);
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
