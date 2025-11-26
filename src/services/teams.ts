/**
 * Service for managing teams and team routing
 * TEMPORARILY DISABLED - The teams tables don't exist yet in the database
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
// TEAMS - TEMPORARILY DISABLED
// =====================================================

export async function getTeams(userId: string): Promise<Team[]> {
  console.warn('Teams tables not yet created - returning empty array');
  return [];
}

export async function getTeamsWithStats(userId: string): Promise<TeamWithStats[]> {
  console.warn('Teams tables not yet created - returning empty array');
  return [];
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  console.warn('Teams tables not yet created - returning null');
  return null;
}

export async function createTeam(
  userId: string,
  payload: CreateTeamPayload
): Promise<Team> {
  throw new Error('Teams functionality not yet implemented');
}

export async function updateTeam(
  teamId: string,
  payload: UpdateTeamPayload
): Promise<Team> {
  throw new Error('Teams functionality not yet implemented');
}

export async function deleteTeam(teamId: string): Promise<void> {
  throw new Error('Teams functionality not yet implemented');
}

// =====================================================
// TEAM MEMBERS - TEMPORARILY DISABLED
// =====================================================

export async function getTeamMembers(teamId: string): Promise<TeamMemberWithDetails[]> {
  console.warn('Teams tables not yet created - returning empty array');
  return [];
}

export async function inviteTeamMember(
  payload: InviteTeamMemberPayload,
  invitedBy: string
): Promise<TeamMember> {
  throw new Error('Teams functionality not yet implemented');
}

export async function removeTeamMember(memberId: string): Promise<void> {
  throw new Error('Teams functionality not yet implemented');
}

export async function updateTeamMemberRole(
  memberId: string,
  role: 'admin' | 'member'
): Promise<TeamMember> {
  throw new Error('Teams functionality not yet implemented');
}

export async function acceptTeamInvitation(memberId: string, userId: string): Promise<void> {
  throw new Error('Teams functionality not yet implemented');
}

// =====================================================
// CONVERSATION TEAMS (routing) - TEMPORARILY DISABLED
// =====================================================

export async function getConversationTeams(
  conversationId: string
): Promise<ConversationTeam[]> {
  console.warn('Teams tables not yet created - returning empty array');
  return [];
}

export async function assignTeamToConversation(
  payload: AssignTeamToConversationPayload,
  assignedBy?: string
): Promise<ConversationTeam> {
  throw new Error('Teams functionality not yet implemented');
}

export async function removeTeamFromConversation(
  conversationId: string,
  teamId: string
): Promise<void> {
  throw new Error('Teams functionality not yet implemented');
}

// =====================================================
// AI ROUTING - TEMPORARILY DISABLED
// =====================================================

export async function requestAIRouting(conversationId: string, messageId: string): Promise<void> {
  console.warn('AI routing not yet implemented');
}

// =====================================================
// STATS - TEMPORARILY DISABLED
// =====================================================

export async function getTeamConversations(
  teamId: string
): Promise<{ conversation_id: string }[]> {
  console.warn('Teams tables not yet created - returning empty array');
  return [];
}
