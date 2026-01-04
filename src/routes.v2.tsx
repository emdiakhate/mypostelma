/**
 * Routes V2 - Nouvelle Architecture Modulaire
 *
 * Structure des routes basée sur les 5 modules principaux:
 * - Dashboard
 * - CRM
 * - Marketing
 * - Vente
 * - Compta
 * - Reporting
 * - Administration
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { isFeatureEnabled } from '@/config/featureFlags';

// ============================================================================
// IMPORTS DES PAGES
// ============================================================================

// Pages publiques (inchangées)
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PricingPage from './pages/PricingPage';
import CheckoutSimulation from './pages/CheckoutSimulation';
import CheckoutSuccess from './pages/CheckoutSuccess';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import OAuthCallback from './pages/OAuthCallback';
import ConnectingAccountPage from './pages/ConnectingAccountPage';
import ConnectSocialAccounts from './pages/ConnectSocialAccounts';

// Anciennes pages (à utiliser tant que les nouvelles ne sont pas prêtes)
import DashboardOld from './pages/Dashboard';
import LeadsPageOld from './pages/LeadsPage';
import LeadDetailPageOld from './pages/LeadDetailPage';
import AnalyticsOld from './pages/Analytics';
import PublicationsPageOld from './pages/PublicationsPage';
import PostDetailPageOld from './pages/PostDetailPage';
import CreationPageOld from './pages/CreationPage';
import ArchivesPageOld from './pages/ArchivesPage';
import IndexOld from './pages/Index'; // Calendar
import InboxPageOld from './pages/InboxPage';
import ConnectedAccountsPageOld from './pages/ConnectedAccountsPage';
import SocialAccountsPageOld from './pages/SocialAccountsPage';
import CompetitorsPageOld from './pages/CompetitorsPage';
import CompetitorsComparePageOld from './pages/CompetitorsComparePage';
import ComparativeAnalysisPageOld from './pages/ComparativeAnalysisPage';
import TeamsPageOld from './pages/TeamsPage';
import SettingsPageOld from './pages/SettingsPage';
import AdminPageOld from './pages/AdminPage';

// CRM ancien
import ConfigPageOld from './pages/crm/ConfigPage';
import AcquisitionPageOld from './pages/crm/AcquisitionPage';
import CRMLeadsPageOld from './pages/crm/CRMLeadsPage';
import CampaignsPageOld from './pages/crm/CampaignsPage';
import TemplatesPageOld from './pages/crm/TemplatesPage';

// Nouvelles pages CRM (Phase 2 - Migration CRM)
import CRMLeadsPageNew from './pages/crm/leads/index';
import LeadDetailPageNew from './pages/crm/leads/[id]';
import ProspectsPageNew from './pages/crm/prospects/index';
import ClientsPageNew from './pages/crm/clients/index';
import ConfigPageNew from './pages/crm/config';

// Nouvelles pages Marketing (Phase 3 - Migration Marketing)
import PublicationsPageNew from './pages/marketing/publications/index';
import PostDetailPageNew from './pages/marketing/publications/[id]';
import CalendarPageNew from './pages/marketing/publications/calendar';
import CreationPageNew from './pages/marketing/creation';
import ArchivesPageNew from './pages/marketing/archives';
import CampaignsPageNew from './pages/marketing/campagnes/index';
import TemplatesPageNew from './pages/marketing/templates/index';
import ComptesSociauxPageNew from './pages/marketing/comptes-sociaux';
import InboxPageNew from './pages/marketing/inbox';
import AutomationPageNew from './pages/marketing/automation';

// Nouvelles pages Reporting (Phase 4 - Migration Reporting)
import AnalyticsPageNew from './pages/reporting/analytics';
import CompetitorsPageNew from './pages/reporting/concurrence/competitors';
import ComparePageNew from './pages/reporting/concurrence/compare';
import AnalysePageNew from './pages/reporting/concurrence/analyse';
import RapportsPageNew from './pages/reporting/rapports';
import ExportsPageNew from './pages/reporting/exports';

// Nouvelles pages Vente (Phase 5 - Création Module Vente)
import CataloguePageNew from './pages/vente/catalogue';
import DevisPageNew from './pages/vente/devis/index';
import CommandesPageNew from './pages/vente/commandes/index';
import ServiceClientPageNew from './pages/vente/service-client';
import StockPageNew from './pages/vente/stock';

// Nouvelles pages (à importer au fur et à mesure de leur création)
// import DashboardNew from './pages/dashboard/index';
// etc...

// ============================================================================
// COMPOSANTS DE REDIRECTION CONDITIONNELLE
// ============================================================================

/**
 * Redirige vers la nouvelle route si le feature flag est activé
 */
