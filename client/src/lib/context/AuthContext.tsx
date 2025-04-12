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
  authInitialized: boolean; // Not optional anymore
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuth: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  authInitialized: false, // Add default value
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { toast } = useToast();
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthContext - Running authentication check...");
      setIsLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log("AuthContext - Token status:", token ? `Token exists (${token.substring(0, 15)}...)` : "No token found");
      
      if (!token) {
        console.log("AuthContext - No token found, user is not authenticated");
        setUser(null);
        setIsLoading(false);
        setAuthInitialized(true);
        return;
      }
      
      console.log("AuthContext - Token found in localStorage, attempting to validate...");
      
      try {
        // Parse JWT token to extract user data
        const base64Url = token.split('.')[1];
        if (!base64Url) {
          console.error("AuthContext - Invalid token format, no payload segment found");
          throw new Error('Invalid token format');
        }
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        let jsonPayload: string;
        
        try {
          jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
        } catch (parseError) {
          console.error("AuthContext - Failed to parse token payload:", parseError);
          throw new Error('Could not parse token payload');
        }
        
        const payload = JSON.parse(jsonPayload);
        console.log("AuthContext - Successfully extracted user info from token:", {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'none'
        });
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          console.error("AuthContext - Token expired at", new Date(payload.exp * 1000).toLocaleString());
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
        console.log("AuthContext - User is now authenticated from token!");
        
        // Also try to fetch the latest user data from the server
        try {
          console.log("AuthContext - Attempting to fetch fresh user data from server...");
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
        setAuthInitialized(true);
        console.log("AuthContext - Authentication check complete");
      }
    };
    
    checkAuth();
  }, [toast]);
  
  // Login function
  const handleLogin = (token: string, userData: User) => {
    console.log("AuthContext - Login called with token and user data:", userData.email);
    setAuthToken(token);
    setUser(userData);
    // Ensure we mark auth as initialized and not loading
    setAuthInitialized(true);
    setIsLoading(false);
    console.log("AuthContext - Login complete, user is authenticated");
  };
  
  // Logout function
  const handleLogout = () => {
    console.log("AuthContext - Logging out, clearing user data and token");
    // Call the auth utility logout function to clear token
    logout();
    // Explicitly clear the user state
    setUser(null);
    // Keep auth as initialized but update loading state briefly
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
    isLoading,
    authInitialized
  });
  
  const value = {
    user,
    isLoading,
    isAuth,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
    authInitialized,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
