import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PostDetailPage from "./pages/PostDetailPage";
import Analytics from "./pages/Analytics";
import QueuePage from "./pages/QueuePage";
import ArchivesPage from "./pages/ArchivesPage";
import CompetitiveIntelligence from "./pages/CompetitiveIntelligence";
import AuthPage from "./pages/AuthPage";
import LogoutPage from "./pages/LogoutPage";
import SocialAccountsPage from "./pages/SocialAccountsPage";
import LeadsPage from "./pages/LeadsPage";
import PublicationsPage from "./pages/PublicationsPage";
import SettingsPage from "./pages/SettingsPage";
import CreationPage from "./pages/CreationPage";
import PricingPage from "./pages/PricingPage";
import CheckoutSimulation from "./pages/CheckoutSimulation";

const queryClient = new QueryClient();

// MainLayout contient la sidebar + header + content
function MainLayout() {
  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Index />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/competitors" element={<CompetitiveIntelligence />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/accounts" element={<SocialAccountsPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/publications" element={<PublicationsPage />} />
        <Route path="/creation" element={<CreationPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

// Composant pour les routes protégées
const ProtectedRoutes = () => {
  return (
    <Routes>
      {/* Route publique - Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/checkout" element={<CheckoutSimulation />} />
      
      {/* Redirection pour /calendar vers /app/calendar */}
      <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
      
      {/* Route de déconnexion - SANS Layout */}
      <Route path="/logout" element={<LogoutPage />} />

      {/* Routes protégées */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <ProtectedRoutes />
          </BrowserRouter>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
