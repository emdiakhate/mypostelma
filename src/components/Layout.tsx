import React, { useState, memo, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Clock, FolderOpen, Target, Hash, LayoutDashboard, Users,
  BarChart3, Menu, UserPlus, Search, TrendingUp, Crown, Shield, Pencil, Eye, FileText, Settings, LogOut, Wand2, MessageCircle, Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UserMenu from './UserMenu';
import { QuotaDisplay } from './QuotaDisplay';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout commun avec sidebar permanente
 * Utilisé par toutes les pages de l'application
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Hooks React Router
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hook notifications pour surveiller les quotas
  useNotifications();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Déterminer la page active basée sur l'URL
  const activePage = useMemo(() => {
    const path = location.pathname;

    if (path === '/app/dashboard') return 'dashboard';
    if (path === '/app/calendar') return 'calendar';
    if (path === '/app/analytics') return 'analytics';
    if (path === '/app/inbox' || path === '/app/messages') return 'inbox';
    if (path === '/app/connections') return 'connections';
    if (path === '/app/teams') return 'teams';
    if (path === '/app/archives') return 'archives';
    if (path === '/app/competitors') return 'competitors';

    if (path === '/app/settings') return 'settings';
    if (path === '/app/settings/accounts') return 'accounts';
    if (path === '/app/leads') return 'leads';
    if (path === '/app/admin') return 'admin';
    if (path === '/app/publications') return 'publications';
    if (path === '/app/creation') return 'creation';

    return 'dashboard'; // Par défaut sur dashboard
  }, [location.pathname]);

  // Callbacks optimisés pour la sidebar
  const handlePageChange = useCallback((page: string) => {
    switch (page) {
      case 'dashboard':
        navigate('/app/dashboard');
        break;
      case 'calendar':
        navigate('/app/calendar');
        break;
      case 'analytics':
        navigate('/app/analytics');
        break;
      case 'inbox':
        navigate('/app/inbox');
        break;
      case 'connections':
        navigate('/app/connections');
        break;
      case 'teams':
        navigate('/app/teams');
        break;
      case 'archives':
        navigate('/app/archives');
        break;
      case 'competitors':
        navigate('/app/competitors');
        break;
      case 'leads':
        navigate('/app/leads');
        break;
      case 'publications':
        navigate('/app/publications');
        break;
      case 'creation':
        navigate('/app/creation');
        break;
      case 'settings':
        navigate('/app/settings');
        break;
      case 'admin':
        navigate('/app/admin');
        break;
      case 'logout':
        navigate('/logout');
        break;
      default:
        navigate('/app/dashboard');
    }
  }, [navigate]);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Composant Sidebar mémorisé
  const Sidebar = memo<{
    sidebarCollapsed: boolean;
    activePage: string;
    onPageChange: (page: string) => void;
    onToggleCollapse: () => void;
  }>(({ sidebarCollapsed, activePage, onPageChange, onToggleCollapse }) => {
    const { user } = useAuth();
    const [isBetaUser, setIsBetaUser] = React.useState(false);

    // Charger le statut beta_user
    React.useEffect(() => {
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

    // Items de sidebar - Administration visible uniquement pour les administrateurs (NON beta users)
    const allSidebarItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: activePage === 'dashboard' },
      { id: 'calendar', label: 'Calendrier', icon: Calendar, active: activePage === 'calendar' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, active: activePage === 'analytics' },
      { id: 'inbox', label: 'Messages', icon: MessageCircle, active: activePage === 'inbox' },
      { id: 'connections', label: 'Connexions', icon: LinkIcon, active: activePage === 'connections' },
      { id: 'teams', label: 'Équipes', icon: Users, active: activePage === 'teams' },
      { id: 'archives', label: 'Archives', icon: FolderOpen, active: activePage === 'archives' },
      { id: 'competitors', label: 'Concurrents', icon: Target, active: activePage === 'competitors' },
      { id: 'accounts', label: 'Comptes Sociaux', icon: Users, active: activePage === 'accounts' },
      { id: 'leads', label: 'Lead Generation', icon: UserPlus, active: activePage === 'leads' },
      { id: 'publications', label: 'Mes Publications', icon: FileText, active: activePage === 'publications' },
      { id: 'creation', label: 'Studio Création', icon: Wand2, active: activePage === 'creation' },
      { id: 'settings', label: 'Paramètres', icon: Settings, active: activePage === 'settings' },
      { id: 'admin', label: 'Administration', icon: Shield, active: activePage === 'admin', adminOnly: true },
      { id: 'logout', label: 'Déconnexion', icon: LogOut, active: false },
    ];

    // Filtrer les items : masquer Administration pour les beta users
    const sidebarItems = allSidebarItems.filter(item => !item.adminOnly || !isBetaUser);


    return (
      <div className={cn(
        "bg-[#2c3548] text-white transition-all duration-300 flex flex-col h-screen",
        sidebarCollapsed ? "w-16" : "w-72"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold">Postelma</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1">
          <div className="p-4">
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                // Déterminer l'URL basée sur l'ID de l'item
                const getItemUrl = (id: string) => {
                  switch (id) {
                    case 'dashboard': return '/app/dashboard';
                    case 'calendar': return '/app/calendar';
                    case 'analytics': return '/app/analytics';
                    case 'publications': return '/app/publications';
                    case 'creation': return '/app/creation';
                    case 'logout': return '/logout';
                    case 'settings': return '/app/settings';
                    case 'archives': return '/app/archives';
                    case 'competitors': return '/app/competitors';
                    case 'users': return '/app/users';
                    case 'team': return '/app/team';
                    case 'accounts': return '/app/settings/accounts';
                    case 'leads': return '/app/leads';
                    case 'leads-analytics': return '/app/leads/analytics';
                    case 'admin': return '/app/admin';
                    case 'leads-search': return '/app/leads/search';
                    default: return '/app/dashboard';
                  }
                };

                return (
                  <Link
                    key={item.id}
                    to={getItemUrl(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      item.active 
                        ? "bg-green-500 text-white" 
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="flex-1 text-left">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>

          </div>
        </div>

        {/* Quotas Beta Testeurs */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-600">
            <QuotaDisplay variant="compact" />
          </div>
        )}

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-600 bg-[#2c3548]">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <Menu className="w-4 h-4" />
            {!sidebarCollapsed && <span>Masquer</span>}
          </button>
        </div>
      </div>
    );
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden w-full">
      {/* Sidebar - Composant mémorisé */}
      <div className={cn(
        "hidden md:block flex-shrink-0",
        sidebarCollapsed ? "w-16" : "w-72"
      )}>
        <Sidebar 
          sidebarCollapsed={sidebarCollapsed}
          activePage={activePage}
          onPageChange={handlePageChange}
          onToggleCollapse={handleToggleCollapse}
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
                {activePage === 'dashboard' && 'Dashboard'}
                {activePage === 'calendar' && 'Calendrier'}
                {activePage === 'analytics' && 'Analytics'}
                {activePage === 'archives' && 'Archives'}
                {activePage === 'competitors' && 'Concurrents'}
                {activePage === 'accounts' && 'Comptes Sociaux'}
                {activePage === 'leads' && 'Lead Generation'}
                {activePage === 'publications' && 'Mes Publications'}
                {activePage === 'creation' && 'Studio Création'}
                {activePage === 'settings' && 'Paramètres'}
                {activePage === 'admin' && 'Administration'}
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
