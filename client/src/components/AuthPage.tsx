import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/context/AuthContext';
import { login, register } from '@/lib/auth';
import { connectWallet } from '@/lib/web3';

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'founder' | 'investor'>('investor');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const [location, navigate] = useLocation();

  const handleRoleChange = (selectedRole: 'founder' | 'investor') => {
    setRole(selectedRole);
  };

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      toast({
        title: "Wallet connected",
        description: `Connected to wallet: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      });
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Wallet connection failed",
        description: "Could not connect to MetaMask. Please make sure it's installed and unlocked.",
        variant: "destructive",
      });
    }
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
    
    try {
      if (isLoginMode) {
        // Login
        const result = await login({ email, password });
        authLogin(result.token, result.user);
        
        toast({
          title: "Login successful",
          description: "Welcome back to LaunchBlocks!",
        });
        
        // Redirect based on user role
        if (result.user.role === 'founder') {
          navigate('/startup/dashboard');
        } else {
          navigate('/investor/dashboard');
        }
      } else {
        // Registration
        const result = await register({ 
          email, 
          password, 
          role,
          walletAddress: walletAddress || undefined
        });
        
        authLogin(result.token, result.user);
        
        toast({
          title: "Registration successful",
          description: "Welcome to LaunchBlocks!",
        });
        
        // Redirect based on user role
        if (role === 'founder') {
          navigate('/startup/create');
        } else {
          navigate('/investor/dashboard');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: isLoginMode ? "Login failed" : "Registration failed",
        description: "Please check your credentials and try again.",
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
                      <i className="fas fa-rocket mr-2"></i>
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
                      <i className="fas fa-chart-line mr-2"></i>
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
                  <Link href="/forgot-password">
                    <a className="font-medium text-primary hover:text-blue-500">
                      Forgot your password?
                    </a>
                  </Link>
                </div>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : isLoginMode ? 'Sign in' : 'Sign up'}
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
                  <i className="fab fa-ethereum mr-2 text-purple-600"></i>
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
