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
  const { isAuth, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  
  // Enhanced authentication check that properly redirects
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log(`ProtectedRoute[${rest.path}]: token exists = ${!!token}`);
    
    // Only redirect if not loading and not authenticated and no token
    if (!isLoading && !isAuth && !token) {
      console.log("ProtectedRoute: User not authenticated, redirecting to login");
      navigate('/auth/signin');
    }
  }, [isAuth, isLoading, navigate, rest.path]);
  
  console.log(`ProtectedRoute[${rest.path}]: auth state = ${isAuth ? 'authenticated' : 'not authenticated'}, loading = ${isLoading}`);
  
  // Return a component function that respects authentication state
  return (
    <Route
      {...rest}
      component={(props: any) => {
        // Get token directly to be extra safe
        const token = localStorage.getItem('token');
        
        // If we have a token or the user is authenticated, we should render the protected component
        if (token || (isAuth && user)) {
          if (token) {
            console.log(`ProtectedRoute[${rest.path}]: Rendering protected component - token exists`);
          } else {
            console.log(`ProtectedRoute[${rest.path}]: Rendering protected component for ${user?.email}`);
          }
          
          // Even if we have a token, make sure we only render when the user data is actually loaded
          // or when there's no isLoading flag anymore
          if (user || !isLoading) {
            return <Component {...props} />;
          }
        }
        
        // Show a nice loading state when authentication is in progress
        if (isLoading || token) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold">Authentication in progress...</h2>
                <p className="text-muted-foreground">Please wait while we verify your credentials.</p>
              </div>
            </div>
          );
        }
        
        // Otherwise show a message that the user needs to log in
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
  const { isAuth, user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    console.log("Current location:", location);
  }, [location]);

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (isAuth && location.startsWith('/auth')) {
      navigate('/');
    }
  }, [isAuth, location, navigate]);
  
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
