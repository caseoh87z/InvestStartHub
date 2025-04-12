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
      const token = localStorage.getItem('token');
      
      if (token) {
        console.log("AuthContext - Token found in localStorage, attempting to parse...");
        try {
          // Parse JWT token to extract user data
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          
          const payload = JSON.parse(jsonPayload);
          console.log("AuthContext - Successfully extracted user info from token:", payload);
          
          // Set user data from the token
          const userData = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            // walletAddress might be missing from token
            walletAddress: payload.walletAddress
          };
          
          console.log("AuthContext - Setting user data:", userData);
          setUser(userData);
          console.log("AuthContext - User is now authenticated!");
        } catch (error) {
          console.error('AuthContext - Failed to parse user data from token', error);
          // Clear invalid token
          logout();
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
        }
      } else {
        console.log("AuthContext - No token found, user is not authenticated");
      }
      
      setIsLoading(false);
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
    logout();
    setUser(null);
  };
  
  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };
  
  const value = {
    user,
    isLoading,
    isAuth: !!user,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
