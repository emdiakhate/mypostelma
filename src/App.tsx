import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import PostDetailPage from "./pages/PostDetailPage";
import Analytics from "./pages/Analytics";

import ArchivesPage from "./pages/ArchivesPage";
import CompetitorsPage from "./pages/CompetitorsPage";
import CompetitorsComparePage from "./pages/CompetitorsComparePage";
import ComparativeAnalysisPage from "./pages/ComparativeAnalysisPage";
import AuthPage from "./pages/AuthPage";
import SocialAccountsPage from "./pages/SocialAccountsPage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import PublicationsPage from "./pages/PublicationsPage";
import SettingsPage from "./pages/SettingsPage";
import CreationPage from "./pages/CreationPage";
import PricingPage from "./pages/PricingPage";
import AdminPage from "./pages/AdminPage";
import CheckoutSimulation from "./pages/CheckoutSimulation";
import ConnectSocialAccounts from "./pages/ConnectSocialAccounts";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import ConnectingAccountPage from "./pages/ConnectingAccountPage";
import DialogTestPage from "./pages/DialogTestPage";
import InboxPage from "./pages/InboxPage";
import ConnectedAccountsPage from "./pages/ConnectedAccountsPage";
import TeamsPage from "./pages/TeamsPage";
import ConfigPage from "./pages/crm/ConfigPage";
import AcquisitionPage from "./pages/crm/AcquisitionPage";
import CRMLeadsPage from "./pages/crm/CRMLeadsPage";
import CampaignsPage from "./pages/crm/CampaignsPage";
import OAuthCallback from "./pages/OAuthCallback";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";

const queryClient = new QueryClient();

// MainLayout contient la sidebar + header + content
function MainLayout() {
  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Index />} />
        <Route path="/analytics" element={<Analytics />} />

        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/messages" element={<InboxPage />} />
        <Route path="/connections" element={<ConnectedAccountsPage />} />
        <Route path="/teams" element={<TeamsPage />} />

        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/competitors" element={<CompetitorsPage />} />
        <Route path="/competitors/compare" element={<CompetitorsComparePage />} />
        <Route path="/comparative-analysis" element={<ComparativeAnalysisPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/accounts" element={<SocialAccountsPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />

        {/* CRM IA Routes */}
        <Route path="/crm/config" element={<ConfigPage />} />
        <Route path="/crm/acquisition" element={<AcquisitionPage />} />
        <Route path="/crm/leads" element={<CRMLeadsPage />} />
        <Route path="/crm/campaigns" element={<CampaignsPage />} />

        <Route path="/publications" element={<PublicationsPage />} />
        <Route path="/creation" element={<CreationPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/connect-accounts" element={<ConnectSocialAccounts />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dialog-test" element={<DialogTestPage />} />
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
      <Route path="/checkout-success" element={<CheckoutSuccess />} />
      <Route path="/connecting-account" element={<ConnectingAccountPage />} />
      <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
      
      {/* OAuth Callback Routes */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/oauth/google/callback" element={<OAuthCallback />} />
      <Route path="/oauth/microsoft/callback" element={<OAuthCallback />} />
      
      {/* Redirection pour /calendar vers /app/calendar */}
      <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
