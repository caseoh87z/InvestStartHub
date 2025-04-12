import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated, logout, setAuthToken } from '../auth';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  role: string;
  walletAddress?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuth: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuth: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthContext - Running authentication check...");
      setIsLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log("AuthContext - No token found, user is not authenticated");
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      console.log("AuthContext - Token found in localStorage, attempting to validate...");
      
      try {
        // Parse JWT token to extract user data
        const base64Url = token.split('.')[1];
        if (!base64Url) {
          throw new Error('Invalid token format');
        }
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        
        const payload = JSON.parse(jsonPayload);
        console.log("AuthContext - Successfully extracted user info from token:", payload);
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          throw new Error('Token expired');
        }
        
        // Set auth token for API requests
        setAuthToken(token);
        
        // Set user data from the token
        const userData = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          walletAddress: payload.walletAddress
        };
        
        console.log("AuthContext - Setting user data:", userData);
        setUser(userData);
        console.log("AuthContext - User is now authenticated!");
        
        // Also try to fetch the latest user data from the server
        try {
          const freshUserData = await getCurrentUser();
          if (freshUserData) {
            console.log("AuthContext - Got fresh user data from server:", freshUserData);
            setUser(freshUserData);
          }
        } catch (serverError) {
          console.warn("AuthContext - Couldn't fetch fresh user data, using token data instead", serverError);
          // Continue with the token data if API request fails
        }
      } catch (error) {
        console.error('AuthContext - Authentication error:', error);
        // Clear invalid token
        handleLogout();
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [toast]);
  
  // Login function
  const handleLogin = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
  };
  
  // Logout function
  const handleLogout = () => {
    console.log("AuthContext - Logging out, clearing user data and token");
    // Call the auth utility logout function to clear token
    logout();
    // Explicitly clear the user state
    setUser(null);
    // Force a re-render by updating isLoading temporarily
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log("AuthContext - Logout complete, user state cleared");
    }, 50);
  };
  
  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };
  
  // Check if user is authenticated - safer approach
  const isAuth = !!user;
  
  // Debug output to help track authentication state
  console.log("AuthContext - Computed auth state:", { 
    user: user?.email,
    isAuth,
    isLoading
  });
  
  const value = {
    user,
    isLoading,
    isAuth,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
