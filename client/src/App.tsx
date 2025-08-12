import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import PurchaseOrders from "@/pages/purchase-orders";
import Invoices from "@/pages/invoices";
import Documents from "@/pages/documents";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import VendorOnboarding from "@/pages/vendor-onboarding";
import VendorInvite from "@/pages/vendor-invite";
import AppShell from "@/components/layout/app-shell";

function Router() {
  // Bypass authentication - allow access to all routes
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={LoginPage} />
      {/* Portal routes - accessible without authentication */}
      <Route path="/dashboard">
        <AppShell>
          <Dashboard />
        </AppShell>
      </Route>
      <Route path="/vendor-onboarding">
        <AppShell>
          <VendorOnboarding />
        </AppShell>
      </Route>
      <Route path="/vendor-onboarding/invite">
        <AppShell>
          <VendorInvite />
        </AppShell>
      </Route>
      <Route path="/purchase-orders">
        <AppShell>
          <PurchaseOrders />
        </AppShell>
      </Route>
      <Route path="/invoices">
        <AppShell>
          <Invoices />
        </AppShell>
      </Route>
      <Route path="/documents">
        <AppShell>
          <Documents />
        </AppShell>
      </Route>
      <Route path="/messages">
        <AppShell>
          <Messages />
        </AppShell>
      </Route>
      <Route path="/profile">
        <AppShell>
          <Profile />
        </AppShell>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
