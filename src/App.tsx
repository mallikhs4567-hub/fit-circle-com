import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppLayout } from "@/components/layout/AppLayout";
import { SplashScreen } from "@/components/common/SplashScreen";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Circle from "@/pages/Circle";
import Fitness from "@/pages/Fitness";
import Search from "@/pages/Search";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import UserProfile from "@/pages/UserProfile";
import Challenges from "@/pages/Challenges";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import AICoach from "@/pages/AICoach";
import Premium from "@/pages/Premium";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isOnboarded, loading: profileLoading } = useProfile();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!isOnboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/fitness" replace />} />
      <Route path="/onboarding" element={<Navigate to="/fitness" replace />} />
      <Route path="/settings" element={<Settings />} />
      <Route element={<AppLayout />}>
        <Route path="/circle" element={<Circle />} />
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/search" element={<Search />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
        <Route path="/ai-coach" element={<AICoach />} />
        <Route path="/premium" element={<Premium />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);


export default App;
