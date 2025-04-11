import { apiRequest } from './queryClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'founder' | 'investor';
  walletAddress?: string;
}

interface AuthResponse {
  user: {
    id: number;
    email: string;
    role: string;
    walletAddress?: string;
  };
  token: string;
}

// Register new user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiRequest('POST', '/api/auth/register', data);
  return await response.json();
};

// Login user
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  console.log("Calling login API with credentials:", credentials.email);
  const response = await apiRequest('POST', '/api/auth/login', credentials);
  console.log("Login API response status:", response.status);
  const data = await response.json();
  console.log("Login API response data:", data);
  return data;
};

// Get current user
export const getCurrentUser = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to get current user');
  }
  
  return await response.json();
};

// Store auth token
export const setAuthToken = (token: string): void => {
  console.log("Setting auth token in localStorage");
  localStorage.setItem('token', token);
};

// Get auth token
export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('token');
  console.log("Getting auth token from localStorage:", token ? "Token exists" : "No token found");
  return token;
};

// Remove auth token
export const removeAuthToken = (): void => {
  console.log("Removing auth token from localStorage");
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const isAuth = !!token;
  console.log("Authentication check:", isAuth ? "User is authenticated" : "User is not authenticated");
  return isAuth;
};

// Logout user
export const logout = (): void => {
  removeAuthToken();
};
