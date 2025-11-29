/**
 * Inbox Sidebar - Teams & Filters (Column 1)
 */

import {
  Inbox,
  Mail,
  UserCheck,
  Archive,
  Clock,
  CheckCircle,
  Smile,
  Frown,
  Meh,
  Tag,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Team } from '@/types/teams';

interface InboxSidebarProps {
  teams: Team[];
  selectedTeam: string | null;
  selectedFilter: 'all' | 'unread' | 'assigned';
  onTeamSelect: (teamId: string | null) => void;
  onFilterSelect: (filter: 'all' | 'unread' | 'assigned') => void;
}

export function InboxSidebar({
  teams,
  selectedTeam,
  selectedFilter,
  onTeamSelect,
  onFilterSelect,
}: InboxSidebarProps) {
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
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              selectedFilter === 'all' && !selectedTeam
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Inbox className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">All Conversations</span>
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
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              selectedFilter === 'unread' && !selectedTeam
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Unattended</span>
          </button>

          {/* Teams Section */}
          {teams.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-900 px-3 py-2">
                Teams
              </p>
              <div className="space-y-1">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      onTeamSelect(team.id);
                      onFilterSelect('all');
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
