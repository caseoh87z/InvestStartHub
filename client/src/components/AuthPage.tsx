import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/context/AuthContext';
import { login, register } from '@/lib/auth';
import { connectMetaMask } from '@/lib/web3';

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'founder' | 'investor'>('investor');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();
  const { login: authLogin, authInitialized, isAuth, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  
  // Log auth state for debugging
  React.useEffect(() => {
    console.log("AuthPage - Auth state:", { 
      isAuth, 
      authLoading, 
      authInitialized
    });
  }, [isAuth, authLoading, authInitialized]);

  const handleRoleChange = (selectedRole: 'founder' | 'investor') => {
    setRole(selectedRole);
  };

  const handleConnectWallet = async () => {
    try {
      const address = await connectMetaMask();
      if (address) {
        setWalletAddress(address);
        toast({
          title: "Wallet connected",
          description: `Connected to wallet: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Wallet connection failed",
        description: "Could not connect to MetaMask. Please make sure it's installed and unlocked.",
        variant: "destructive",
      });
    }
  };

  // Helper function for immediate navigation after auth
  const navigateToTarget = (targetUrl: string) => {
    console.log("Directly navigating to:", targetUrl);
    
    // Use window.location for a full page navigation that will pick up the auth state
    window.location.href = targetUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    console.log("Authentication started...");
    
    try {
      if (isLoginMode) {
        // Login using the standard API approach
        console.log("Attempting login with:", email);
        
        const loginResponse = await login({ email, password });
        console.log("Login successful, received data:", loginResponse);
        
        if (loginResponse && loginResponse.token && loginResponse.user) {
          // Store token and user data in auth context
          console.log("Setting auth login state with token and user data");
          authLogin(loginResponse.token, loginResponse.user);
          
          toast({
            title: "Login successful",
            description: "Welcome back to LaunchBlocks!",
          });
          
          // Check for saved redirect from protected pages
          const savedRedirect = localStorage.getItem('redirectAfterLogin');
          
          if (savedRedirect) {
            console.log("Auth - redirecting to saved URL after login:", savedRedirect);
            // Clear the saved redirect
            localStorage.removeItem('redirectAfterLogin');
            
            toast({
              title: "Success",
              description: "Redirecting you to your requested page...",
            });
            
            // Use a slight delay to ensure the toast is visible
            setTimeout(() => {
              window.location.href = savedRedirect;
            }, 500);
          } else {
            // Normal dashboard redirect
            const targetUrl = loginResponse.user.role === 'founder' ? '/startup/dashboard' : '/investor/dashboard';
            console.log("Preparing navigation to dashboard:", targetUrl);
            
            // Add a waiting message
            toast({
              title: "Success",
              description: "Preparing your dashboard...",
            });
            
            // Navigate immediately to the appropriate dashboard 
            navigateToTarget(targetUrl);
          }
        } else {
          throw new Error("Invalid response from server");
        }
      } else {
        // Registration using standard API approach
        console.log("Attempting registration with:", email, "as", role);
        
        const registerData = {
          email,
          username,
          password,
          role,
          walletAddress: walletAddress || undefined
        };
        
        const registerResponse = await register(registerData);
        console.log("Registration successful, received data:", registerResponse);
        
        if (registerResponse && registerResponse.token && registerResponse.user) {
          // Store token and user data in auth context
          console.log("Setting auth login state with token and user data");
          authLogin(registerResponse.token, registerResponse.user);
          
          toast({
            title: "Registration successful",
            description: "Welcome to LaunchBlocks!",
          });
          
          // Determine target URL
          const targetUrl = registerResponse.user.role === 'founder' ? '/startup/dashboard' : '/investor/dashboard';
          console.log("Preparing navigation to dashboard:", targetUrl);
          
          // Add a waiting message
          toast({
            title: "Success",
            description: "Preparing your dashboard...",
          });
          
          // Navigate immediately to the appropriate dashboard
          navigateToTarget(targetUrl);
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <i className="fas fa-cubes text-accent text-3xl"></i>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLoginMode ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLoginMode ? 'Or ' : 'Already have an account? '}
          <button
            className="font-medium text-primary hover:text-blue-500"
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? 'create a new account' : 'sign in instead'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div className="mb-6">
                <Label className="block text-sm font-medium text-gray-700 mb-2">I am a:</Label>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant={role === 'founder' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleRoleChange('founder')}
                    >
                      <span>Startup Founder</span>
                    </Button>
                  </div>
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant={role === 'investor' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleRoleChange('investor')}
                    >
                      <span>Investor</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            {!isLoginMode && (
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="mt-1">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </Label>
              </div>

              {isLoginMode && (
                <div className="text-sm">
                  <span 
                    className="font-medium text-primary hover:text-blue-500 cursor-pointer"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Forgot your password?
                  </span>
                </div>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (isLoginMode ? 'Signing in...' : 'Signing up...') : (isLoginMode ? 'Sign in' : 'Sign up')}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleConnectWallet}
                >
                  <span>
                    {walletAddress ? 'Wallet Connected' : 'Connect with MetaMask'}
                  </span>
                </Button>
                {walletAddress && (
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;