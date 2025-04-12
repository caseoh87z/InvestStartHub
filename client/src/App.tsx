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
    // Only redirect if not loading and not authenticated
    if (!isLoading && !isAuth) {
      console.log("ProtectedRoute: User not authenticated, redirecting to login");
      // Force immediate redirect to auth page
      navigate('/auth/signin');
    }
  }, [isAuth, isLoading, navigate, rest.path]);
  
  console.log(`ProtectedRoute[${rest.path}]: auth state = ${isAuth ? 'authenticated' : 'not authenticated'}, loading = ${isLoading}`);
  
  // Return a component function that respects authentication state
  return (
    <Route
      {...rest}
      component={(props: any) => {
        // Show nothing while authentication is loading
        if (isLoading) {
          return <div className="p-8 text-center">Loading...</div>;
        }
        
        // Render the protected component only when authenticated
        if (isAuth && user) {
          console.log(`ProtectedRoute[${rest.path}]: Rendering protected component for ${user.email}`);
          return <Component {...props} />;
        }
        
        // Otherwise, render nothing (the redirect will happen via useEffect)
        return <div className="p-8 text-center">You must be logged in to view this page. Redirecting...</div>;
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
