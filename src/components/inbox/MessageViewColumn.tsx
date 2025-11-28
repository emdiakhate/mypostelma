/**
 * Message View Column (Column 3)
 */

import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Sparkles, Loader2, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConversationWithLastMessage } from '@/types/inbox';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  platform_message_id?: string;
  direction: string;
  message_type: string;
  text_content?: string;
  media_url?: string;
  sender_id?: string;
  sender_name?: string;
  sender_username?: string;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

interface MessageViewColumnProps {
  conversation: ConversationWithLastMessage | null;
  onConversationUpdate: () => void;
}

export function MessageViewColumn({
  conversation,
  onConversationUpdate,
}: MessageViewColumnProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (conversation) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!conversation) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark as read
      await supabase
        .from('conversations')
        .update({ status: 'read' })
        .eq('id', conversation.id);

      onConversationUpdate();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !conversation || sending) return;

    try {
      setSending(true);

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction: 'outbound',
        message_type: 'text',
        text_content: messageText,
        sender_id: conversation.user_id,
        is_read: true,
        sent_at: new Date().toISOString(),
      });

      if (error) throw error;

      setMessageText('');
      await loadMessages();
      onConversationUpdate();

      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleVoiceInput = async () => {
    setRecording(true);
    toast({
      title: 'Enregistrement audio',
      description: 'Fonctionnalité bientôt disponible',
    });
    setTimeout(() => setRecording(false), 1000);
  };

  const handleAISuggestion = async () => {
    setGeneratingAI(true);
    toast({
      title: 'Génération IA',
      description: 'Fonctionnalité bientôt disponible',
    });
    setTimeout(() => setGeneratingAI(false), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Aucune conversation sélectionnée</p>
          <p className="text-sm mt-1">Sélectionnez une conversation pour afficher les messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
            {conversation.participant_name?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-gray-900">
              {conversation.participant_name || conversation.participant_username || 'Inconnu'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-xs h-5">
                {conversation.platform}
              </Badge>

              {/* Team tags */}
              {conversation.teams && conversation.teams.length > 0 && (
                <>
                  {conversation.teams.map((team: any, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs h-5"
                      style={{
                        borderColor: team.team_color,
                        backgroundColor: `${team.team_color}15`,
                        color: team.team_color,
                      }}
                    >
                      {team.team_name}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">Aucun message dans cette conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2',
                    message.direction === 'outbound'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {message.text_content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text_content}
                    </p>
                  )}
                  {message.media_url && (
                    <img
                      src={message.media_url}
                      alt="Media"
                      className="mt-2 rounded-lg max-w-full"
                    />
                  )}
                  <p
                    className={cn(
                      'text-xs mt-1',
                      message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                    )}
                  >
                    {formatDistanceToNow(new Date(message.sent_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Écrivez votre message... (Ctrl+Entrée pour envoyer)"
            className="min-h-[80px] pr-40 resize-none"
            disabled={sending}
          />

          {/* Integrated buttons inside textarea */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={sending}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Pièce jointe"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceInput}
              disabled={recording || sending}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Enregistrement vocal"
            >
              <Mic className={cn('w-4 h-4 text-gray-600', recording && 'text-red-500 animate-pulse')} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={sending}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Émojis"
            >
              <Smile className="w-4 h-4 text-gray-600" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAISuggestion}
              disabled={generatingAI || sending}
              className="h-8 w-8 p-0 hover:bg-purple-50"
              title="Suggestion IA"
            >
              <Sparkles className={cn('w-4 h-4 text-purple-600', generatingAI && 'animate-spin')} />
            </Button>

            <Button
              size="sm"
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
              title="Envoyer (Ctrl+Entrée)"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Appuyez sur Ctrl+Entrée pour envoyer
        </p>
      </div>
    </div>
  );
}
