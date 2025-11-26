import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader2, UserPlus, Trash2, Crown, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getTeamsWithStats, deleteTeam } from '@/services/teams';
import type { TeamWithStats } from '@/types/teams';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateTeamModal from '@/components/teams/CreateTeamModal';
import EditTeamModal from '@/components/teams/EditTeamModal';
import TeamMembersModal from '@/components/teams/TeamMembersModal';

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithStats | null>(null);
  const [managingTeam, setManagingTeam] = useState<TeamWithStats | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await getTeamsWithStats(user!.id);
      setTeams(data);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) return;

    try {
      setDeletingTeam(teamId);
      await deleteTeam(teamId);
      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingTeam(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Équipes</h1>
          <p className="text-gray-600">
            Créez des équipes pour organiser automatiquement vos messages avec l'IA
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une équipe
        </Button>
      </div>

      {/* Stats */}
      {teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Équipes totales</div>
            <div className="text-3xl font-bold text-gray-900">{teams.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Membres totaux</div>
            <div className="text-3xl font-bold text-gray-900">
              {teams.reduce((sum, t) => sum + t.active_members, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Conversations routées</div>
            <div className="text-3xl font-bold text-gray-900">
              {teams.reduce((sum, t) => sum + t.assigned_conversations, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Équipes actives</div>
            <div className="text-3xl font-bold text-gray-900">
              {teams.filter((t) => t.active_members > 0).length}
            </div>
          </div>
        </div>
      )}

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune équipe</h3>
          <p className="text-gray-600 mb-6">
            Créez votre première équipe pour commencer à organiser vos messages automatiquement
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une équipe
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-gray-300 transition-all overflow-hidden"
            >
              {/* Color bar */}
              <div className="h-2" style={{ backgroundColor: team.color }} />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{team.name}</h3>
                      {team.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">{team.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Membres</div>
                    <div className="text-xl font-bold text-gray-900">{team.active_members}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Conversations</div>
                    <div className="text-xl font-bold text-gray-900">
                      {team.assigned_conversations}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManagingTeam(team)}
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Membres
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTeam(team)}
                    className="flex-1"
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(team.id)}
                    disabled={deletingTeam === team.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingTeam === team.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* IA Routing Info */}
      <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-purple-600 text-white p-3 rounded-lg">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              🤖 Routing automatique par IA
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              L'IA analyse automatiquement chaque message entrant et l'assigne à l'équipe la plus
              pertinente en fonction du contenu. Les équipes ne voient que les messages qui les
              concernent.
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                ✓ <strong>Exemple RH</strong> : "Je souhaite postuler pour le poste de
                commercial" → Équipe RH
              </div>
              <div>
                ✓ <strong>Exemple Support</strong> : "J'ai un problème avec ma commande" → Équipe
                Support
              </div>
              <div>
                ✓ <strong>Tag automatique</strong> : Chaque message routé affiche un tag coloré
                avec le nom de l'équipe
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTeams();
          }}
        />
      )}

      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSuccess={() => {
            setEditingTeam(null);
            loadTeams();
          }}
        />
      )}

      {managingTeam && (
        <TeamMembersModal
          team={managingTeam}
          onClose={() => setManagingTeam(null)}
        />
      )}
    </div>
  );
}
