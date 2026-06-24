import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ConfigurationRequired from "@/components/ConfigurationRequired";
import { environment } from "@/config/environment";

const Layout = lazy(() =>
  import("@/components/Layout").then((module) => ({ default: module.Layout })),
);
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const VibePartnerChat = lazy(() => import("@/pages/VibePartnerChat"));
const CBTTherapist = lazy(() => import("@/pages/CBTTherapist"));
const CommonRoom = lazy(() => import("@/pages/CommonRoom"));
const Shop = lazy(() => import("@/pages/Shop"));
const MoodTracker = lazy(() => import("@/pages/MoodTracker"));
const MoodDashboard = lazy(() => import("@/pages/MoodDashboard"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
    Loading VibeCare…
  </div>
);

const App = () => {
  if (!environment.isSupabaseConfigured) {
    return <ConfigurationRequired />;
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vibe-partner" element={<VibePartnerChat />} />
              <Route path="/cbt-therapist" element={<CBTTherapist />} />
              <Route path="/common-room" element={<CommonRoom />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/mood-tracker" element={<MoodTracker />} />
              <Route path="/mood-dashboard" element={<MoodDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
