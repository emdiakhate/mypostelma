/**
 * LayoutV2 - Nouveau Layout avec AppSidebarV2
 *
 * Utilise la nouvelle sidebar modulaire
 * Activé via le feature flag ENABLE_NEW_SIDEBAR
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppSidebarV2 from './AppSidebarV2';
import UserMenu from './UserMenu';

interface LayoutV2Props {
  children: React.ReactNode;
}

/**
 * Layout V2 avec sidebar modulaire
 */
const LayoutV2: React.FC<LayoutV2Props> = ({ children }) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hook notifications pour surveiller les quotas
  useNotifications();

  // Déterminer le titre de la page basé sur l'URL
  const getPageTitle = (): string => {
    const path = location.pathname;

    // Dashboard
    if (path === '/app/dashboard') return 'Dashboard';

    // CRM
    if (path === '/app/crm/prospects') return 'CRM - Prospects';
    if (path === '/app/crm/leads') return 'CRM - Leads';
    if (path.startsWith('/app/crm/leads/')) return 'CRM - Détail Lead';
    if (path === '/app/crm/clients') return 'CRM - Clients';
    if (path === '/app/crm/config') return 'CRM - Configuration';

    // Marketing
    if (path === '/app/marketing/publications') return 'Marketing - Publications';
    if (path.startsWith('/app/marketing/publications/') && !path.includes('calendar'))
      return 'Marketing - Détail Publication';
    if (path === '/app/marketing/publications/calendar') return 'Marketing - Calendrier';
    if (path === '/app/marketing/creation') return 'Marketing - Studio Création';
    if (path === '/app/marketing/archives') return 'Marketing - Archives';
    if (path === '/app/marketing/campagnes') return 'Marketing - Campagnes';
    if (path === '/app/marketing/automation') return 'Marketing - Automation';
    if (path === '/app/marketing/templates') return 'Marketing - Templates';
    if (path === '/app/marketing/comptes-sociaux') return 'Marketing - Comptes Sociaux';
    if (path === '/app/marketing/inbox') return 'Marketing - Messagerie';

    // Vente
    if (path === '/app/vente/catalogue') return 'Vente - Catalogue Produits';
    if (path === '/app/vente/devis') return 'Vente - Devis';
    if (path === '/app/vente/commandes') return 'Vente - Commandes';
    if (path === '/app/vente/service-client') return 'Vente - Service Client';
    

    // Compta
    if (path === '/app/compta/devis') return 'Comptabilité - Devis';
    if (path === '/app/compta/factures') return 'Comptabilité - Factures';
    if (path === '/app/compta/contrats') return 'Comptabilité - Contrats';
    if (path === '/app/compta/paiements') return 'Comptabilité - Paiements';

    // Reporting
    if (path === '/app/reporting/analytics') return 'Reporting - Analytics';
    if (path === '/app/reporting/concurrence') return 'Reporting - Concurrence';
    if (path === '/app/reporting/concurrence/compare') return 'Reporting - Comparaison';
    if (path === '/app/reporting/concurrence/analyse') return 'Reporting - Analyse';

    // Administration
    if (path === '/app/admin/equipes') return 'Administration - Équipes';
    if (path === '/app/admin/parametres') return 'Administration - Paramètres';
    if (path === '/app/admin/systeme') return 'Administration - Système';
    if (path === '/app/admin/acquisition') return 'Administration - Acquisition';

    // Fallback
    return 'Postelma';
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden w-full">
      {/* Sidebar V2 */}
      <div
        className={cn(
          'hidden md:block flex-shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-72'
        )}
      >
        <AppSidebarV2 collapsed={sidebarCollapsed} onToggle={handleToggleCollapse} />
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
                onClick={handleToggleCollapse}
                className="p-2 flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>

              <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                {getPageTitle()}
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
};

export default LayoutV2;
