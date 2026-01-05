/**
 * Module Administration - Gestion des Équipes
 * Gestion des membres, rôles et permissions
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Settings,
  Trash2,
  Search,
  Crown,
  User,
  Eye,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  avatar?: string;
  joinedAt: Date;
  lastActive?: Date;
}

export default function EquipesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [members] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sophie Martin',
      email: 'sophie.martin@company.com',
      role: 'admin',
      status: 'active',
      joinedAt: new Date(2025, 0, 15),
      lastActive: new Date(2026, 0, 4, 10, 30),
    },
    {
      id: '2',
      name: 'Thomas Dubois',
      email: 'thomas.dubois@company.com',
      role: 'manager',
      status: 'active',
      joinedAt: new Date(2025, 2, 20),
      lastActive: new Date(2026, 0, 4, 9, 15),
    },
    {
      id: '3',
      name: 'Marie Leroy',
      email: 'marie.leroy@company.com',
      role: 'user',
      status: 'active',
      joinedAt: new Date(2025, 4, 10),
      lastActive: new Date(2026, 0, 3, 16, 45),
    },
    {
      id: '4',
      name: 'Lucas Bernard',
      email: 'lucas.bernard@company.com',
      role: 'user',
      status: 'active',
      joinedAt: new Date(2025, 6, 5),
      lastActive: new Date(2026, 0, 4, 8, 20),
    },
    {
      id: '5',
      name: 'Emma Petit',
      email: 'emma.petit@company.com',
      role: 'viewer',
      status: 'invited',
      joinedAt: new Date(2026, 0, 3),
    },
  ]);

  const getRoleBadge = (role: TeamMember['role']) => {
    const configs = {
      admin: { label: 'Admin', color: 'bg-red-600 text-white', icon: Crown },
      manager: { label: 'Manager', color: 'bg-blue-600 text-white', icon: Shield },
      user: { label: 'Utilisateur', color: 'bg-green-600 text-white', icon: User },
      viewer: { label: 'Viewer', color: 'bg-gray-600 text-white', icon: Eye },
    };
    const config = configs[role];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Actif</Badge>;
      case 'invited':
        return <Badge variant="outline">Invité</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendu</Badge>;
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === 'active').length,
    invited: members.filter((m) => m.status === 'invited').length,
    admins: members.filter((m) => m.role === 'admin').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Gestion des Équipes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les membres de votre équipe et leurs permissions
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Inviter un membre
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total membres</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Actifs</span>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Invitations</span>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.invited}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Administrateurs</span>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Membres de l'équipe ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des membres */}
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                    {member.lastActive && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Dernière connexion:{' '}
                        {member.lastActive.toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getRoleBadge(member.role)}
                  {getStatusBadge(member.status)}
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rôles et Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rôles et Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold">Admin</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Accès complet à toutes les fonctionnalités et paramètres
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Manager</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gestion d'équipe, accès aux données et rapports
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Utilisateur</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Utilisation standard des fonctionnalités
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold">Viewer</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lecture seule, aucune modification possible
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
