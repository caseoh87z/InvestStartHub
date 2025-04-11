import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import { formatCurrency } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import InvestmentModal from '@/components/InvestmentModal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentAccount } from '@/lib/web3';
import DocumentItem from '@/components/DocumentItem';
import { useToast } from '@/hooks/use-toast';

const StartupDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Fetch startup details
  const { 
    data: startup, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/startups', id],
    queryFn: async () => {
      const res = await fetch(`/api/startups/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch startup details');
      }
      return res.json();
    }
  });

  // Fetch startup documents
  const { 
    data: documents = [], 
    isLoading: documentsLoading 
  } = useQuery({
    queryKey: ['/api/documents/startup', id],
    queryFn: async () => {
      const res = await fetch(`/api/documents/startup/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch startup documents');
      }
      return res.json();
    }
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

  const handleInvest = () => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your MetaMask wallet before investing.",
        variant: "destructive",
      });
      return;
    }
    setIsInvestmentModalOpen(true);
  };

  const handleChatWithFounder = () => {
    navigate(`/messages/${id}`);
  };

  const handleInvestmentSuccess = () => {
    toast({
      title: "Investment successful",
      description: "Your investment has been processed successfully.",
    });
    // Refresh data
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Loading state
  if (isLoading) {
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
  if (error || !startup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">Failed to load startup details. Please try again later.</p>
            <Button onClick={() => navigate('/investor/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine logo color based on stage
  let logoColorClass = 'bg-blue-100 text-blue-600';
  
  if (startup.stage.toLowerCase().includes('idea')) {
    logoColorClass = 'bg-purple-100 text-purple-600';
  } else if (startup.stage.toLowerCase().includes('growth') || startup.stage.toLowerCase().includes('scale')) {
    logoColorClass = 'bg-green-100 text-green-600';
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>{startup.name} | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-16 w-16 ${logoColorClass} rounded-full flex items-center justify-center`}>
                  <span className="text-2xl font-bold">{startup.name.substring(0, 2).toUpperCase()}</span>
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-gray-900">{startup.name}</h1>
                  <div className="flex mt-1 space-x-2">
                    <Badge variant="outline" className="bg-gray-100 border-gray-300">
                      {startup.industry}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">
                      {startup.stage}
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">
                      {startup.location}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={handleChatWithFounder}
                >
                  <i className="fas fa-comments mr-2"></i>
                  Chat with Founder
                </Button>
                <Button onClick={handleInvest}>
                  <i className="fas fa-dollar-sign mr-2"></i>
                  Invest Now
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>About {startup.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="prose max-w-none">
                      <p className="text-lg font-semibold text-gray-800 mb-6">
                        "{startup.pitch}"
                      </p>
                      <h3 className="text-lg font-medium mb-4">Company Overview</h3>
                      <p className="mb-6">
                        {startup.description}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle>Due Diligence Documents</CardTitle>
                      <CardDescription>
                        Review these documents to make informed investment decisions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {documentsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : documents.length > 0 ? (
                        <div className="space-y-4">
                          {documents.map((doc: any) => (
                            <DocumentItem
                              key={doc.id}
                              id={doc.id}
                              name={doc.name}
                              type={doc.type}
                              fileUrl={doc.fileUrl}
                              size={doc.size}
                              uploadedAt={doc.createdAt}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No documents available yet.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right column */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Investment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Funding Progress</h3>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{formatCurrency(startup.totalRaised)} raised</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `30%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Overview</h3>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between py-1">
                          <dt className="text-gray-500">Stage</dt>
                          <dd className="font-medium text-gray-900">{startup.stage}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-gray-500">Industry</dt>
                          <dd className="font-medium text-gray-900">{startup.industry}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-gray-500">Location</dt>
                          <dd className="font-medium text-gray-900">{startup.location}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-gray-500">Total Raised</dt>
                          <dd className="font-medium text-gray-900">{formatCurrency(startup.totalRaised)}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-gray-500">Total Investors</dt>
                          <dd className="font-medium text-gray-900">{startup.totalInvestors}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={handleInvest}
                    >
                      Invest in {startup.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Investment Modal */}
      <InvestmentModal
        open={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        startup={startup}
        onSuccess={handleInvestmentSuccess}
      />
    </div>
  );
};

export default StartupDetailsPage;