/**
 * Conversation List Column (Column 2)
 */

import { useState } from 'react';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConversationWithLastMessage } from '@/types/inbox';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConversationListColumnProps {
  conversations: ConversationWithLastMessage[];
  selectedConversation: ConversationWithLastMessage | null;
  loading: boolean;
  searchQuery: string;
  selectedFilter: 'all' | 'unread' | 'assigned';
  onSearchChange: (query: string) => void;
  onConversationSelect: (conversation: ConversationWithLastMessage) => void;
  onFilterSelect: (filter: 'all' | 'unread' | 'assigned') => void;
  onRefresh: () => void;
}

export function ConversationListColumn({
  conversations,
  selectedConversation,
  loading,
  searchQuery,
  selectedFilter,
  onSearchChange,
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

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.participant_name?.toLowerCase().includes(query) ||
      conv.participant_username?.toLowerCase().includes(query) ||
      conv.last_message_text?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => {
              onFilterSelect('assigned');
            }}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
              selectedFilter === 'assigned'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            Mine <span className="ml-1 text-xs">6</span>
          </button>
          <button
            onClick={() => {
              onFilterSelect('unread');
            }}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
              selectedFilter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            Unassigned <span className="ml-1 text-xs">10</span>
          </button>
          <button
            onClick={() => {
              onFilterSelect('all');
            }}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            All <span className="ml-1 text-xs">16</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher dans les conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <p className="text-sm text-center">
              {searchQuery
                ? 'Aucune conversation trouvée'
                : 'Aucune conversation pour le moment'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onConversationSelect(conversation)}
                className={cn(
                  'w-full p-4 hover:bg-gray-50 transition-colors text-left',
                  selectedConversation?.id === conversation.id && 'bg-blue-50 border-l-4 border-blue-500'
                )}
              >
                {/* Header with name and time */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {conversation.participant_name?.[0]?.toUpperCase() || '?'}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {conversation.participant_name || conversation.participant_username || 'Inconnu'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.platform}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {conversation.last_message_at &&
                      formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                  </span>
                </div>

                {/* Last message preview */}
                {conversation.last_message_text && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {conversation.last_message_text}
                  </p>
                )}

                {/* Tags & Status */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Team tags - colored badges like in reference */}
                  {conversation.teams && conversation.teams.length > 0 && (
                    <>
                      {conversation.teams.map((team: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: team.team_color,
                            color: 'white',
                          }}
                        >
                          {team.team_name}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
