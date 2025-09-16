import AppHeader from "@/components/app-header";
import AdminDashboard from "@/components/admin-dashboard";
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
import AudioEditorPage from "@/pages/audio-editor";
import MediaCenterPage from "@/pages/media-center";
import MediaImagesPage from "@/pages/media-images";
import MediaVideosPage from "@/pages/media-videos";
import MediaAudiosPage from "@/pages/media-audios";
import PodcastStudioPage from "@/pages/podcast-studio";
import SocialMediaPage from "@/pages/social-media";
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
      <Route path="/podcast-studio" component={() => <ProtectedRoute component={PodcastStudioPage} />} />
      <Route path="/media-creator" component={() => <ProtectedRoute component={MediaCenterPage} />} />
      <Route path="/media/images" component={() => <ProtectedRoute component={MediaImagesPage} />} />
      <Route path="/media/videos" component={() => <ProtectedRoute component={MediaVideosPage} />} />
      <Route path="/media/audios" component={() => <ProtectedRoute component={MediaAudiosPage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} />} />
      <Route path="/audio-editor" component={() => <ProtectedRoute component={AudioEditorPage} />} />
      <Route path="/social-media" component={() => <ProtectedRoute component={SocialMediaPage} />} />
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
