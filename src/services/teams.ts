/**
 * Service for managing teams and team routing
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Team,
  TeamWithStats,
  TeamMember,
  TeamMemberWithDetails,
  ConversationTeam,
  CreateTeamPayload,
  UpdateTeamPayload,
  InviteTeamMemberPayload,
  AssignTeamToConversationPayload,
} from '@/types/teams';

// =====================================================
// TEAMS
// =====================================================

export async function getTeams(userId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTeamsWithStats(userId: string): Promise<TeamWithStats[]> {
  const { data, error } = await supabase
    .from('teams_with_stats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTeam(
  userId: string,
  payload: CreateTeamPayload
): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      user_id: userId,
      name: payload.name,
      description: payload.description,
      color: payload.color,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeam(
  teamId: string,
  payload: UpdateTeamPayload
): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .update(payload)
    .eq('id', teamId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) throw error;
}

// =====================================================
// TEAM MEMBERS
// =====================================================

export async function getTeamMembers(teamId: string): Promise<TeamMemberWithDetails[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      profiles:user_id (
        name,
        avatar
      )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Map profiles data to expected format
  return (data || []).map((member: any) => ({
    ...member,
    full_name: member.profiles?.name || null,
    avatar_url: member.profiles?.avatar || null,
  }));
}

export async function inviteTeamMember(
  payload: InviteTeamMemberPayload,
  invitedBy: string
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: payload.team_id,
      email: payload.email,
      role: payload.role || 'member',
      invited_by: invitedBy,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeTeamMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

export async function updateTeamMemberRole(
  memberId: string,
  role: 'admin' | 'member'
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acceptTeamInvitation(memberId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .update({
      user_id: userId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', memberId);

  if (error) throw error;
}

// =====================================================
// CONVERSATION TEAMS (routing)
// =====================================================

export async function getConversationTeams(
  conversationId: string
): Promise<ConversationTeam[]> {
  const { data, error } = await supabase
    .from('conversation_teams')
    .select('*')
    .eq('conversation_id', conversationId);

  if (error) throw error;
  return data || [];
}

export async function assignTeamToConversation(
  payload: AssignTeamToConversationPayload,
  assignedBy?: string
): Promise<ConversationTeam> {
  const { data, error } = await supabase
    .from('conversation_teams')
    .upsert({
      conversation_id: payload.conversation_id,
      team_id: payload.team_id,
      auto_assigned: payload.auto_assigned || false,
      assigned_by: assignedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeTeamFromConversation(
  conversationId: string,
  teamId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversation_teams')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('team_id', teamId);

  if (error) throw error;
}

// =====================================================
// AI ROUTING
// =====================================================

export async function requestAIRouting(conversationId: string, messageId: string): Promise<void> {
  try {
    const response = await supabase.functions.invoke('analyze-message-routing', {
      body: {
        conversation_id: conversationId,
        message_id: messageId,
      },
    });

    if (response.error) {
      console.error('AI routing error:', response.error);
      throw response.error;
    }

    console.log('AI routing result:', response.data);
  } catch (error) {
    console.error('Failed to request AI routing:', error);
    // Don't throw - we don't want to block message sync if AI routing fails
  }
}

// =====================================================
// STATS
// =====================================================

export async function getTeamConversations(
  teamId: string
): Promise<{ conversation_id: string }[]> {
  const { data, error } = await supabase
    .from('conversation_teams')
    .select('conversation_id')
    .eq('team_id', teamId);

  if (error) throw error;
  return data || [];
}
