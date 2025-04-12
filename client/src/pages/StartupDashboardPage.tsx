import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import StartupDashboard from '@/components/StartupDashboard';
import { DocumentType } from '@/components/DocumentUploader';
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
    error: startupError,
    refetch: refetchStartup
  } = useQuery({
    queryKey: ['/api/startups/user', user?.id],
    queryFn: async () => {
      if (!user) return null;
      console.log('Fetching startup data for user:', user.id);
      const res = await fetch(`/api/startups/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.status === 404) {
        console.log('No startup found for user');
        return null;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch startup');
      }
      const data = await res.json();
      console.log('Fetched startup data:', data);
      return data;
    },
    staleTime: 0 // This ensures data is always refetched
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
      return await apiRequest(`/api/startups/${startup.id}`, {
        method: 'PUT',
        data: updatedStartup
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/startups/user', user?.id] });
    }
  });

  // Handle startup profile update
  const handleProfileUpdate = async (updatedStartup: Partial<typeof startup>) => {
    await updateStartupMutation.mutateAsync(updatedStartup);
  };
  
  // Handle QR code upload
  const handleQRCodeUpload = async (qrCodeUrl: string) => {
    await updateStartupMutation.mutateAsync({
      ...startup,
      upiQrCode: qrCodeUrl
    });
    toast({
      title: "QR Code uploaded",
      description: "Your UPI QR code has been updated successfully."
    });
  };

  // Handle document upload
  const handleDocumentUpload = async (file: File, documentType: DocumentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startupId', startup.id.toString());
    formData.append('name', file.name);
    formData.append('type', file.type.split('/')[1] || 'document');
    formData.append('documentType', documentType);
    formData.append('size', file.size.toString());

    // In a real implementation, you would upload to a storage service
    // and then store the file URL. Here we're creating a mock URL.
    const mockFileUrl = URL.createObjectURL(file);

    await apiRequest('/api/documents', {
      method: 'POST',
      data: {
        startupId: startup.id,
        name: file.name,
        type: file.type.split('/')[1] || 'document',
        documentType: documentType,
        fileUrl: mockFileUrl,
        size: file.size
      }
    });

    queryClient.invalidateQueries({ queryKey: ['/api/documents/startup', startup.id] });
  };

  // Handle document deletion
  const handleDocumentDelete = async (documentId: number) => {
    await apiRequest(`/api/documents/${documentId}`, {
      method: 'DELETE'
    });
    queryClient.invalidateQueries({ queryKey: ['/api/documents/startup', startup.id] });
  };

  // Effect to refetch startup data when component mounts, especially from creation page
  useEffect(() => {
    console.log('Dashboard mounted, refetching startup data');
    
    // Check if coming from startup creation page
    const isComingFromCreation = sessionStorage.getItem('startup_created') === 'true';
    if (isComingFromCreation) {
      console.log('Coming from startup creation, forcing data refresh');
      // Clear the flag
      sessionStorage.removeItem('startup_created');
      
      // Force a full data refresh
      queryClient.invalidateQueries({ queryKey: ['/api/startups/user'] });
      
      // Use a small delay before refetching to ensure the invalidation completes
      setTimeout(() => {
        refetchStartup();
      }, 500);
    } else {
      // Normal refetch
      refetchStartup();
    }
  }, [refetchStartup, queryClient]);
  
  // Modified: Only check for startup redirect once on initial mount
  useEffect(() => {
    // Skip the redirect logic entirely if this session flag is set
    // This prevents any redirect attempts after we've successfully created a startup
    if (sessionStorage.getItem('startup_created') === 'true') {
      console.log('Coming from startup creation, skipping redirect check');
      return;
    }
    
    // Define a variable to track if we've already attempted to redirect
    let hasAttemptedRedirect = false;
    
    // Only check for startup existence if not loading and no error
    if (!startupLoading && !startupError) {
      if (!startup && !hasAttemptedRedirect) {
        console.log('No startup found, redirecting to create page');
        hasAttemptedRedirect = true; // Mark that we've attempted to redirect
        navigate('/startup/create');
      } else if (startup) {
        console.log('Startup found:', startup.name);
      }
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
        onQRCodeUpload={handleQRCodeUpload}
      />
    </div>
  );
};

export default StartupDashboardPage;
