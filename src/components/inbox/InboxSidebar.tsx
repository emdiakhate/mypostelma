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
  const filters = [
    { id: 'all', label: 'Toutes les conversations', icon: Inbox, count: null },
    { id: 'unread', label: 'Non lus', icon: Mail, count: null },
    { id: 'assigned', label: 'Assignés à moi', icon: UserCheck, count: null },
  ] as const;

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
        <div className="p-2 space-y-4">
          {/* Inbox Filters Section */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2 flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Filtres
            </p>
            <div className="space-y-1">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const isSelected = selectedFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    onClick={() => {
                      onFilterSelect(filter.id);
                      onTeamSelect(null);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      isSelected
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{filter.label}</span>
                    {filter.count !== null && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        {filter.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Section */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">
              Statut
            </p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-500" />
                <span className="flex-1 text-left truncate">Répondus</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <Clock className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                <span className="flex-1 text-left truncate">En attente</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <Archive className="w-4 h-4 flex-shrink-0 text-gray-500" />
                <span className="flex-1 text-left truncate">Archivés</span>
              </button>
            </div>
          </div>

          {/* Sentiment Section */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">
              Sentiment
            </p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <Smile className="w-4 h-4 flex-shrink-0 text-green-500" />
                <span className="flex-1 text-left truncate">Positif</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <Meh className="w-4 h-4 flex-shrink-0 text-gray-500" />
                <span className="flex-1 text-left truncate">Neutre</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <Frown className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span className="flex-1 text-left truncate">Négatif</span>
              </button>
            </div>
          </div>

          {/* Teams Section */}
          {teams.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2 flex items-center gap-2">
                <Tag className="w-3 h-3" />
                Équipes
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
