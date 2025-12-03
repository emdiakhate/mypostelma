/**
 * Conversation List Column (Column 2)
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConversationWithLastMessage } from '@/types/inbox';
import { PLATFORM_LABELS } from '@/config/inboxPlatforms';

interface ConversationListColumnProps {
  conversations: ConversationWithLastMessage[];
  selectedConversation: ConversationWithLastMessage | null;
  loading: boolean;
  selectedFilter: 'all' | 'unread' | 'assigned' | 'unassigned';
  onConversationSelect: (conversation: ConversationWithLastMessage) => void;
  onFilterSelect: (filter: 'all' | 'unread' | 'assigned' | 'unassigned') => void;
  onRefresh: () => void;
}

export function ConversationListColumn({
  conversations,
  selectedConversation,
  loading,
  selectedFilter,
  onConversationSelect,
  onFilterSelect,
  onRefresh,
}: ConversationListColumnProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Header with Title and Filters */}
      <div className="border-b border-gray-200">
        <div className="px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center px-4 gap-2 border-b border-gray-100">
          <button
            onClick={() => onFilterSelect('assigned')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2',
              selectedFilter === 'assigned'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 border-transparent'
            )}
          >
            Moi
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {conversations.filter(c => c.assigned_to).length}
            </span>
          </button>
          <button
            onClick={() => onFilterSelect('unassigned')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2',
              selectedFilter === 'unassigned'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 border-transparent'
            )}
          >
            Non assigné
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {conversations.filter(c => !c.assigned_to).length}
            </span>
          </button>
          <button
            onClick={() => onFilterSelect('all')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2',
              selectedFilter === 'all'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 border-transparent'
            )}
          >
            Tous
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <p className="text-sm">Aucune conversation trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
              const conversationTeams = (conversation as any).teams || [];

              return (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                    selectedConversation?.id === conversation.id && 'bg-blue-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {conversation.participant_name?.[0]?.toUpperCase() || 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name and Time */}
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {conversation.participant_name || conversation.participant_username || 'Inconnu'}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {conversation.last_message_at
                            ? new Date(conversation.last_message_at).toLocaleTimeString('fr-FR', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>

                      {/* Username */}
                      {conversation.participant_username && (
                        <p className="text-xs text-gray-500 mb-1">
                          @{conversation.participant_username}
                        </p>
                      )}

                      {/* Last Message Preview */}
                      <p className="text-sm text-gray-600 truncate mb-2">
                        {conversation.last_message_text || 'Pas encore de messages'}
                      </p>

                      {/* Team Tags */}
                      {conversationTeams.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {conversationTeams.map((team: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${team.team_color}20`,
                                color: team.team_color,
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: team.team_color }}
                              />
                              {team.team_name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Platform badge */}
                      <Badge variant="secondary" className="text-xs h-5">
                        {PLATFORM_LABELS[conversation.platform] || conversation.platform}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
