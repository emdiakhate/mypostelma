import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail, MessageCircle, Send, Phone, CheckCircle, Clock } from 'lucide-react';
import type { ConversationWithLastMessage, Platform } from '@/types/inbox';
import { Badge } from '@/components/ui/badge';

interface Props {
  conversations: ConversationWithLastMessage[];
  selectedId?: string;
  onSelect: (conversation: ConversationWithLastMessage) => void;
}

const platformIcons: Record<Platform, React.ReactNode> = {
  gmail: <Mail className="w-4 h-4" />,
  outlook: <Mail className="w-4 h-4" />,
  telegram: <Send className="w-4 h-4" />,
  whatsapp_twilio: <MessageCircle className="w-4 h-4" />,
  instagram: <MessageCircle className="w-4 h-4" />,
  facebook: <MessageCircle className="w-4 h-4" />,
  twitter: <MessageCircle className="w-4 h-4" />,
  linkedin: <MessageCircle className="w-4 h-4" />,
  tiktok: <MessageCircle className="w-4 h-4" />,
};

const platformColors: Record<Platform, string> = {
  gmail: 'bg-red-500',
  outlook: 'bg-blue-500',
  telegram: 'bg-sky-500',
  whatsapp_twilio: 'bg-green-500',
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  twitter: 'bg-black',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-black',
};

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">Aucune conversation</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedId;
        const isUnread = conversation.status === 'unread';

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-purple-50 border-l-4 border-purple-600' : ''
            } ${isUnread ? 'bg-blue-50' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Platform Icon */}
              <div className={`${platformColors[conversation.platform]} text-white p-2 rounded-full flex-shrink-0`}>
                {platformIcons[conversation.platform]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-semibold text-gray-900 truncate">
                    {conversation.participant_name || conversation.participant_username || conversation.participant_id}
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </div>
                </div>

                {/* Username */}
                {conversation.participant_username && (
                  <div className="text-xs text-gray-500 mb-1">@{conversation.participant_username}</div>
                )}

                {/* Last Message */}
                {conversation.last_message_text && (
                  <div className={`text-sm text-gray-600 truncate ${isUnread ? 'font-semibold' : ''}`}>
                    {conversation.last_message_direction === 'outgoing' && (
                      <span className="text-gray-400 mr-1">→</span>
                    )}
                    {conversation.last_message_text}
                  </div>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {isUnread && (
                    <Badge variant="default" className="text-xs bg-blue-500">
                      Non lu
                    </Badge>
                  )}

                  {conversation.status === 'replied' && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Répondu
                    </Badge>
                  )}

                  {conversation.assigned_to && (
                    <Badge variant="outline" className="text-xs">
                      Assigné
                    </Badge>
                  )}

                  {conversation.sentiment === 'negative' && (
                    <Badge variant="destructive" className="text-xs">
                      😞 Négatif
                    </Badge>
                  )}

                  {conversation.sentiment === 'positive' && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                      😊 Positif
                    </Badge>
                  )}

                  {/* Team Tags (AI Routing) */}
                  {conversation.teams && conversation.teams.length > 0 && (
                    <>
                      {conversation.teams.map((team) => (
                        <div
                          key={team.team_id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white font-medium"
                          style={{ backgroundColor: team.team_color }}
                          title={team.auto_assigned ? `Assigné automatiquement par IA (${Math.round((team.confidence_score || 0) * 100)}% de confiance)` : 'Assigné manuellement'}
                        >
                          {team.auto_assigned && '🤖 '}
                          {team.team_name}
                        </div>
                      ))}
                    </>
                  )}

                  {conversation.tags && conversation.tags.length > 0 && (
                    <>
                      {conversation.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {conversation.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{conversation.tags.length - 2}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
