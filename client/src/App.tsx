import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import StartupDashboardPage from "@/pages/StartupDashboardPage";
import InvestorDashboardPage from "@/pages/InvestorDashboardPage";
import StartupProfile from "@/pages/StartupProfile";
import StartupCreate from "@/pages/StartupCreate";
import StartupTransactions from "@/pages/StartupTransactions";
import InvestorTransactions from "@/pages/InvestorTransactions";
import StartupDetailsPage from "@/pages/StartupDetailsPage";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import { useAuth } from "./lib/context/AuthContext";
import { useEffect } from "react";

// Protected route component that requires authentication
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) => {
  const [, navigate] = useLocation();
  
  // Simple function to render the route
  return (
    <Route
      {...rest}
      component={(props: any) => {
        // Check token directly
        const token = localStorage.getItem('token');
        
        // If we have a token, allow access to the route
        if (token) {
          console.log(`ProtectedRoute[${rest.path}]: Token exists, rendering protected component`);
          return <Component {...props} />;
        }
        
        // No token - redirect to login
        console.log(`ProtectedRoute[${rest.path}]: No token found, redirecting to login`);
        navigate('/auth/signin');
        
        // Show login required message
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md text-center">
              <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
              <p className="mb-4">Please log in to access this page.</p>
              <button 
                className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600"
                onClick={() => navigate('/auth/signin')}
              >
                Sign In
              </button>
            </div>
          </div>
        );
      }}
    />
  );
};

function Router() {
  console.log("Rendering Router component");
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    console.log("Current location:", location);
    
    // Simple check to redirect authenticated users away from auth pages
    if (location.startsWith('/auth') && localStorage.getItem('token')) {
      console.log("Router: Token found, redirecting from auth page");
      // Check path to avoid unnecessary redirects
      if (location !== '/auth/signin' && location !== '/auth/signup') {
        navigate('/');
      }
    }
  }, [location, navigate]);
  
  // Code to check if a founder has a startup
  useEffect(() => {
    // Only run this for dashboard path and when authenticated
    if (location === '/startup/dashboard' && localStorage.getItem('token')) {
      // Check if a user is a newly registered founder without a startup
      const checkStartupExistence = async () => {
        try {
          // Get the user ID from the token (this is a simplified approach)
          const token = localStorage.getItem('token');
          if (!token) return;
          
          // Get user data
          const userResponse = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!userResponse.ok) {
            console.error('Failed to fetch user data');
            return;
          }
          
          const userData = await userResponse.json();
          const userId = userData.user?._id;
          
          if (!userId) {
            console.error('No user ID found');
            return;
          }
          
          // Check if user has a startup
          const startupResponse = await fetch(`/api/startups/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          // If 404, user has no startup, redirect to create page
          if (startupResponse.status === 404) {
            console.log('No startup found for user, redirecting to create page');
            sessionStorage.removeItem('startup_created');
            navigate('/startup/create');
            return;
          }
          
          if (!startupResponse.ok && startupResponse.status !== 404) {
            console.error('Error checking startup existence');
            return;
          }
          
          // If we got here, user has a startup
          if (startupResponse.ok) {
            console.log('User has existing startup, setting flag to prevent redirect loop');
            sessionStorage.setItem('startup_created', 'true');
          }
        } catch (error) {
          console.error('Error in startup existence check:', error);
        }
      };
      
      checkStartupExistence();
    }
  }, [location, navigate]);
  
  // Simple routing for demo purposes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/:type" component={Auth} />
      
      {/* Startup routes */}
      <ProtectedRoute path="/startup/dashboard" component={StartupDashboardPage} />
      <ProtectedRoute path="/startup/create" component={StartupCreate} />
      <ProtectedRoute path="/startup/transactions" component={StartupTransactions} />
      <Route path="/startup/:id" component={StartupProfile} />
      
      {/* Investor routes */}
      <ProtectedRoute path="/investor/dashboard" component={InvestorDashboardPage} />
      <ProtectedRoute path="/investor/transactions" component={InvestorTransactions} />
      
      {/* Shared startup details page - accessible to both investors and founders */}
      <ProtectedRoute path="/startup/details/:id" component={StartupDetailsPage} />
      
      {/* Shared routes */}
      <ProtectedRoute path="/messages/:userId?" component={Messages} />
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("Rendering App component");
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
