/**
 * Inbox Sidebar - Teams & Filters (Column 1)
 */

import { useEffect, useState } from 'react';
import {
  Inbox,
  Mail,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Team } from '@/types/teams';

interface ConnectedAccountSimple {
  id: string;
  platform: string;
  account_name: string | null;
}

interface InboxSidebarProps {
  teams: Team[];
  selectedTeam: string | null;
  selectedFilter: 'all' | 'unread' | 'assigned';
  selectedInbox: string | null;
  onTeamSelect: (teamId: string | null) => void;
  onFilterSelect: (filter: 'all' | 'unread' | 'assigned') => void;
  onInboxSelect: (inboxId: string | null) => void;
}

export function InboxSidebar({
  teams,
  selectedTeam,
  selectedFilter,
  selectedInbox,
  onTeamSelect,
  onFilterSelect,
  onInboxSelect,
}: InboxSidebarProps) {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccountSimple[]>([]);

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('connected_accounts')
        .select('id, platform, account_name')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      setConnectedAccounts(data || []);
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'telegram':
        return <MessageSquare className="w-4 h-4" />;
      case 'gmail':
        return <Mail className="w-4 h-4" />;
      case 'outlook':
        return <Mail className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Inbox className="w-4 h-4" />
          Messages
        </h2>
      </div>

      {/* Filters & Sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* All Conversations */}
          <button
            onClick={() => {
              onFilterSelect('all');
              onTeamSelect(null);
              onInboxSelect(null);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              selectedFilter === 'all' && !selectedTeam && !selectedInbox
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Inbox className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Toutes les conversations</span>
          </button>

          {/* Mentions */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Mentions</span>
          </button>

          {/* Unattended */}
          <button
            onClick={() => {
              onFilterSelect('unread');
              onTeamSelect(null);
              onInboxSelect(null);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              selectedFilter === 'unread' && !selectedTeam && !selectedInbox
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Non traité</span>
          </button>

          {/* Teams Section */}
          {teams.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-900 px-3 py-2">
                Équipes
              </p>
              <div className="space-y-1">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      onTeamSelect(team.id);
                      onFilterSelect('all');
                      onInboxSelect(null);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      selectedTeam === team.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="flex-1 text-left truncate">{team.name}</span>
                    {team.conversation_count > 0 && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        {team.conversation_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inboxes Section */}
          {connectedAccounts.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-900 px-3 py-2">
                Comptes
              </p>
              <div className="space-y-1">
                {connectedAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      onInboxSelect(account.id);
                      onTeamSelect(null);
                      onFilterSelect('all');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      selectedInbox === account.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {getPlatformIcon(account.platform)}
                    <span className="flex-1 text-left truncate">
                      {account.account_name || account.platform}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Labels Section */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-900 px-3 py-2">
              Labels
            </p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                <span className="flex-1 text-left truncate">billing</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="flex-1 text-left truncate">delivery</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
