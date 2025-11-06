import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, RefreshCw, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  beta_user: boolean;
  ai_image_generation_count: number;
  ai_image_generation_limit: number;
  ai_video_generation_count: number;
  ai_video_generation_limit: number;
  lead_generation_count: number;
  lead_generation_limit: number;
  quota_reset_date: string;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Récupérer tous les utilisateurs
  const { data: users, isLoading } = useQuery<UserProfile[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Mutation pour changer le statut beta
  const toggleBetaMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ beta_user: newStatus })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Statut beta mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  // Mutation pour réinitialiser les quotas
  const resetQuotaMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('reset_user_quotas', {
        p_user_id: userId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Quotas réinitialisés');
    },
    onError: (error) => {
      toast.error('Erreur lors de la réinitialisation: ' + error.message);
    },
  });

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const betaUsersCount = users?.filter(u => u.beta_user).length || 0;
  const totalUsers = users?.length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        </div>
        <p className="text-gray-600">
          Gérer les utilisateurs beta et leurs quotas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Beta Testeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{betaUsersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs Standard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalUsers - betaUsersCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par email ou nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Utilisateurs
          </CardTitle>
          <CardDescription>
            Gérer les statuts beta et réinitialiser les quotas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Statut Beta</TableHead>
                    <TableHead>Quotas</TableHead>
                    <TableHead>Dernière Reset</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.beta_user}
                            onCheckedChange={(checked) => 
                              toggleBetaMutation.mutate({ 
                                userId: user.id, 
                                newStatus: checked 
                              })
                            }
                          />
                          {user.beta_user ? (
                            <Badge variant="default" className="bg-blue-500">Beta</Badge>
                          ) : (
                            <Badge variant="secondary">Standard</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.beta_user ? (
                          <div className="text-xs space-y-1">
                            <div>Images: {user.ai_image_generation_count}/{user.ai_image_generation_limit}</div>
                            <div>Vidéos: {user.ai_video_generation_count}/{user.ai_video_generation_limit}</div>
                            <div>Leads: {user.lead_generation_count}/{user.lead_generation_limit}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Illimité</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.quota_reset_date ? 
                          new Date(user.quota_reset_date).toLocaleDateString('fr-FR') : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {user.beta_user && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetQuotaMutation.mutate(user.id)}
                            disabled={resetQuotaMutation.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Reset
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
