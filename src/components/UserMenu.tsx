/**
 * Menu utilisateur avec bouton de déconnexion
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  User, 
  Settings, 
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Configuration des rôles
const roleConfig = {
  owner: {
    label: 'Propriétaire',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  manager: {
    label: 'Manager',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  creator: {
    label: 'Créateur',
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  viewer: {
    label: 'Observateur',
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

const UserMenu: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/logout');
  };

  const handleProfile = () => {
    // TODO: Naviguer vers la page de profil
    console.log('Profil utilisateur');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  if (!currentUser) {
    return null;
  }

  const userRole = currentUser.role as keyof typeof roleConfig;
  const roleInfo = roleConfig[userRole] || roleConfig.viewer;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-3 px-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <span className="text-sm font-semibold">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>

          {/* Infos utilisateur */}
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium">{currentUser.name}</div>
            {/* Badge du rôle à la place de l'email */}
            <Badge 
              variant="secondary" 
              className={cn("text-xs mt-0.5", roleInfo.className)}
            >
              {roleInfo.label}
            </Badge>
          </div>

          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleProfile}>
          <User className="mr-2 w-4 h-4" />
          Mon profil
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSettings}>
          <Settings className="mr-2 w-4 h-4" />
          Paramètres
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 w-4 h-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;