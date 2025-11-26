/**
 * Types for Teams and Team Routing
 */

export interface Team {
  id: string;
  user_id: string;

  // Team info
  name: string;
  description?: string;
  color: string; // Hex color #FF5733

  // Stats
  member_count: number;
  conversation_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TeamWithStats extends Team {
  active_members: number;
  assigned_conversations: number;
}

export type TeamMemberRole = 'admin' | 'member';
export type TeamMemberStatus = 'pending' | 'accepted' | 'declined';

export interface TeamMember {
  id: string;
  team_id: string;

  // Member info
  user_id?: string; // NULL if not yet accepted
  email: string;
  role: TeamMemberRole;

  // Invitation
  status: TeamMemberStatus;
  invited_by: string;
  invited_at: string;
  accepted_at?: string;

  // Timestamps
  created_at: string;
}

export interface TeamMemberWithDetails extends TeamMember {
  // Joined from profiles table
  full_name?: string;
  avatar_url?: string;
}

export interface ConversationTeam {
  id: string;
  conversation_id: string;
  team_id: string;

  // Routing info
  auto_assigned: boolean;
  confidence_score?: number; // 0.00 to 1.00
  ai_reasoning?: string;

  // Assigned by
  assigned_by?: string;
  assigned_at: string;
}

export interface ConversationTeamWithDetails extends ConversationTeam {
  team_name: string;
  team_color: string;
}

export interface MessageAIAnalysis {
  id: string;
  message_id: string;
  conversation_id: string;

  // AI Analysis
  analyzed_content: string;
  detected_intent?: string;
  detected_language?: string;
  suggested_team_ids?: string[];
  confidence_scores?: Record<string, number>;

  // OpenAI metadata
  model_used?: string;
  tokens_used?: number;
  processing_time_ms?: number;

  // Timestamps
  analyzed_at: string;
}

// Payloads for creating/updating
export interface CreateTeamPayload {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  color?: string;
}

export interface InviteTeamMemberPayload {
  team_id: string;
  email: string;
  role?: TeamMemberRole;
}

export interface AssignTeamToConversationPayload {
  conversation_id: string;
  team_id: string;
  auto_assigned?: boolean;
}

// AI Analysis
export interface AIRoutingRequest {
  message_id: string;
  conversation_id: string;
  message_content: string;
  participant_name?: string;
  teams: Team[]; // Available teams to choose from
}

export interface AIRoutingResponse {
  suggested_team_id: string | null;
  confidence_score: number;
  reasoning: string;
  detected_intent?: string;
  detected_language?: string;
}
