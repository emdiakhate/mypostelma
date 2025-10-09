/**
 * Page de gestion d'équipe
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React, { useState, useMemo } from 'react';
import { User, UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { loadUsersFromStorage, saveUsersToStorage, addUser, updateUser, deleteUser } from '@/data/mockUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserCard from '@/components/UserCard';
import UserInviteModal from '@/components/UserInviteModal';
import TeamStats from '@/components/TeamStats';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Crown,
  Shield,
  Pencil,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TeamPage: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all' as string,
    sortBy: 'name' as string
  });

  // Charger les utilisateurs au montage
  React.useEffect(() => {
    const loadUsers = () => {
      const loadedUsers = loadUsersFromStorage();
      setUsers(loadedUsers);
    };
    loadUsers();
  }, []);

  // Filtrer et trier les utilisateurs
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par rôle
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'role':
          return a.role.localeCompare(b.role);
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, filters]);

  // Statistiques
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const suspended = users.filter(u => !u.isActive).length;
    
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      total,
      active,
      suspended,
      roleCounts
    };
  }, [users]);

  const handleInviteUser = async (userData: any) => {
    try {
      const newUser = addUser(userData);
      setUsers(prev => [...prev, newUser]);
      setShowInviteModal(false);
      
      // Toast de confirmation (à implémenter)
      console.log(`✓ Invitation envoyée à ${userData.email}`);
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowInviteModal(true);
  };

  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) return;
    
    try {
      const updatedUser = updateUser(editingUser.id, userData);
      if (updatedUser) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
        setShowInviteModal(false);
        setEditingUser(null);
        
        console.log('✓ Utilisateur modifié avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const success = deleteUser(userId);
        if (success) {
          setUsers(prev => prev.filter(u => u.id !== userId));
          console.log('✓ Utilisateur supprimé avec succès');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const updatedUser = updateUser(userId, { isActive: false });
      if (updatedUser) {
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        console.log('✓ Utilisateur suspendu');
      }
    } catch (error) {
      console.error('Erreur lors de la suspension:', error);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const updatedUser = updateUser(userId, { isActive: true });
      if (updatedUser) {
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        console.log('✓ Utilisateur activé');
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation:', error);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      const updatedUser = updateUser(userId, { 
        role, 
        permissions: require('@/types/user').ROLE_PERMISSIONS[role] 
      });
      if (updatedUser) {
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        console.log('✓ Rôle modifié avec succès');
      }
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return Crown;
      case 'manager': return Shield;
      case 'creator': return Pencil;
      case 'viewer': return Eye;
      default: return Shield;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'creator': return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!hasPermission('canManageUsers')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Accès refusé
          </h3>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour gérer l'équipe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
          <p className="text-gray-600">
            Gérez votre équipe et les permissions d'accès
          </p>
        </div>
        
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Inviter un membre
        </Button>
      </div>

      {/* Statistiques d'équipe */}
      <TeamStats />

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un membre..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="owner">Propriétaire</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="creator">Créateur</SelectItem>
                <SelectItem value="viewer">Observateur</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom A-Z</SelectItem>
                <SelectItem value="date">Date d'ajout</SelectItem>
                <SelectItem value="role">Rôle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filters.search || filters.role !== 'all'
                ? 'Aucun membre trouvé'
                : 'Invitez votre équipe pour collaborer'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.role !== 'all'
                ? 'Aucun membre ne correspond à vos critères de recherche.'
                : 'Commencez par inviter des membres à rejoindre votre équipe.'
              }
            </p>
            {!filters.search && filters.role === 'all' && (
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter le premier membre
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onSuspend={handleSuspendUser}
                onActivate={handleActivateUser}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal d'invitation/modification */}
      <UserInviteModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setEditingUser(null);
        }}
        onSuccess={editingUser ? handleUpdateUser : handleInviteUser}
        isEdit={!!editingUser}
        userToEdit={editingUser}
      />
    </div>
  );
};

export default TeamPage;
