/**
 * Inbox Page - Unified Inbox with 3 Column Layout
 * Column 1: Teams/Filters (left sidebar)
 * Column 2: Conversations List
 * Column 3: Messages View
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getConversations } from '@/services/inbox';
import { getTeams } from '@/services/teams';
import type { ConversationWithLastMessage } from '@/types/inbox';
import type { Team } from '@/types/teams';
import { InboxSidebar } from '@/components/inbox/InboxSidebar';
import { ConversationListColumn } from '@/components/inbox/ConversationListColumn';
import { MessageViewColumn } from '@/components/inbox/MessageViewColumn';

export default function InboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithLastMessage | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'assigned'>('all');
  const [selectedInbox, setSelectedInbox] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTeams();
      loadConversations();
    }
  }, [user, selectedTeam, selectedFilter, selectedInbox]);

  const loadTeams = async () => {
    if (!user) return;

    try {
      const data = await getTeams(user.id);
      setTeams(data);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const filters: any = {};

      // Filter by status
      if (selectedFilter === 'unread') {
        filters.status = ['unread'];
      } else if (selectedFilter === 'assigned') {
        filters.assigned_to = user.id;
      }

      // Filter by connected account
      if (selectedInbox) {
        filters.connected_account_id = selectedInbox;
      }

      const data = await getConversations(filters);

      // Filter by team if selected (client-side since teams are loaded separately)
      let filteredData = data;
      if (selectedTeam) {
        filteredData = data.filter((conv: any) => {
          if (!conv.teams || conv.teams.length === 0) return false;
          return conv.teams.some((t: any) => t.team_id === selectedTeam);
        });
      }

      setConversations(filteredData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="h-[calc(100vh-73px)] flex bg-gray-50">
      {/* Column 1: Teams & Filters Sidebar */}
      <InboxSidebar
        teams={teams}
        selectedTeam={selectedTeam}
        selectedFilter={selectedFilter}
        selectedInbox={selectedInbox}
        onTeamSelect={setSelectedTeam}
        onFilterSelect={setSelectedFilter}
        onInboxSelect={setSelectedInbox}
      />

      {/* Column 2: Conversations List */}
      <ConversationListColumn
        conversations={conversations}
        selectedConversation={selectedConversation}
        loading={loading}
        selectedFilter={selectedFilter}
        onConversationSelect={setSelectedConversation}
        onFilterSelect={setSelectedFilter}
        onRefresh={loadConversations}
      />

      {/* Column 3: Messages View */}
      <MessageViewColumn
        conversation={selectedConversation}
        onConversationUpdate={loadConversations}
      />
    </div>
  );
}
