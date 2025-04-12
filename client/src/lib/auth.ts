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
  console.log("Calling register API with credentials:", data.email);
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log("Register API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Register API error response:", errorText);
      throw new Error(`Registration failed: ${errorText || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    
    // Store token in localStorage immediately
    if (responseData && responseData.token) {
      console.log("Storing auth token from register response");
      localStorage.setItem('token', responseData.token);
    }
    
    console.log("Register API response data:", responseData);
    return responseData;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

// Login user
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  console.log("Calling login API with credentials:", credentials.email);
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log("Login API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Login API error response:", errorText);
      throw new Error(`Login failed: ${errorText || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    
    // Store token in localStorage immediately
    if (responseData && responseData.token) {
      console.log("Storing auth token from login response");
      localStorage.setItem('token', responseData.token);
    }
    
    console.log("Login API response data:", responseData);
    return responseData;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log("No authentication token found");
    throw new Error('No authentication token found');
  }
  
  console.log("Attempting to get current user with token", token ? "Token exists" : "No token");
  
  try {
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Current user API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Current user API error response:", errorText);
      throw new Error('Failed to get current user');
    }
    
    const data = await response.json();
    console.log("Current user data received:", data);
    return data.user;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    throw error;
  }
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