const ConditionalRedirect = ({
  flag,
  newPath,
  OldComponent,
}: {
  flag: keyof typeof import('@/config/featureFlags').FEATURE_FLAGS;
  newPath: string;
  OldComponent: React.ComponentType;
}) => {
  if (isFeatureEnabled(flag)) {
    return <Navigate to={newPath} replace />;
  }
  return <OldComponent />;
};

// ============================================================================
// ROUTES V2
// ============================================================================

export const RoutesV2 = () => {
  return (
    <Routes>
      {/* ================================================================
          ROUTES PUBLIQUES (inchangées)
          ================================================================ */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/checkout" element={<CheckoutSimulation />} />
      <Route path="/checkout-success" element={<CheckoutSuccess />} />
      <Route path="/connecting-account" element={<ConnectingAccountPage />} />
      <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />

      {/* OAuth Callbacks */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/oauth/google/callback" element={<OAuthCallback />} />
      <Route path="/oauth/microsoft/callback" element={<OAuthCallback />} />

      {/* ================================================================
          MODULE DASHBOARD
          ================================================================ */}
      <Route
        path="/dashboard"
        element={
          isFeatureEnabled('ENABLE_NEW_DASHBOARD') ? (
            // <DashboardNew />
            <div>Nouveau Dashboard - En construction</div>
          ) : (
            <DashboardOld />
          )
        }
      />

      {/* ================================================================
          MODULE CRM
          ================================================================ */}

      {/* Prospects (nouveau) */}
      <Route
        path="/crm/prospects"
        element={
          isFeatureEnabled('ENABLE_NEW_CRM') ? (
            <ProspectsPageNew />
          ) : (
            <Navigate to="/leads" replace />
          )
        }
      />

      {/* Leads */}
      <Route
        path="/crm/leads"
        element={
          isFeatureEnabled('ENABLE_NEW_CRM') ? (
            <CRMLeadsPageNew />
          ) : (
            <CRMLeadsPageOld />
          )
        }
      />

      <Route
        path="/crm/leads/:id"
        element={
          isFeatureEnabled('ENABLE_NEW_CRM') ? (
            <LeadDetailPageNew />
          ) : (
            <LeadDetailPageOld />
          )
        }
      />

      {/* Clients (nouveau) */}
      <Route
        path="/crm/clients"
        element={
          isFeatureEnabled('ENABLE_NEW_CRM') ? (
            <ClientsPageNew />
          ) : (
            <Navigate to="/leads" replace />
          )
        }
      />

      {/* Configuration CRM */}
      <Route
        path="/crm/config"
        element={
          isFeatureEnabled('ENABLE_NEW_CRM') ? (
            <ConfigPageNew />
          ) : (
            <ConfigPageOld />
          )
        }
      />

      {/* Redirections anciennes routes CRM */}
      <Route path="/leads" element={<Navigate to="/crm/leads" replace />} />
      <Route path="/leads/:id" element={<Navigate to="/crm/leads/:id" replace />} />

      {/* ================================================================
          MODULE MARKETING
          ================================================================ */}

      {/* Publications */}
      <Route
        path="/marketing/publications"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <PublicationsPageNew />
          ) : (
            <PublicationsPageOld />
          )
        }
      />

      <Route
        path="/marketing/publications/:id"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <PostDetailPageNew />
          ) : (
            <PostDetailPageOld />
          )
        }
      />

      <Route
        path="/marketing/publications/calendar"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <CalendarPageNew />
          ) : (
            <IndexOld />
          )
        }
      />

      {/* Création */}
      <Route
        path="/marketing/creation"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <CreationPageNew />
          ) : (
            <CreationPageOld />
          )
        }
      />

      {/* Archives */}
      <Route
        path="/marketing/archives"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <ArchivesPageNew />
          ) : (
            <ArchivesPageOld />
          )
        }
      />

      {/* Campagnes */}
      <Route
        path="/marketing/campagnes"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <CampaignsPageNew />
          ) : (
            <CampaignsPageOld />
          )
        }
      />

      {/* Templates */}
      <Route
        path="/marketing/templates"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <TemplatesPageNew />
          ) : (
            <TemplatesPageOld />
          )
        }
      />

      {/* Comptes sociaux */}
      <Route
        path="/marketing/comptes-sociaux"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <ComptesSociauxPageNew />
          ) : (
            <ConnectedAccountsPageOld />
          )
        }
      />

      {/* Inbox */}
      <Route
        path="/marketing/inbox"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <InboxPageNew />
          ) : (
            <InboxPageOld />
          )
        }
      />

      {/* Automation (nouveau) */}
      <Route
        path="/marketing/automation"
        element={
          isFeatureEnabled('ENABLE_NEW_MARKETING') ? (
            <AutomationPageNew />
          ) : (
            <div>Automation Marketing - Activez ENABLE_NEW_MARKETING</div>
          )
        }
      />

      {/* Redirections anciennes routes Marketing */}
      <Route path="/publications" element={<Navigate to="/marketing/publications" replace />} />
      <Route path="/post/:id" element={<Navigate to="/marketing/publications/:id" replace />} />
      <Route path="/calendar" element={<Navigate to="/marketing/publications/calendar" replace />} />
      <Route path="/creation" element={<Navigate to="/marketing/creation" replace />} />
      <Route path="/archives" element={<Navigate to="/marketing/archives" replace />} />
      <Route path="/inbox" element={<Navigate to="/marketing/inbox" replace />} />
      <Route path="/messages" element={<Navigate to="/marketing/inbox" replace />} />
      <Route path="/connections" element={<Navigate to="/marketing/comptes-sociaux" replace />} />
      <Route path="/settings/accounts" element={<Navigate to="/marketing/comptes-sociaux" replace />} />
      <Route path="/crm/campaigns" element={<Navigate to="/marketing/campagnes" replace />} />
      <Route path="/crm/templates" element={<Navigate to="/marketing/templates" replace />} />

      {/* ================================================================
          MODULE VENTE (nouveau)
          ================================================================ */}

      {/* Catalogue */}
      <Route
        path="/vente/catalogue"
        element={
          isFeatureEnabled('ENABLE_VENTE_MODULE') ? (
            <CataloguePageNew />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Devis */}
      <Route
        path="/vente/devis"
        element={
          isFeatureEnabled('ENABLE_VENTE_MODULE') ? (
            <DevisPageNew />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Commandes */}
      <Route
        path="/vente/commandes"
        element={
          isFeatureEnabled('ENABLE_VENTE_MODULE') ? (
            <CommandesPageNew />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Service Client */}
      <Route
        path="/vente/service-client"
        element={
          isFeatureEnabled('ENABLE_VENTE_MODULE') ? (
            <ServiceClientPageNew />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Stock */}
      <Route
        path="/vente/stock"
        element={
          isFeatureEnabled('ENABLE_VENTE_MODULE') ? (
            <StockPageNew />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* ================================================================
          MODULE COMPTA (nouveau)
          ================================================================ */}

      <Route
        path="/compta/devis"
        element={
          isFeatureEnabled('ENABLE_COMPTA_MODULE') ? (
            <div>Devis Compta - En construction</div>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      <Route
        path="/compta/factures"
        element={
          isFeatureEnabled('ENABLE_COMPTA_MODULE') ? (
            <div>Factures - En construction</div>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      <Route
        path="/compta/contrats"
        element={
          isFeatureEnabled('ENABLE_COMPTA_MODULE') ? (
            <div>Contrats - En construction</div>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      <Route
        path="/compta/paiements"
        element={
          isFeatureEnabled('ENABLE_COMPTA_MODULE') ? (
            <div>Paiements - En construction</div>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* ================================================================
          MODULE REPORTING
          ================================================================ */}

      {/* Analytics */}
      <Route
        path="/reporting/analytics"
        element={
          isFeatureEnabled('ENABLE_NEW_REPORTING') ? (
            <AnalyticsPageNew />
          ) : (
            <AnalyticsOld />
          )
        }
      />

      {/* Concurrence */}
      <Route
        path="/reporting/concurrence/competitors"
        element={
          isFeatureEnabled('ENABLE_NEW_REPORTING') ? (
            <CompetitorsPageNew />
          ) : (
            <CompetitorsPageOld />
          )
        }
      />

      <Route
        path="/reporting/concurrence/compare"
        element={
          isFeatureEnabled('ENABLE_NEW_REPORTING') ? (
            <ComparePageNew />
          ) : (
            <CompetitorsComparePageOld />
          )
        }
      />

      <Route
        path="/reporting/concurrence/analyse"
        element={
          isFeatureEnabled('ENABLE_NEW_REPORTING') ? (
            <AnalysePageNew />
          ) : (
            <ComparativeAnalysisPageOld />
          )
        }
      />

      {/* Rapports personnalisés (nouveau) */}
      <Route
        path="/reporting/rapports"
        element={
          isFeatureEnabled('ENABLE_NEW_REPORTING') ? (
            <RapportsPageNew />
          ) : (
            <div>Rapports Personnalisés - Activez ENABLE_NEW_REPORTING</div>
          )
        }
      />

      {/* Exports de données (nouveau) */}
      <Route
        path="/reporting/exports"
        element={
          isFeatureEnabled('ENABLE_NEW_REPORTING') ? (
            <ExportsPageNew />
          ) : (
            <div>Exports de Données - Activez ENABLE_NEW_REPORTING</div>
          )
        }
      />

      {/* Redirections anciennes routes Reporting */}
      <Route path="/analytics" element={<Navigate to="/reporting/analytics" replace />} />
      <Route path="/competitors" element={<Navigate to="/reporting/concurrence/competitors" replace />} />
      <Route path="/app/competitors" element={<Navigate to="/reporting/concurrence/competitors" replace />} />
      <Route path="/competitors/compare" element={<Navigate to="/reporting/concurrence/compare" replace />} />
      <Route path="/app/competitors/compare" element={<Navigate to="/reporting/concurrence/compare" replace />} />
      <Route path="/comparative-analysis" element={<Navigate to="/reporting/concurrence/analyse" replace />} />

      {/* ================================================================
          MODULE ADMINISTRATION
          ================================================================ */}

      {/* Équipes */}
      <Route
        path="/admin/equipes"
        element={
          isFeatureEnabled('ENABLE_NEW_ADMIN') ? (
            <div>Équipes - En construction</div>
          ) : (
            <TeamsPageOld />
          )
        }
      />

      {/* Paramètres */}
      <Route
        path="/admin/parametres"
        element={
          isFeatureEnabled('ENABLE_NEW_ADMIN') ? (
            <div>Paramètres - En construction</div>
          ) : (
            <SettingsPageOld />
          )
        }
      />

      {/* Système */}
      <Route
        path="/admin/systeme"
        element={
          isFeatureEnabled('ENABLE_NEW_ADMIN') ? (
            <div>Administration - En construction</div>
          ) : (
            <AdminPageOld />
          )
        }
      />

      {/* Acquisition */}
      <Route
        path="/admin/acquisition"
        element={
          isFeatureEnabled('ENABLE_NEW_ADMIN') ? (
            <div>Acquisition - En construction</div>
          ) : (
            <AcquisitionPageOld />
          )
        }
      />

      {/* Redirections anciennes routes Admin */}
      <Route path="/teams" element={<Navigate to="/admin/equipes" replace />} />
      <Route path="/settings" element={<Navigate to="/admin/parametres" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/systeme" replace />} />
      <Route path="/crm/acquisition" element={<Navigate to="/admin/acquisition" replace />} />

      {/* ================================================================
          ROUTE PAR DÉFAUT
          ================================================================ */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default RoutesV2;
