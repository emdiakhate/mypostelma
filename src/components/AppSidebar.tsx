import React from 'react';
import { 
  Calendar, 
  Edit3, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Megaphone,
  Search,
  Archive,
  Instagram,
  Rss,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  count?: number;
  active?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { id: 'publishing', label: 'Publication', icon: Edit3, active: true },
  { id: 'calendar', label: 'Calendrier', icon: Calendar },
  { id: 'drafts', label: 'Brouillons', icon: FileText, count: 8 },
  { id: 'approval', label: 'En attente d\'approbation', icon: CheckCircle, count: 3 },
  { id: 'rejected', label: 'Rejetés', icon: XCircle, count: 1 },
  { id: 'campaigns', label: 'Campagnes', icon: Megaphone },
  { id: 'content', label: 'Trouver du contenu', icon: Search },
  { id: 'library', label: 'Bibliothèque de ressources', icon: Archive },
  { id: 'notifications', label: 'Notifications Instagram', icon: Instagram },
  { id: 'bio', label: 'SproutLink dans la bio', icon: Rss },
  { id: 'rss', label: 'Publier via RSS', icon: Rss },
  { id: 'failed', label: 'Publications échouées', icon: AlertTriangle, count: 2 },
];

const AppSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-sidebar h-screen flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-semibold text-sm">Postelma</h1>
            <p className="text-sidebar-foreground/70 text-xs">Publication</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 custom-scrollbar overflow-y-auto">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors mb-1",
              item.active 
                ? "bg-sidebar-muted text-sidebar-accent font-medium" 
                : "text-sidebar-foreground hover:bg-sidebar-muted/50 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              <span className="truncate">{item.label}</span>
            </div>
            {item.count && (
              <span className="bg-sidebar-muted text-sidebar-foreground text-xs px-2 py-0.5 rounded-full">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AppSidebar;
