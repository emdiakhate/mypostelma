import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { isFeatureEnabled } from "@/config/featureFlags";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { TestAuthBypass } from "./components/TestAuthBypass";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import DashboardOld from "./pages/Dashboard";
import DashboardNew from "./pages/dashboard/index";
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
import InboxPage from "./pages/InboxPage";
import ConnectedAccountsPage from "./pages/ConnectedAccountsPage";
import TeamsPage from "./pages/TeamsPage";
import ConfigPage from "./pages/crm/ConfigPage";
import AcquisitionPage from "./pages/crm/AcquisitionPage";
import CRMLeadsPage from "./pages/crm/CRMLeadsPage";
import CampaignsPage from "./pages/crm/CampaignsPage";
import TemplatesPage from "./pages/crm/TemplatesPage";
import OAuthCallback from "./pages/OAuthCallback";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";

// Marketing Module Pages
import PublicationsPageNew from "./pages/marketing/publications/index";
import PostDetailPageNew from "./pages/marketing/publications/[id]";
import CalendarPageNew from "./pages/marketing/publications/calendar";
import CreationPageNew from "./pages/marketing/creation";
import ArchivesPageNew from "./pages/marketing/archives";
import CampaignsPageNew from "./pages/marketing/campagnes/index";
import TemplatesPageNew from "./pages/marketing/templates/index";
import ComptesSociauxPageNew from "./pages/marketing/comptes-sociaux";
import InboxPageNew from "./pages/marketing/inbox";
import AutomationPageNew from "./pages/marketing/automation";

// Reporting Module Pages
import AnalyticsPageNew from "./pages/reporting/analytics";
import CompetitorsPageNew from "./pages/reporting/concurrence/competitors";
import ComparePageNew from "./pages/reporting/concurrence/compare";
import AnalysePageNew from "./pages/reporting/concurrence/analyse";

// CRM New Pages
import CRMLeadsPageNew from "./pages/crm/leads/index";
import LeadDetailPageNew from "./pages/crm/leads/[id]";
import ProspectsPageNew from "./pages/crm/prospects/index";
import ClientsPageNew from "./pages/crm/clients/index";
import ConfigPageNew from "./pages/crm/config";

// Vente Module Pages
import CataloguePageNew from "./pages/vente/catalogue";
import DevisPageNew from "./pages/vente/devis/index";
import CommandesPageNew from "./pages/vente/commandes/index";
import ServiceClientPageNew from "./pages/vente/service-client";


// Stock Module Pages
import StockEntrepotsPage from "./pages/stock/entrepots";
import StockMouvementsPage from "./pages/stock/mouvements";
import StockTransfertsPage from "./pages/stock/transferts";
import StockAlertesPage from "./pages/stock/alertes";
import FournisseursPage from "./pages/stock/fournisseurs/index";
import CommandesAchatPage from "./pages/stock/commandes-achat/index";
import InventairePage from "./pages/stock/inventaire/index";

// Compta Module Pages
import ComptaDashboardPage from "./pages/compta/dashboard/index";
import DevisListPage from "./pages/compta/devis/index";
import DevisFormPage from "./pages/compta/devis/form";
import FacturesListPage from "./pages/compta/factures/index";
import FactureFormPage from "./pages/compta/factures/form";
import ScannerPage from "./pages/compta/scanner/index";
import ComptaSettingsPage from "./pages/compta/settings/index";

// Global Dashboard & Reports
import GlobalDashboardPage from "./pages/dashboard-global/index";
import RapportsPage from "./pages/rapports/index";

// Caisse Module Pages
import CaisseDashboardPage from "./pages/caisse/dashboard/index";
import BoutiquesPage from "./pages/caisse/boutiques/index";
import CaisseJournalierePage from "./pages/caisse/journaliere/index";
import NouvelleVentePage from "./pages/caisse/nouvelle-vente/index";

// Admin Module Pages
import EquipesPageNew from "./pages/admin/equipes";
import ParametresPageNew from "./pages/admin/parametres";
import SystemePageNew from "./pages/admin/systeme";

const queryClient = new QueryClient();

