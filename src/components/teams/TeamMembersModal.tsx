import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Mail, Loader2, Crown, User, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getTeamMembers, inviteTeamMember, removeTeamMember, updateTeamMemberRole, resendTeamInvitation } from '@/services/teams';
import type { Team } from '@/types/teams';
import type { TeamMemberWithDetails } from '@/types/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Props {
  team: Team;
  onClose: () => void;
}

export default function TeamMembersModal({ team, onClose }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMemberWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [team.id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getTeamMembers(team.id);
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setError('Email invalide');
      return;
    }

    try {
      setInviting(true);
      setError(null);

      await inviteTeamMember(
        {
          team_id: team.id,
          email: inviteEmail.trim(),
        },
        user!.id
      );

      toast.success('Invitation envoyée par email !');
      setInviteEmail('');
      await loadMembers();
    } catch (err: any) {
      console.error('Error inviting member:', err);
      const errorMsg = err.message || 'Erreur lors de l\'invitation';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (email: string) => {
    try {
      setResendingEmail(email);
      await resendTeamInvitation(team.id, email);
      toast.success('Invitation renvoyée par email !');
      await loadMembers();
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      toast.error(err.message || 'Erreur lors du renvoi de l\'invitation');
    } finally {
      setResendingEmail(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;

    try {
      setRemovingId(memberId);
      await removeTeamMember(memberId);
      await loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleRole = async (member: TeamMemberWithDetails) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin';

    try {
      await updateTeamMemberRole(member.id, newRole);
      await loadMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erreur lors de la modification');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="text-white p-3 rounded-lg"
                style={{ backgroundColor: team.color }}
              >
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Membres - {team.name}</h2>
                <p className="text-sm text-gray-600">
                  {members.length} membre{members.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invite Form */}
        <div className="p-6 border-b bg-gray-50">
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemple.com"
                disabled={inviting}
              />
            </div>
            <Button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Inviter
                </>
              )}
            </Button>
          </form>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aucun membre. Invitez quelqu'un !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar */}
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name || member.email}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {member.full_name || member.email}
                      </div>
                      {member.full_name && (
                        <div className="text-sm text-gray-600">{member.email}</div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      {member.status === 'pending' && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <Clock className="w-3 h-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                      {member.status === 'accepted' && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                      {member.role === 'admin' && (
                        <Badge className="bg-purple-600">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {member.status === 'pending' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResend(member.email)}
                        disabled={resendingEmail === member.email}
                        className="text-xs"
                      >
                        {resendingEmail === member.email ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Réinviter
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleRole(member)}
                        className="text-xs"
                      >
                        {member.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingId === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <Button onClick={onClose} variant="outline" className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
