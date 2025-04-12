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

  // Enhanced startup data fetching with retry logic and better error handling
  const { 
    data: startup, 
    isLoading: startupLoading, 
    error: startupError,
    refetch: refetchStartup
  } = useQuery({
    queryKey: ['/api/startups/user', user?._id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, cannot fetch startup data');
        return null;
      }
      
      // MongoDB stores user IDs as strings in the _id field, not numbers
      // Get the MongoDB ObjectID from the user object
      const mongoId = user._id?.toString() || (typeof user.id === 'string' ? user.id : null);
      console.log('🔍 Fetching startup data for user:', { 
        mongoId,
        id: user.id,
        _id: user._id,
        raw: user
      });
      
      if (!mongoId) {
        console.error("Cannot fetch startup: No valid MongoDB ID found in user object");
        return null;
      }
      
      // Retry mechanism to ensure we get the data
      const maxRetries = 2;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to fetch startup data for MongoDB ID: ${mongoId}`);
          
          // Use the GET method with the MongoDB ObjectID
          const apiUrl = `/api/startups/user/${mongoId}`;
          console.log(`API Request URL: ${apiUrl}`);
          
          const res = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            // Add cache control to prevent browser caching
            cache: 'no-store'
          });
          
          if (res.status === 404) {
            console.log('No startup found for user, redirecting to create page');
            return null;
          }
          
          if (!res.ok) {
            throw new Error(`Failed to fetch startup: ${res.status} ${res.statusText}`);
          }
          
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Invalid response type: ${contentType}`);
          }
          
          const data = await res.json();
          console.log('✅ Successfully fetched startup data:', data);
          return data;
        } catch (error) {
          lastError = error;
          console.error(`❌ Error fetching startup (attempt ${retryCount + 1}):`, error);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('Failed to fetch startup data after multiple attempts');
    },
    staleTime: 0, // Always refetch
    retry: 2,     // React Query's built-in retry mechanism
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30 * 1000), // Increasing delay between retries
    refetchOnWindowFocus: false, // Prevent unneeded refetches
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
      queryClient.invalidateQueries({ queryKey: ['/api/startups/user', user?._id || user?.id] });
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

  // Enhanced effect to refetch startup data when component mounts
  useEffect(() => {
    console.log('💫 Dashboard mounted, initiating data refresh');
    
    // Always force a complete data refresh on mount
    const forceRefresh = async () => {
      try {
        // First invalidate the query cache for fresh data
        console.log('Invalidating startup query cache');
        queryClient.invalidateQueries({ queryKey: ['/api/startups/user'] });
        
        // Wait a moment for invalidation to complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Then trigger a hard refetch
        console.log('Triggering hard refetch of startup data');
        const result = await refetchStartup();
        
        if (result.isSuccess) {
          console.log('✅ Startup data refetch successful:', result.data);
          
          // If we got data, clear any redirect flags
          if (result.data) {
            localStorage.removeItem('redirect_to_create_attempted');
          }
        } else if (result.isError) {
          console.error('❌ Error during startup data refetch:', result.error);
          toast({
            title: "Refresh failed",
            description: "There was a problem loading your startup data. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('❌ Unexpected error during data refresh:', error);
      }
    };
    
    // Execute the refresh function
    forceRefresh();
    
    // Cleanup function
    return () => {
      console.log('Dashboard unmounting, cleanup');
    };
  }, [refetchStartup, queryClient, toast]);
  
  // Simplified redirect check - only run once when data is loaded
  useEffect(() => {
    // Only when loading is done and there's no error
    if (!startupLoading && !startupError) {
      if (!startup) {
        // Check local storage for a flag to prevent redirect loops
        const redirectAttempted = localStorage.getItem('redirect_to_create_attempted');
        
        if (!redirectAttempted) {
          console.log('No startup found and no previous redirect, redirecting to create page');
          localStorage.setItem('redirect_to_create_attempted', 'true');
          navigate('/startup/create');
        } else {
          console.log('No startup but redirect already attempted. Not redirecting again to prevent loop');
        }
      } else {
        // We have a startup, clear the flag
        localStorage.removeItem('redirect_to_create_attempted');
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

  // Enhanced error state with more info and options
  if (startupError) {
    const errorMessage = startupError instanceof Error 
      ? startupError.message 
      : "Unknown error occurred";
      
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Card className="bg-white shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Data Loading Error</h2>
                <p className="text-gray-600 mb-6">
                  We encountered a problem loading your startup information. 
                  <br/>
                  <span className="text-sm text-gray-500 mt-2 block">{errorMessage}</span>
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/startups/user', user?._id || user?.id] });
                      refetchStartup();
                    }}
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    Retry Loading
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Clear any flags and redirect to create
                      localStorage.removeItem('redirect_to_create_attempted');
                      navigate('/startup/create');
                    }}
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Go to Startup Creation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No startup found (show helpful message instead of redirecting)
  if (!startup) {
    const redirectAttempted = localStorage.getItem('redirect_to_create_attempted');
    
    // If we already tried to redirect but still don't have data, show helpful UI
    if (redirectAttempted) {
      return (
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <Card className="bg-white shadow">
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-amber-600 mb-4">No Startup Found</h2>
                  <p className="text-gray-600 mb-6">
                    You don't have a startup profile yet. Click below to create one.
                  </p>
                  <Button 
                    onClick={() => {
                      localStorage.removeItem('redirect_to_create_attempted');
                      navigate('/startup/create');
                    }}
                  >
                    <i className="fas fa-plus-circle mr-2"></i>
                    Create Startup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    
    // Otherwise, return null to allow the redirect effect to work
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
