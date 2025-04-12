import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Menu } from "lucide-react";
import { getNameInitials } from '@/lib/utils';

interface NavBarProps {
  transparent?: boolean;
}

// Interface for decoded user token
interface DecodedUser {
  id?: string;
  email: string;
  username?: string;
  role: 'founder' | 'investor';
  iat?: number;
  exp?: number;
}

const NavBar: React.FC<NavBarProps> = ({ transparent = false }) => {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for token and decode user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Decode token to get user info
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        
        const userData = JSON.parse(jsonPayload) as DecodedUser;
        setUser(userData);
        console.log("NavBar: Decoded user from token:", userData);
      } catch (e) {
        console.error("NavBar: Error decoding token", e);
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // Direct token check for authentication
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  
  // Debug logging
  console.log("NavBar: auth state =", { 
    isAuthenticated,
    hasToken: !!token,
    isLoading,
    userEmail: user?.email,
    userRole: user?.role
  });

  const handleLogout = () => {
    console.log("NavBar: Logging out user");
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    // Force reload the page to ensure all state is properly reset
    setTimeout(() => {
      console.log("NavBar: Navigating to home after logout");
      window.location.href = '/';
    }, 100);
  };

  return (
    <header className={`${transparent ? 'bg-transparent absolute w-full z-10' : 'bg-white shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <i className="fas fa-cubes text-accent text-2xl mr-2"></i>
                <span className={`text-xl font-bold ${transparent ? 'text-white' : 'text-gray-900'}`}>LaunchBlocks</span>
            </div>
            
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <div 
                className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium cursor-pointer`}
                onClick={() => navigate('/#features')}
              >
                Features
              </div>
              <div 
                className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium cursor-pointer`}
                onClick={() => navigate('/#how-it-works')}
              >
                How It Works
              </div>
              <div 
                className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium cursor-pointer`}
                onClick={() => navigate('/#featured-startups')}
              >
                Featured Startups
              </div>
            </nav>
          </div>
          
          <div className="flex items-center">
            {/* Check if user is authenticated by token or user object existence */}
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Bell className="h-5 w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user ? getNameInitials(user.username || user.email || '') : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user ? (
                      <>
                        <DropdownMenuLabel>
                          {user.username ? (
                            <>
                              <span className="font-medium">{user.username}</span>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </>
                          ) : (
                            user.email
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {user.role === 'founder' ? 'Founder' : 'Investor'}
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {user.role === 'founder' ? (
                          <DropdownMenuItem onClick={() => navigate('/startup/dashboard')}>
                            Startup Dashboard
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => navigate('/investor/dashboard')}>
                            Investor Dashboard
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => navigate('/messages')}>
                          Messages
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => 
                          navigate(user.role === 'founder' ? '/startup/transactions' : '/investor/transactions')
                        }>
                          Transactions
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuLabel>
                          Loading user data...
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      Settings
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Show sign in/sign up buttons by default 
              // Only show loading state when we know there's a token but the user data isn't loaded yet
              (isLoading && token) ? (
                // Show a loading state only when token exists but we're still loading user data
                <div className="px-3 py-2 text-sm text-gray-500">
                  Loading...
                </div>
              ) : (
                // Otherwise, always show the sign in buttons
                <>
                  <div 
                    className={`${transparent ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} px-3 py-2 text-sm font-medium cursor-pointer`}
                    onClick={() => navigate('/auth/signin')}
                  >
                    Sign In
                  </div>
                  <div 
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 cursor-pointer"
                    onClick={() => navigate('/auth/signup')}
                  >
                    Sign Up
                  </div>
                </>
              )
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden ml-4">
              <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <div
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate('/#features')}
              >
                Features
              </div>
              <div
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate('/#how-it-works')}
              >
                How It Works
              </div>
              <div
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate('/#featured-startups')}
              >
                Featured Startups
              </div>
              
              {/* Mobile menu authentication check - using same logic as desktop */}
              {isAuthenticated ? (
                <>
                  {user ? (
                    <>
                      <div className="block px-3 py-2 rounded-md text-base font-medium text-gray-900">
                        {user.email}
                        <div className="text-xs text-gray-500 mt-1">
                          {user.role === 'founder' ? 'Founder' : 'Investor'}
                        </div>
                      </div>
                      
                      {user.role === 'founder' ? (
                        <div
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate('/startup/dashboard')}
                        >
                          Startup Dashboard
                        </div>
                      ) : (
                        <div
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate('/investor/dashboard')}
                        >
                          Investor Dashboard
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="block px-3 py-2 rounded-md text-base font-medium text-gray-900">
                      Loading user data...
                    </div>
                  )}
                  <div
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/messages')}
                  >
                    Messages
                  </div>
                  <div
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/settings')}
                  >
                    Settings
                  </div>
                  <div
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                    onClick={handleLogout}
                  >
                    Log out
                  </div>
                </>
              ) : (
                // Show sign in/sign up buttons by default for mobile menu too
                // Only show loading when we have a token but user data isn't loaded yet
                (isLoading && token) ? (
                  <div className="block px-3 py-2 text-sm text-gray-500">
                    Loading...
                  </div>
                ) : (
                  <>
                    <div
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate('/auth/signin')}
                    >
                      Sign In
                    </div>
                    <div
                      className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:text-blue-700 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate('/auth/signup')}
                    >
                      Sign Up
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
