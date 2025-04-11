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
      if (isAuthenticated()) {
        try {
          // Get user data from localStorage instead of API
          const token = localStorage.getItem('token');
          if (token) {
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
            console.log("Extracted user info from token:", payload);
            
            // Just use the data from the token instead of making an API call
            setUser({
              id: payload.id,
              email: payload.email,
              role: payload.role,
              // Other fields like walletAddress will not be available from the token
            });
          }
        } catch (error) {
          console.error('Failed to parse user data from token', error);
          logout();
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
        }
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
