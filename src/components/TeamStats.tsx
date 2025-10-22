/**
 * Composant pour les statistiques d'équipe
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import React, { useMemo } from 'react';
import { loadUsersFromStorage } from '@/data/mockUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Crown, 
  Shield, 
  Pencil, 
  Eye,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TeamStats: React.FC = () => {
  const users = loadUsersFromStorage();

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const suspended = total - active;
    
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Dernier membre ajouté
    const lastAdded = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      total,
      active,
      suspended,
      roleCounts,
      lastAdded
    };
  }, [users]);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'owner':
        return { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'manager':
        return { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'creator':
        return { icon: Pencil, color: 'text-green-600', bg: 'bg-green-100' };
      case 'viewer':
        return { icon: Eye, color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { icon: Users, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  if (users.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Statistiques d'équipe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métriques principales */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Actifs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            <div className="text-sm text-gray-600">Suspendus</div>
          </div>
        </div>

        {/* Répartition par rôle */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Répartition par rôle</h4>
          <div className="space-y-2">
            {Object.entries(stats.roleCounts).map(([role, count]) => {
              const roleConfig = getRoleConfig(role);
              const Icon = roleConfig.icon;
              const percentage = Math.round((count / stats.total) * 100);
              
              return (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", roleConfig.bg)}>
                      <Icon className={cn("w-3 h-3", roleConfig.color)} />
                    </div>
                    <span className="text-sm font-medium capitalize">
                      {role === 'owner' ? 'Propriétaire' : 
                       role === 'manager' ? 'Manager' :
                       role === 'creator' ? 'Créateur' : 'Observateur'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn("h-2 rounded-full", roleConfig.bg)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dernier membre ajouté */}
        {stats.lastAdded && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dernier membre ajouté</p>
                <p className="font-medium text-gray-900">{stats.lastAdded.name}</p>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getRoleConfig(stats.lastAdded.role).bg)}
              >
                {stats.lastAdded.role === 'owner' ? 'Propriétaire' : 
                 stats.lastAdded.role === 'manager' ? 'Manager' :
                 stats.lastAdded.role === 'creator' ? 'Créateur' : 'Observateur'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamStats;
