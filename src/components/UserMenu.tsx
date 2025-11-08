/**
 * Menu utilisateur avec bouton de déconnexion
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { supabase } from '@/integrations/supabase/client';
import ProfileEditModal from './ProfileEditModal';

// Configuration du rôle manager
const roleConfig = {
  manager: {
    label: 'Manager',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  }
};

const UserMenu: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileName, setProfileName] = useState<string>('');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  // Charger les données du profil
  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('name, avatar')
      .eq('id', currentUser.id)
      .single();

    if (data) {
      setProfileName(data.name);
      setProfileAvatar(data.avatar);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleProfileUpdate = (name: string, avatar: string | null) => {
    setProfileName(name);
    setProfileAvatar(avatar);
  };

  if (!currentUser) {
    return null;
  }

  const roleInfo = roleConfig.manager;
  const displayName = profileName || currentUser.user_metadata?.name || currentUser.email;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-3 px-3">
            {/* Avatar */}
            <Avatar className="w-10 h-10">
              <AvatarImage src={profileAvatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                <span className="text-sm font-semibold">{initials}</span>
              </AvatarFallback>
            </Avatar>

            {/* Infos utilisateur */}
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium">{displayName}</div>
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
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleProfile}>
            <User className="mr-2 w-4 h-4" />
            Modifier mon profil
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

      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentName={profileName}
        currentAvatar={profileAvatar}
        userId={currentUser.id}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

export default UserMenu;