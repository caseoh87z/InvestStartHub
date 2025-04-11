import { Switch, Route } from "wouter";
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

function Router() {
  const { isAuth, user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/:type" component={Auth} />
      
      {/* Protected Routes */}
      {isAuth && user?.role === "founder" && (
        <>
          <Route path="/startup/dashboard" component={StartupDashboardPage} />
          <Route path="/startup/profile" component={StartupProfile} />
          <Route path="/startup/create" component={StartupCreate} />
          <Route path="/startup/transactions" component={StartupTransactions} />
        </>
      )}
      
      {isAuth && user?.role === "investor" && (
        <>
          <Route path="/investor/dashboard" component={InvestorDashboardPage} />
          <Route path="/investor/transactions" component={InvestorTransactions} />
        </>
      )}
      
      {isAuth && (
        <Route path="/messages" component={Messages} />
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
