/**
 * AppSidebarV2 - Nouvelle Sidebar Modulaire
 *
 * Structure à 2 niveaux basée sur les 5 modules principaux :
 * - Dashboard
 * - CRM
 * - Marketing
 * - Vente
 * - Compta
 * - Reporting
 * - Administration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  ShoppingCart,
  Calculator,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  UserPlus,
  Target,
  Search,
  Send,
  FileText,
  MessageCircle,
  Link as LinkIcon,
  Calendar,
  Wand2,
  FolderOpen,
  Bot,
  Package,
  ClipboardList,
  Headphones,
  Boxes,
  Receipt,
  FileSpreadsheet,
  FileSignature,
  DollarSign,
  TrendingUp,
  Shield,
  LogOut,
} from 'lucide-react';
import { isFeatureEnabled } from '@/config/featureFlags';

interface AppSidebarV2Props {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
  badge?: string;
  disabled?: boolean;
  adminOnly?: boolean;
}

export const AppSidebarV2: React.FC<AppSidebarV2Props> = ({
  collapsed = false,
  onToggle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isBetaUser, setIsBetaUser] = useState(false);

  // Charger le statut beta_user
  useEffect(() => {
    const loadBetaStatus = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('beta_user')
        .eq('id', user.id)
        .single();

      setIsBetaUser(data?.beta_user || false);
    };

    loadBetaStatus();
  }, [user]);

  // Auto-expand le menu actif
  useEffect(() => {
    const path = location.pathname;
    const expanded: string[] = [];

    if (path.startsWith('/app/crm')) expanded.push('crm');
    if (path.startsWith('/app/marketing')) expanded.push('marketing');
    if (path.startsWith('/app/vente')) expanded.push('vente');
    if (path.startsWith('/app/compta')) expanded.push('compta');
    if (path.startsWith('/app/reporting')) expanded.push('reporting');
    if (path.startsWith('/app/admin')) expanded.push('admin');

    setExpandedMenus(expanded);
  }, [location.pathname]);

  // Définition de la structure de menu
  const menuStructure: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/app/dashboard',
      },
      {
        id: 'crm',
        label: 'CRM',
        icon: Users,
        children: [
          {
            id: 'crm-prospects',
            label: 'Prospects',
            icon: Search,
            path: '/app/crm/prospects',
            disabled: !isFeatureEnabled('ENABLE_NEW_CRM'),
          },
          {
            id: 'crm-leads',
            label: 'Leads',
            icon: UserPlus,
            path: '/app/crm/leads',
          },
          {
            id: 'crm-clients',
            label: 'Clients',
            icon: Users,
            path: '/app/crm/clients',
            disabled: !isFeatureEnabled('ENABLE_NEW_CRM'),
          },
          {
            id: 'crm-config',
            label: 'Configuration',
            icon: Settings,
            path: '/app/crm/config',
          },
        ],
      },
      {
        id: 'marketing',
        label: 'Marketing',
        icon: Megaphone,
        children: [
          {
            id: 'marketing-publications',
            label: 'Publications',
            icon: FileText,
            path: '/app/marketing/publications',
          },
          {
            id: 'marketing-calendar',
            label: 'Calendrier',
            icon: Calendar,
            path: '/app/marketing/publications/calendar',
          },
          {
            id: 'marketing-creation',
            label: 'Studio Création',
            icon: Wand2,
            path: '/app/marketing/creation',
          },
          {
            id: 'marketing-archives',
            label: 'Archives',
            icon: FolderOpen,
            path: '/app/marketing/archives',
          },
          {
            id: 'marketing-campagnes',
            label: 'Campagnes',
            icon: Send,
            path: '/app/marketing/campagnes',
          },
          {
            id: 'marketing-automation',
            label: 'Automation',
            icon: Bot,
            path: '/app/marketing/automation',
            badge: 'Nouveau',
          },
          {
            id: 'marketing-templates',
            label: 'Templates',
            icon: FileText,
            path: '/app/marketing/templates',
          },
          {
            id: 'marketing-comptes',
            label: 'Comptes Sociaux',
            icon: LinkIcon,
            path: '/app/marketing/comptes-sociaux',
          },
          {
            id: 'marketing-inbox',
            label: 'Messagerie',
            icon: MessageCircle,
            path: '/app/marketing/inbox',
          },
        ],
      },
      {
        id: 'vente',
        label: 'Vente',
        icon: ShoppingCart,
        badge: 'Nouveau',
        children: [
          {
            id: 'vente-catalogue',
            label: 'Catalogue Produits',
            icon: Package,
            path: '/app/vente/catalogue',
            disabled: !isFeatureEnabled('ENABLE_VENTE_MODULE'),
          },
          {
            id: 'vente-devis',
            label: 'Devis',
            icon: FileText,
            path: '/app/vente/devis',
            disabled: !isFeatureEnabled('ENABLE_VENTE_MODULE'),
          },
          {
            id: 'vente-commandes',
            label: 'Commandes',
            icon: ClipboardList,
            path: '/app/vente/commandes',
            disabled: !isFeatureEnabled('ENABLE_VENTE_MODULE'),
          },
          {
            id: 'vente-service-client',
            label: 'Service Client',
            icon: Headphones,
            path: '/app/vente/service-client',
            disabled: !isFeatureEnabled('ENABLE_VENTE_MODULE'),
          },
          {
            id: 'vente-stock',
            label: 'Stock',
            icon: Boxes,
            path: '/app/vente/stock',
            disabled: !isFeatureEnabled('ENABLE_VENTE_MODULE'),
          },
        ],
      },
      {
        id: 'compta',
        label: 'Compta',
        icon: Calculator,
        badge: 'Nouveau',
        children: [
          {
            id: 'compta-devis',
            label: 'Devis',
            icon: FileText,
            path: '/app/compta/devis',
            disabled: !isFeatureEnabled('ENABLE_COMPTA_MODULE'),
          },
          {
            id: 'compta-factures',
            label: 'Factures',
            icon: Receipt,
            path: '/app/compta/factures',
            disabled: !isFeatureEnabled('ENABLE_COMPTA_MODULE'),
          },
          {
            id: 'compta-contrats',
            label: 'Contrats',
            icon: FileSignature,
            path: '/app/compta/contrats',
            disabled: !isFeatureEnabled('ENABLE_COMPTA_MODULE'),
          },
          {
            id: 'compta-paiements',
            label: 'Paiements',
            icon: DollarSign,
            path: '/app/compta/paiements',
            disabled: !isFeatureEnabled('ENABLE_COMPTA_MODULE'),
          },
        ],
      },
      {
        id: 'reporting',
        label: 'Reporting',
        icon: BarChart3,
        children: [
          {
            id: 'reporting-analytics',
            label: 'Analytics',
            icon: BarChart3,
            path: '/app/reporting/analytics',
          },
          {
            id: 'reporting-concurrence',
            label: 'Concurrence',
            icon: Target,
            path: '/app/reporting/concurrence',
          },
        ],
      },
      {
        id: 'admin',
        label: 'Administration',
        icon: Shield,
        adminOnly: true,
        children: [
          {
            id: 'admin-equipes',
            label: 'Équipes',
            icon: Users,
            path: '/app/admin/equipes',
          },
          {
            id: 'admin-parametres',
            label: 'Paramètres',
            icon: Settings,
            path: '/app/admin/parametres',
          },
          {
            id: 'admin-systeme',
            label: 'Système',
            icon: Shield,
            path: '/app/admin/systeme',
          },
          {
            id: 'admin-acquisition',
            label: 'Acquisition',
            icon: Search,
            path: '/app/admin/acquisition',
          },
        ],
      },
    ];

    // Filtrer les items admin si beta user
    return items.filter((item) => !item.adminOnly || !isBetaUser);
  }, [isBetaUser]);

  // Vérifier si un path est actif
  const isPathActive = (path?: string): boolean => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // Vérifier si un menu parent est actif
  const isMenuActive = (item: MenuItem): boolean => {
    if (item.path && isPathActive(item.path)) return true;
    if (item.children) {
      return item.children.some((child) => isPathActive(child.path));
    }
    return false;
  };

  // Toggle expanded state
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  // Render menu item
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = isMenuActive(item);
    const isDisabled = item.disabled;

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleMenu(item.id)}
            disabled={isDisabled}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-green-500 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white',
              isDisabled && 'opacity-50 cursor-not-allowed',
              level > 0 && 'ml-4'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
              </>
            )}
          </button>

          {/* Sous-menu */}
          {isExpanded && !collapsed && item.children && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-600 pl-2">
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Item sans enfants
    return (
      <Link
        key={item.id}
        to={item.path || '#'}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
        }}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-green-500 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white',
          isDisabled && 'opacity-50 cursor-not-allowed',
          level > 0 && 'ml-4'
        )}
      >
        <item.icon className={cn('flex-shrink-0', level > 0 ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        {!collapsed && (
          <>
            <span className={cn('flex-1 text-left', level > 0 && 'text-xs')}>
              {item.label}
            </span>
            {item.badge && (
              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        'bg-[#2c3548] text-white transition-all duration-300 flex flex-col h-screen',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          {!collapsed && <span className="text-lg font-semibold">Postelma</span>}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-1">{menuStructure.map((item) => renderMenuItem(item))}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-600 bg-[#2c3548]">
        {/* Logout Button */}
        <Link
          to="/logout"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors mb-2"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Déconnexion</span>}
        </Link>

        {/* Toggle Button */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <Menu className="w-4 h-4" />
            {!collapsed && <span>Masquer</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export default AppSidebarV2;
