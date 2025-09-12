import AppHeader from "@/components/app-header";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import GeminiChat from "@/pages/gemini-chat";
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import RegisterPage from "@/pages/register";
import ScripturePage from "@/pages/scripture";
import SermonPrepPage from "@/pages/sermon-prep";
import SharedCollectionPage from "@/pages/shared-collection";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";

function ProtectedRoute({ component: Component }: { component: any }) {
  const { me } = useAuth();
  const [location, setLocation] = useLocation();
  useEffect(() => {
    // When auth is required and user is not logged in, redirect
    const requireAuth = (import.meta as any).env?.VITE_REQUIRE_AUTH === 'true' || true; // assume true when server enforces
    if (requireAuth && me.isError) setLocation('/login');
  }, [me.isError]);
  if (me.isLoading) return null;
  if (me.isError) return null;
  return <Component />;
}

function Router() {
  useScrollToTop();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gemini-chat" component={GeminiChat} />
      <Route path="/scripture-search" component={ScripturePage} />
      <Route path="/podcast-studio" component={Home} />
      <Route path="/media-creator" component={Home} />
      <Route path="/share/collection" component={SharedCollectionPage} />
      <Route path="/sermon-prep" component={() => <ProtectedRoute component={SermonPrepPage} />} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppHeader />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