// MainLayout contient la sidebar + header + content
function MainLayout() {
  return (
    <Layout>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            isFeatureEnabled('ENABLE_NEW_DASHBOARD') ? <DashboardNew /> : <DashboardOld />
          }
        />

        {/* ================================================================
            DASHBOARD GLOBAL & RAPPORTS
            ================================================================ */}
        <Route path="/dashboard-global" element={<GlobalDashboardPage />} />
        <Route path="/rapports" element={<RapportsPage />} />

        {/* ================================================================
            MODULE MARKETING
            ================================================================ */}
        <Route path="/marketing/publications" element={<PublicationsPageNew />} />
        <Route path="/marketing/publications/:id" element={<PostDetailPageNew />} />
        <Route path="/marketing/publications/calendar" element={<CalendarPageNew />} />
        <Route path="/marketing/creation" element={<CreationPageNew />} />
        <Route path="/marketing/archives" element={<ArchivesPageNew />} />
        <Route path="/marketing/campagnes" element={<CampaignsPageNew />} />
        <Route path="/marketing/templates" element={<TemplatesPageNew />} />
        <Route path="/marketing/comptes-sociaux" element={<ComptesSociauxPageNew />} />
        <Route path="/marketing/inbox" element={<InboxPageNew />} />
        <Route path="/marketing/automation" element={<AutomationPageNew />} />

        {/* ================================================================
            MODULE CRM
            ================================================================ */}
        <Route path="/crm/prospects" element={<ProspectsPageNew />} />
        <Route path="/crm/leads" element={<CRMLeadsPageNew />} />
        <Route path="/crm/leads/:id" element={<LeadDetailPageNew />} />
        <Route path="/crm/clients" element={<ClientsPageNew />} />
        <Route path="/crm/config" element={<ConfigPageNew />} />
        <Route path="/crm/acquisition" element={<AcquisitionPage />} />
        <Route path="/crm/campaigns" element={<CampaignsPage />} />
        <Route path="/crm/templates" element={<TemplatesPage />} />

        {/* ================================================================
            MODULE REPORTING
            ================================================================ */}
        <Route path="/reporting/analytics" element={<AnalyticsPageNew />} />
        <Route path="/reporting/concurrence" element={<CompetitorsPageNew />} />
        <Route path="/reporting/concurrence/competitors" element={<CompetitorsPageNew />} />
        <Route path="/reporting/concurrence/compare" element={<ComparePageNew />} />
        <Route path="/reporting/concurrence/analyse" element={<AnalysePageNew />} />

        {/* ================================================================
            MODULE VENTE
            ================================================================ */}
        <Route path="/vente/catalogue" element={<CataloguePageNew />} />
        <Route path="/vente/devis" element={<DevisPageNew />} />
        <Route path="/vente/commandes" element={<CommandesPageNew />} />
        <Route path="/vente/service-client" element={<ServiceClientPageNew />} />
        

        {/* ================================================================
            MODULE STOCK
            ================================================================ */}
        <Route path="/stock/entrepots" element={<StockEntrepotsPage />} />
        <Route path="/stock/mouvements" element={<StockMouvementsPage />} />
        <Route path="/stock/transferts" element={<StockTransfertsPage />} />
        <Route path="/stock/alertes" element={<StockAlertesPage />} />
        <Route path="/stock/fournisseurs" element={<FournisseursPage />} />
        <Route path="/stock/commandes-achat" element={<CommandesAchatPage />} />
        <Route path="/stock/inventaire" element={<InventairePage />} />

        {/* ================================================================
            MODULE COMPTA (Devis & Factures)
            ================================================================ */}
        <Route path="/compta/dashboard" element={<ComptaDashboardPage />} />
        <Route path="/compta/devis" element={<DevisListPage />} />
        <Route path="/compta/devis/new" element={<DevisFormPage />} />
        <Route path="/compta/devis/:id/edit" element={<DevisFormPage />} />
        <Route path="/compta/factures" element={<FacturesListPage />} />
        <Route path="/compta/factures/new" element={<FactureFormPage />} />
        <Route path="/compta/factures/:id/edit" element={<FactureFormPage />} />
        <Route path="/compta/scanner" element={<ScannerPage />} />
        <Route path="/compta/settings" element={<ComptaSettingsPage />} />

        {/* ================================================================
            MODULE CAISSE
            ================================================================ */}
        <Route path="/caisse/dashboard" element={<CaisseDashboardPage />} />
        <Route path="/caisse/boutiques" element={<BoutiquesPage />} />
        <Route path="/caisse/journaliere" element={<CaisseJournalierePage />} />
        <Route path="/caisse/nouvelle-vente" element={<NouvelleVentePage />} />

        {/* ================================================================
            MODULE ADMINISTRATION
            ================================================================ */}
        <Route path="/admin/equipes" element={<EquipesPageNew />} />
        <Route path="/admin/parametres" element={<ParametresPageNew />} />
        <Route path="/admin/systeme" element={<SystemePageNew />} />

        {/* ================================================================
            ANCIENNES ROUTES (rétrocompatibilité)
            ================================================================ */}
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
        <Route path="/publications" element={<PublicationsPage />} />
        <Route path="/creation" element={<CreationPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/connect-accounts" element={<ConnectSocialAccounts />} />
        <Route path="/admin" element={<AdminPage />} />

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
              <TestAuthBypass>
                <Toaster />
                <Sonner />
                <ProtectedRoutes />
              </TestAuthBypass>
            </BrowserRouter>
          </UserProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
