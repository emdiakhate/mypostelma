/**
 * Inbox Sidebar - Teams & Filters (Column 1)
 */

import {
  Inbox,
  Mail,
  UserCheck,
  Link2,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Team } from '@/types/teams';
import type { ConnectedAccountWithStats } from '@/types/inbox';
import { PLATFORM_LABELS, PLATFORM_ICON_COMPONENTS } from '@/config/inboxPlatforms';

interface InboxSidebarProps {
  teams: Team[];
  connectedAccounts: ConnectedAccountWithStats[];
  selectedTeam: string | null;
  selectedAccount: string | null;
  selectedFilter: 'all' | 'unread' | 'assigned';
  selectedInbox: string | null;
  onTeamSelect: (teamId: string | null) => void;
  onAccountSelect: (accountId: string | null) => void;
  onFilterSelect: (filter: 'all' | 'unread' | 'assigned') => void;
  onInboxSelect: (inboxId: string | null) => void;
}

export function InboxSidebar({
  teams,
  connectedAccounts,
  selectedTeam,
  selectedAccount,
  selectedFilter,
  selectedInbox,
  onTeamSelect,
  onAccountSelect,
  onFilterSelect,
  onInboxSelect,
}: InboxSidebarProps) {

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

          {/* Connected Accounts Section */}
          {connectedAccounts.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2 flex items-center gap-2">
                <Link2 className="w-3 h-3" />
                Comptes
              </p>
              <div className="space-y-1">
                {connectedAccounts.map((account) => {
                  const IconComponent = PLATFORM_ICON_COMPONENTS[account.platform];
                  return (
                    <button
                      key={account.id}
                      onClick={() => {
                        onAccountSelect(account.id);
                        onTeamSelect(null);
                        onFilterSelect('all');
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        selectedAccount === account.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex-shrink-0">
                        {IconComponent ? <IconComponent className="w-4 h-4" /> : getPlatformIcon(account.platform)}
                      </div>
                      <span className="flex-1 text-left truncate">
                        {PLATFORM_LABELS[account.platform] || account.platform}
                      </span>
                      {account.unread_conversations > 0 && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                          {account.unread_conversations}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                      onAccountSelect(null);
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
        </div>
      </div>
    </div>
  );
}
