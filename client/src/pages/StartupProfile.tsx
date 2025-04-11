import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DocumentItem from '@/components/DocumentItem';
import { formatCurrency, formatDate, formatWalletAddress } from '@/lib/utils';

const StartupProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Fetch startup data
  const { 
    data: startup, 
    isLoading: startupLoading, 
    error: startupError 
  } = useQuery({
    queryKey: ['/api/startups/user', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/startups/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch startup');
      }
      return res.json();
    }
  });

  // Fetch documents
  const { 
    data: documents = [], 
    isLoading: documentsLoading 
  } = useQuery({
    queryKey: ['/api/documents/startup', startup?.id],
    queryFn: async () => {
      if (!startup) return [];
      const res = await fetch(`/api/documents/startup/${startup.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch documents');
      }
      return res.json();
    },
    enabled: !!startup
  });

  // Redirect to startup creation if no startup exists
  useEffect(() => {
    if (!startupLoading && !startup && !startupError) {
      navigate('/startup/create');
    }
  }, [startup, startupLoading, startupError, navigate]);

  // Loading state
  if (startupLoading || documentsLoading) {
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
  if (startupError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Card className="bg-white shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                <p className="text-gray-600 mb-6">Failed to load startup information. Please try again later.</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/startups/user', user?.id] })}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No startup found (should redirect)
  if (!startup) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>{startup.name} | Profile | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header>
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Startup Profile
              </h1>
              <Button onClick={() => navigate('/startup/dashboard')}>
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Button>
            </div>
          </header>
          
          <main className="mt-8">
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {startup.name}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {startup.pitch}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {startup.stage}
                </span>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Description
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.description}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Industry
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.industry}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Location
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.location}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Total Raised
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(startup.totalRaised)}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Total Investors
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.totalInvestors}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      UPI ID
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {startup.upiId || "Not set"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Wallet Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 truncate">
                      {formatWalletAddress(startup.walletAddress) || "Not connected"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Documents shared with investors for due diligence.
                  </CardDescription>
                </CardHeader>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {documents.length > 0 ? (
                      documents.map((doc) => (
                        <DocumentItem
                          key={doc.id}
                          id={doc.id}
                          name={doc.name}
                          type={doc.type}
                          fileUrl={doc.fileUrl}
                          size={doc.size}
                          uploadedAt={doc.uploadedAt}
                          canDelete={false}
                        />
                      ))
                    ) : (
                      <li className="px-4 py-8 text-center text-gray-500">
                        No documents have been uploaded yet.
                      </li>
                    )}
                  </ul>
                </div>
                <CardFooter className="border-t border-gray-200 p-4">
                  <Button onClick={() => navigate('/startup/dashboard')}>
                    Manage Documents
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StartupProfile;
