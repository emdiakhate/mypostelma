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
  // Query teams directly with aggregated stats to avoid view permission issues
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!teams || teams.length === 0) return [];

  // Get stats for each team
  const teamIds = teams.map(t => t.id);
  
  const { data: memberStats } = await supabase
    .from('team_members')
    .select('team_id')
    .in('team_id', teamIds)
    .eq('status', 'accepted');

  const { data: conversationStats } = await supabase
    .from('conversation_teams')
    .select('team_id')
    .in('team_id', teamIds);

  // Count members and conversations per team
  const memberCounts: Record<string, number> = {};
  const conversationCounts: Record<string, number> = {};
  
  (memberStats || []).forEach(m => {
    memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1;
  });
  
  (conversationStats || []).forEach(c => {
    conversationCounts[c.team_id] = (conversationCounts[c.team_id] || 0) + 1;
  });

  return teams.map(team => ({
    ...team,
    active_members: memberCounts[team.id] || 0,
    assigned_conversations: conversationCounts[team.id] || 0,
  }));
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
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return [];
  }

  // Get profile info for members who have user_id
  const userIds = data.filter(m => m.user_id).map(m => m.user_id);

  let profilesMap: Record<string, any> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', userIds);

    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, any>);
    }
  }

  // Map profiles data to expected format
  return data.map((member: any) => ({
    ...member,
    full_name: member.user_id ? profilesMap[member.user_id]?.name || null : null,
    avatar_url: member.user_id ? profilesMap[member.user_id]?.avatar || null : null,
  }));
}

export async function inviteTeamMember(
  payload: InviteTeamMemberPayload,
  invitedBy: string
): Promise<any> {
  // Use edge function to send invitation email
  const { data, error } = await supabase.functions.invoke('send-team-invitation', {
    body: {
      team_id: payload.team_id,
      email: payload.email,
      role: payload.role || 'member',
    },
  });

  if (error) throw error;

  if (!data.success) {
    throw new Error(data.error || 'Failed to send invitation');
  }

  return data;
}

export async function resendTeamInvitation(
  teamId: string,
  email: string
): Promise<any> {
  // Delete existing pending invitation
  await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('email', email)
    .eq('status', 'pending');

  // Send new invitation
  const { data, error } = await supabase.functions.invoke('send-team-invitation', {
    body: {
      team_id: teamId,
      email: email,
    },
  });

  if (error) throw error;

  if (!data.success) {
    throw new Error(data.error || 'Failed to resend invitation');
  }

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
  return {
    ...data,
    role: data.role as 'admin' | 'member',
    status: data.status as 'pending' | 'accepted' | 'declined'
  };
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
