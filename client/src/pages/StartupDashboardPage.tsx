import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import StartupDashboard from '@/components/StartupDashboard';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const StartupDashboardPage: React.FC = () => {
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

  // Fetch transactions
  const { 
    data: transactions = [], 
    isLoading: transactionsLoading 
  } = useQuery({
    queryKey: ['/api/transactions/startup', startup?.id],
    queryFn: async () => {
      if (!startup) return [];
      const res = await fetch(`/api/transactions/startup/${startup.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return res.json();
    },
    enabled: !!startup
  });

  // Fetch unread messages count
  const { 
    data: messagesData, 
    isLoading: messagesLoading 
  } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    queryFn: async () => {
      const res = await fetch('/api/messages/unread/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch unread messages');
      }
      return res.json();
    }
  });

  // Update startup profile mutation
  const updateStartupMutation = useMutation({
    mutationFn: async (updatedStartup: Partial<typeof startup>) => {
      const res = await apiRequest('PUT', `/api/startups/${startup.id}`, updatedStartup);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/startups/user', user?.id] });
    }
  });

  // Handle startup profile update
  const handleProfileUpdate = async (updatedStartup: Partial<typeof startup>) => {
    await updateStartupMutation.mutateAsync(updatedStartup);
  };

  // Handle document upload
  const handleDocumentUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startupId', startup.id.toString());
    formData.append('name', file.name);
    formData.append('type', file.type.split('/')[1] || 'document');
    formData.append('size', file.size.toString());

    // In a real implementation, you would upload to a storage service
    // and then store the file URL. Here we're creating a mock URL.
    const mockFileUrl = URL.createObjectURL(file);

    await apiRequest('POST', '/api/documents', {
      startupId: startup.id,
      name: file.name,
      type: file.type.split('/')[1] || 'document',
      fileUrl: mockFileUrl,
      size: file.size
    });

    queryClient.invalidateQueries({ queryKey: ['/api/documents/startup', startup.id] });
  };

  // Handle document deletion
  const handleDocumentDelete = async (documentId: number) => {
    await apiRequest('DELETE', `/api/documents/${documentId}`, undefined);
    queryClient.invalidateQueries({ queryKey: ['/api/documents/startup', startup.id] });
  };

  // Redirect to startup creation if no startup exists
  useEffect(() => {
    if (!startupLoading && !startup && !startupError) {
      navigate('/startup/create');
    }
  }, [startup, startupLoading, startupError, navigate]);

  // Loading state
  if (startupLoading) {
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
        <title>Dashboard | {startup.name} | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <StartupDashboard
        startup={startup}
        documents={documents}
        transactions={transactions}
        unreadMessages={messagesData?.count || 0}
        onProfileEdit={handleProfileUpdate}
        onDocumentUpload={handleDocumentUpload}
        onDocumentDelete={handleDocumentDelete}
      />
    </div>
  );
};

export default StartupDashboardPage;
