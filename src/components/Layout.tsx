import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserMenu from './UserMenu';
import { AppSidebarV2 } from './AppSidebarV2';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout commun avec sidebar permanente
 * Utilisé par toutes les pages de l'application
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Hook notifications pour surveiller les quotas
  useNotifications();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Déterminer le titre de la page basée sur l'URL
  const pageTitle = useMemo(() => {
    const path = location.pathname;

    if (path === '/app/dashboard') return 'Dashboard';
    if (path === '/app/calendar' || path.includes('/marketing/publications/calendar')) return 'Calendrier';
    if (path === '/app/analytics' || path.includes('/reporting/analytics')) return 'Analytics';
    if (path === '/app/inbox' || path === '/app/messages' || path.includes('/marketing/inbox')) return 'Messages';
    if (path === '/app/connections' || path.includes('/marketing/comptes-sociaux')) return 'Comptes Sociaux';
    if (path === '/app/teams') return 'Équipes';
    if (path === '/app/archives' || path.includes('/marketing/archives')) return 'Archives';
    if (path === '/app/competitors' || path.includes('/reporting/concurrence')) return 'Concurrents';
    if (path === '/app/settings') return 'Paramètres';
    if (path === '/app/settings/accounts') return 'Comptes Sociaux';
    if (path === '/app/leads' || path.includes('/crm/leads')) return 'CRM - Leads';
    if (path === '/app/admin') return 'Administration';
    if (path === '/app/publications' || path.includes('/marketing/publications')) return 'Publications';
    if (path === '/app/creation' || path.includes('/marketing/creation')) return 'Studio Création';
    if (path.includes('/crm/config')) return 'CRM - Configuration';
    if (path.includes('/crm/acquisition')) return 'CRM - Acquisition';
    if (path.includes('/crm/campaigns') || path.includes('/marketing/campagnes')) return 'Campagnes';
    if (path.includes('/crm/templates') || path.includes('/marketing/templates')) return 'Templates';
    if (path.includes('/crm/prospects')) return 'CRM - Prospects';
    if (path.includes('/crm/clients')) return 'CRM - Clients';
    if (path.includes('/vente/catalogue')) return 'Vente - Catalogue';
    if (path.includes('/vente/devis')) return 'Vente - Devis';
    if (path.includes('/vente/commandes')) return 'Vente - Commandes';
    if (path.includes('/vente/service-client')) return 'Vente - Service Client';
    
    if (path.includes('/compta/devis')) return 'Compta - Devis';
    if (path.includes('/compta/factures')) return 'Compta - Factures';
    if (path.includes('/compta/contrats')) return 'Compta - Contrats';
    if (path.includes('/compta/paiements')) return 'Compta - Paiements';
    if (path.includes('/marketing/automation')) return 'Marketing - Automation';

    return 'Dashboard';
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden w-full">
      {/* Sidebar V2 - Nouvelle sidebar modulaire */}
      <div className={cn(
        "hidden md:block flex-shrink-0",
        sidebarCollapsed ? "w-16" : "w-72"
      )}>
        <AppSidebarV2
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                {pageTitle}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
