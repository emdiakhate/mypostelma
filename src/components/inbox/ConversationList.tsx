import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Mail,
  MessageCircle,
  Send,
  Phone,
  CheckCircle,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Music2
} from 'lucide-react';
import type { ConversationWithLastMessage, Platform } from '@/types/inbox';
import { Badge } from '@/components/ui/badge';

interface Props {
  conversations: ConversationWithLastMessage[];
  selectedId?: string;
  onSelect: (conversation: ConversationWithLastMessage) => void;
}

// Composant icône WhatsApp personnalisé
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const platformIcons: Record<Platform, React.ReactNode> = {
  gmail: <Mail className="w-4 h-4" />,
  outlook: <Mail className="w-4 h-4" />,
  telegram: <Send className="w-4 h-4" />,
  whatsapp_twilio: <WhatsAppIcon />,
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  tiktok: <Music2 className="w-4 h-4" />,
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
