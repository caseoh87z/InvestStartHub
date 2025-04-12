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
  const { isAuth, isLoading, user, authInitialized } = useAuth();
  const [, navigate] = useLocation();
  
  // Set a timeout to prevent the loading state from lasting forever
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log(`ProtectedRoute[${rest.path}]: auth state =`, { 
      isAuth, 
      isLoading, 
      authInitialized, 
      hasToken: !!token,
      userEmail: user?.email 
    });
    
    // Only redirect if the auth state is fully initialized, and we're not authenticated and have no token
    if (authInitialized && !isLoading && !isAuth && !token) {
      console.log("ProtectedRoute: User not authenticated, redirecting to login");
      navigate('/auth/signin');
    }
    
    // No need for a loading timeout since we now have clear auth initialization state
    
  }, [isAuth, isLoading, authInitialized, user, navigate, rest.path]);
  
  // Return a component function that respects authentication state
  return (
    <Route
      {...rest}
      component={(props: any) => {
        // Get token directly to be extra safe
        const token = localStorage.getItem('token');
        
        // If auth is not initialized yet, show a loading indicator
        if (!authInitialized) {
          console.log(`ProtectedRoute[${rest.path}]: Auth not initialized yet, showing loading indicator`);
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold">Initializing...</h2>
                <p className="text-muted-foreground">Setting up your session...</p>
              </div>
            </div>
          );
        }
        
        // If user data is loaded (most secure case), render the component
        if (isAuth && user) {
          console.log(`ProtectedRoute[${rest.path}]: Auth complete, rendering component for ${user?.email}`);
          return <Component {...props} />;
        }
        
        // If we have a token but auth failed (edge case), attempt to render anyway
        if (token && !isLoading && !isAuth && authInitialized) {
          console.log(`ProtectedRoute[${rest.path}]: Token exists but auth failed, rendering component anyway`);
          return <Component {...props} />;
        }
        
        // If we have a token and auth is still loading, show loading indicator
        if (token && isLoading) {
          console.log(`ProtectedRoute[${rest.path}]: Authentication in progress - token exists but still loading user data`);
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold">Loading your dashboard...</h2>
                <p className="text-muted-foreground">Please wait a moment while we prepare your dashboard.</p>
              </div>
            </div>
          );
        }
        
        // If auth is initialized, not loading, and we don't have a token, show login prompt
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md text-center">
              <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
              <p className="mb-4">You must be logged in to view this page.</p>
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
  const { isAuth, user, isLoading, authInitialized } = useAuth();
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    console.log("Current location:", location);
  }, [location]);

  // Redirect authenticated users away from auth pages, but only once auth is fully initialized
  useEffect(() => {
    if (authInitialized && isAuth && location.startsWith('/auth')) {
      console.log("Router: Auth initialized and user authenticated, redirecting from auth page");
      navigate('/');
    }
  }, [isAuth, authInitialized, location, navigate]);
  
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
