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
import Messages from "@/pages/Messages";
import { useAuth } from "./lib/context/AuthContext";
import { useEffect } from "react";

// Define types for protected route props
interface ProtectedRouteProps {
  component: React.ComponentType;
  requiredRole?: 'founder' | 'investor' | null;
}

// Protected route wrapper
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, requiredRole = null }) => {
  const { isAuth, user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  console.log(`ProtectedRoute: isAuth=${isAuth}, isLoading=${isLoading}, user.role=${user?.role}, requiredRole=${requiredRole}`);
  
  // Show loading state while auth is being checked
  if (isLoading) {
    console.log('Auth loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  useEffect(() => {
    // If not authenticated and done loading, redirect to login
    if (!isLoading && !isAuth) {
      console.log('Not authenticated, redirecting to login');
      window.location.href = '/auth/login'; // Use hard navigation to avoid routing issues
      return;
    }
    
    // If role is required but user doesn't have it, redirect to appropriate dashboard
    if (!isLoading && isAuth && requiredRole && user?.role !== requiredRole) {
      console.log(`Role mismatch: user=${user?.role}, required=${requiredRole}, redirecting`);
      if (user?.role === 'founder') {
        window.location.href = '/startup/dashboard'; // Use hard navigation
      } else if (user?.role === 'investor') {
        window.location.href = '/investor/dashboard'; // Use hard navigation
      }
    }
  }, [isAuth, user, requiredRole, navigate, isLoading]);

  // Only render the component if authenticated and role matches
  return (!isLoading && isAuth && (!requiredRole || user?.role === requiredRole)) ? <Component /> : null;
};

function Router() {
  console.log("Rendering Router component");
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/:type" component={Auth} />
      
      {/* Founder Routes - Define without using function components for cleaner rendering */}
      <Route path="/startup/dashboard">
        <ProtectedRoute component={StartupDashboardPage} requiredRole="founder" />
      </Route>
      <Route path="/startup/profile">
        <ProtectedRoute component={StartupProfile} requiredRole="founder" />
      </Route>
      <Route path="/startup/create">
        <ProtectedRoute component={StartupCreate} requiredRole="founder" />
      </Route>
      <Route path="/startup/transactions">
        <ProtectedRoute component={StartupTransactions} requiredRole="founder" />
      </Route>
      
      {/* Investor Routes */}
      <Route path="/investor/dashboard">
        <ProtectedRoute component={InvestorDashboardPage} requiredRole="investor" />
      </Route>
      <Route path="/investor/transactions">
        <ProtectedRoute component={InvestorTransactions} requiredRole="investor" />
      </Route>
      
      {/* Shared Routes */}
      <Route path="/messages">
        <ProtectedRoute component={Messages} />
      </Route>
      
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
