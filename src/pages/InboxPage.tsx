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
import { getConnectedAccountsWithStats } from '@/services/connectedAccounts';
import type { ConversationWithLastMessage, Platform } from '@/types/inbox';
import type { Team } from '@/types/teams';
import type { ConnectedAccountWithStats } from '@/types/inbox';
import { InboxSidebar } from '@/components/inbox/InboxSidebar';
import { ConversationListColumn } from '@/components/inbox/ConversationListColumn';
import { MessageViewColumn } from '@/components/inbox/MessageViewColumn';

export default function InboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithLastMessage | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccountWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'assigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadTeams();
      loadConnectedAccounts();
      loadConversations();
    }
  }, [user, selectedTeam, selectedAccount, selectedFilter]);

  const loadTeams = async () => {
    if (!user) return;

    try {
      const data = await getTeams(user.id);
      setTeams(data);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadConnectedAccounts = async () => {
    if (!user) return;

    try {
      const data = await getConnectedAccountsWithStats(user.id);
      setConnectedAccounts(data);
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const filters: any = {
        search: searchQuery,
      };

      // Filter by status
      if (selectedFilter === 'unread') {
        filters.status = ['unread'];
      } else if (selectedFilter === 'assigned') {
        filters.assigned_to = user.id;
      }

      const data = await getConversations(filters);

      // Filter by team if selected
      let filteredData = data;
      if (selectedTeam) {
        // Filter conversations assigned to the selected team
        // Note: This assumes conversations have a 'teams' field from the view
        filteredData = data.filter((conv: any) => {
          if (!conv.teams || conv.teams.length === 0) return false;
          return conv.teams.some((t: any) => t.team_id === selectedTeam);
        });
      }

      // Filter by connected account if selected
      if (selectedAccount) {
        filteredData = filteredData.filter((conv: any) => {
          return conv.connected_account_id === selectedAccount;
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
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async () => {
          await loadConversations();
          // Refresh selected conversation if it's currently open
          if (selectedConversation) {
            const { data } = await supabase
              .from('conversations_with_details')
              .select('*')
              .eq('id', selectedConversation.id)
              .single();
            if (data) {
              setSelectedConversation(data);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  return (
    <div className="h-[calc(100vh-73px)] flex bg-gray-50">
      {/* Column 1: Teams & Filters Sidebar */}
      <InboxSidebar
        teams={teams}
        connectedAccounts={connectedAccounts}
        selectedTeam={selectedTeam}
        selectedAccount={selectedAccount}
        selectedFilter={selectedFilter}
        onTeamSelect={setSelectedTeam}
        onAccountSelect={setSelectedAccount}
        onFilterSelect={setSelectedFilter}
      />

      {/* Column 2: Conversations List */}
      <ConversationListColumn
        conversations={conversations}
        selectedConversation={selectedConversation}
        loading={loading}
        searchQuery={searchQuery}
        selectedFilter={selectedFilter}
        onSearchChange={setSearchQuery}
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
