import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getIndustries, getInvestmentStages } from '@/lib/utils';
import { connectMetaMask, getCurrentAccount } from '@/lib/web3';

const StartupCreate: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [form, setForm] = useState({
    name: '',
    description: '',
    pitch: '',
    stage: 'Idea',
    industry: 'Technology',
    location: '',
    upiId: '',
    upiQrCode: ''
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already has a startup
  const { data: existingStartup, isLoading: checkingStartup } = useQuery({
    queryKey: ['/api/startups/user', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await fetch(`/api/startups/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.status === 404) {
          return null;
        }
        if (!res.ok) {
          throw new Error('Failed to check existing startup');
        }
        return res.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        throw error;
      }
    }
  });

  // Create startup mutation
  const createStartupMutation = useMutation({
    mutationFn: async (startupData: typeof form & { walletAddress?: string }) => {
      console.log('Creating startup with data:', startupData);
      const token = localStorage.getItem('token');
      console.log('Auth token:', token);
      
      if (!token) {
        throw new Error('Authentication token missing - please log in again');
      }
      
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      try {
        console.log('Making request to /api/startups with data:', JSON.stringify(startupData));
        
        const response = await fetch('/api/startups', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(startupData)
        });
        
        console.log('Response status:', response.status);
        
        // Get header information without using iterator
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        console.log('Response headers:', JSON.stringify(responseHeaders));
        
        // First check if response is JSON or something else
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (!response.ok) {
          let errorMessage;
          
          // Check if it's JSON or text
          if (contentType && contentType.includes('application/json')) {
            const errorJson = await response.json();
            console.error('JSON Error response:', errorJson);
            errorMessage = errorJson.message || JSON.stringify(errorJson);
          } else {
            const errorText = await response.text();
            console.error('Text Error response:', errorText);
            errorMessage = errorText;
          }
          
          throw new Error(`Server error: ${response.status} - ${errorMessage || response.statusText}`);
        }
        
        // Check content type again for successful response
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          const text = await response.text();
          console.error('Unexpected non-JSON response:', text);
          throw new Error('Server returned non-JSON response');
        }
      } catch (error) {
        console.error('API request error:', error);
        throw error;
      }
    }
  });

  // Check if user already has a wallet connected
  useEffect(() => {
    const checkWallet = async () => {
      const account = await getCurrentAccount();
      if (account) {
        setWalletAddress(account);
      }
    };
    
    checkWallet();
  }, []);

  // Redirect if user already has a startup
  useEffect(() => {
    if (!checkingStartup && existingStartup) {
      toast({
        title: "Startup already exists",
        description: "You already have a startup profile. Redirecting to dashboard.",
      });
      navigate('/startup/dashboard');
    }
  }, [existingStartup, checkingStartup, navigate, toast]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConnectWallet = async () => {
    try {
      const account = await connectMetaMask();
      
      if (account) {
        setWalletAddress(account);
        toast({
          title: "Wallet connected",
          description: `Successfully connected to ${account.substring(0, 6)}...${account.substring(account.length - 4)}`,
        });
        
        // In a production app, you might want to verify ownership of the wallet 
        // by having the user sign a message that gets verified on the backend
        // For simplicity in this demo, we'll just use the wallet address
      } else {
        toast({
          title: "Failed to connect wallet",
          description: "Please make sure MetaMask is installed and unlocked.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connect wallet error:', error);
      toast({
        title: "Failed to connect wallet",
        description: "There was an error connecting your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!form.name || !form.description || !form.pitch || !form.location) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your MetaMask wallet before creating your startup.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Create startup
    try {
      const result = await createStartupMutation.mutateAsync({
        ...form,
        walletAddress
      });
      
      console.log('Startup created successfully:', result);
      
      // Show success message
      toast({
        title: "Startup created successfully!",
        description: "Your startup profile has been created. You can now manage your profile and receive investments.",
      });
      
      // Modified: Set flag first, then force an immediate reload and redirect
      // This is a stronger approach to ensure clean state on redirect
      
      // 1. Set a flag in sessionStorage to signal we're coming from create page
      // This will prevent the dashboard from redirecting back here
      sessionStorage.setItem('startup_created', 'true');
      console.log('Setting startup_created flag:', true);
      
      // 2. Pre-invalidate queries to ensure fresh data on the dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/startups/user'] });
      
      // 3. Force direct navigation to dashboard
      console.log('Redirecting to dashboard after successful startup creation');
      
      // 4. Wait for a moment to ensure the previous operations complete
      setTimeout(() => {
        // Give this a high priority by moving it to the top of the call stack
        Promise.resolve().then(() => {
          // Use window.location for a hard navigation instead of wouter navigate
          // This ensures a fresh page load and clean React state
          window.location.href = '/startup/dashboard';
        });
      }, 500);
      
    } catch (error) {
      console.error('Create startup error:', error);
      
      // More detailed error reporting
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
        
        const errorMessage = error.message.includes('401') 
          ? "Authentication error. Please log in again."
          : error.message.includes('403')
          ? "You don't have permission to create a startup. Make sure you're registered as a founder."
          : "There was an error creating your startup. Please try again.";
        
        toast({
          title: "Failed to create startup",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to create startup",
          description: "There was an error creating your startup. Please try again.",
          variant: "destructive",
        });
      }
      
      setIsSubmitting(false);
    }
  };

  if (checkingStartup) {
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>Create Startup | LaunchBlocks</title>
      </Helmet>
      <NavBar />
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Your Startup
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Provide details about your startup to start receiving investments.
            </p>
          </header>
          
          <main className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Startup Information</CardTitle>
                <CardDescription>
                  Fill in the details below to create your startup profile. This information will be visible to potential investors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Startup Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        placeholder="Your startup's name"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="stage">Investment Stage *</Label>
                        <select
                          id="stage"
                          name="stage"
                          value={form.stage}
                          onChange={handleFormChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          {getInvestmentStages().map((stage) => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="industry">Industry *</Label>
                        <select
                          id="industry"
                          name="industry"
                          value={form.industry}
                          onChange={handleFormChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          {getIndustries().map((industry) => (
                            <option key={industry} value={industry}>{industry}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        name="location"
                        value={form.location}
                        onChange={handleFormChange}
                        placeholder="City, Country"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleFormChange}
                        rows={4}
                        placeholder="Describe your startup, its mission, and goals"
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pitch">Investment Pitch *</Label>
                      <textarea
                        id="pitch"
                        name="pitch"
                        value={form.pitch}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="A short, compelling pitch for investors"
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="upiId">UPI ID (for fiat payments)</Label>
                      <Input
                        id="upiId"
                        name="upiId"
                        value={form.upiId}
                        onChange={handleFormChange}
                        placeholder="yourname@upi"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        This will be used for fiat currency investments.
                      </p>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <Label className="block mb-2">Wallet Connection *</Label>
                      {walletAddress ? (
                        <div className="p-4 bg-green-50 rounded-md">
                          <div className="flex items-center">
                            <i className="fas fa-check-circle text-green-500 mr-2"></i>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Wallet Connected</p>
                              <p className="text-sm text-gray-500">
                                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Button
                            type="button"
                            onClick={handleConnectWallet}
                            className="w-full sm:w-auto"
                          >
                            <i className="fab fa-ethereum mr-2"></i>
                            Connect MetaMask Wallet
                          </Button>
                          <p className="mt-1 text-sm text-gray-500">
                            You must connect your MetaMask wallet to create a startup profile.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/')}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !walletAddress}
                    >
                      {isSubmitting ? "Creating..." : "Create Startup"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StartupCreate;
