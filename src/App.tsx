import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import VibePartnerChat from "./pages/VibePartnerChat";
import CBTTherapist from "./pages/CBTTherapist";
import CommonRoom from "./pages/CommonRoom";
import Shop from "./pages/Shop";
import MoodTracker from "./pages/MoodTracker";
import MoodDashboard from "./pages/MoodDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
