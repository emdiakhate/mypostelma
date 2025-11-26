import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Send,
  Loader2,
  Mail,
  MessageCircle,
  Send as SendIcon,
  Phone,
  Image as ImageIcon,
  Video,
  File,
  CheckCircle,
  Clock,
  Archive,
  Tag,
  User,
  Mic,
  Sparkles,
} from 'lucide-react';
import type { ConversationWithLastMessage, Message, Platform } from '@/types/inbox';
import { getMessages, sendMessage, markConversationAsRead } from '@/services/inbox';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Props {
  conversation: ConversationWithLastMessage;
  onUpdate?: () => void;
}

const platformIcons: Record<Platform, React.ReactNode> = {
  gmail: <Mail className="w-5 h-5" />,
  outlook: <Mail className="w-5 h-5" />,
  telegram: <SendIcon className="w-5 h-5" />,
  whatsapp_twilio: <MessageCircle className="w-5 h-5" />,
  instagram: <MessageCircle className="w-5 h-5" />,
  facebook: <MessageCircle className="w-5 h-5" />,
  twitter: <MessageCircle className="w-5 h-5" />,
  linkedin: <MessageCircle className="w-5 h-5" />,
  tiktok: <MessageCircle className="w-5 h-5" />,
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

const platformNames: Record<Platform, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  telegram: 'Telegram',
  whatsapp_twilio: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
};

export function ConversationView({ conversation, onUpdate }: Props) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessages(conversation.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      if (conversation.status === 'unread') {
        await markConversationAsRead(conversation.id);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!replyText.trim()) return;

    try {
      setSending(true);

      const newMessage = await sendMessage({
        conversation_id: conversation.id,
        text_content: replyText.trim(),
      });

      setMessages([...messages, newMessage]);
      setReplyText('');
      onUpdate?.();

      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès',
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer le message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceMessage = () => {
    // TODO: Implement voice recording
    toast({
      title: 'Fonctionnalité à venir',
      description: 'L\'enregistrement vocal sera bientôt disponible',
    });
  };

  const handleAISuggestion = async () => {
    if (messages.length === 0) {
      toast({
        title: 'Aucun message',
        description: 'Attendez de recevoir un message pour obtenir une suggestion',
        variant: 'destructive',
      });
      return;
    }

    // Get the last incoming message
    const lastIncomingMessage = [...messages].reverse().find((m) => m.direction === 'incoming');

    if (!lastIncomingMessage) {
      toast({
        title: 'Aucun message entrant',
        description: 'Attendez de recevoir un message pour obtenir une suggestion',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGeneratingSuggestion(true);

      // Call Edge Function to generate AI suggestion
      const { data, error } = await supabase.functions.invoke('generate-reply-suggestion', {
        body: {
          message_content: lastIncomingMessage.text_content,
          conversation_context: messages.slice(-5).map((m) => ({
            direction: m.direction,
            content: m.text_content,
          })),
          platform: conversation.platform,
        },
      });

      if (error) throw error;

      setReplyText(data.suggestion);

      toast({
        title: '✨ Suggestion générée',
        description: 'Vous pouvez modifier la réponse avant d\'envoyer',
      });
    } catch (error: any) {
      console.error('Error generating suggestion:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer une suggestion',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${platformColors[conversation.platform]} text-white p-3 rounded-full`}>
            {platformIcons[conversation.platform]}
          </div>
          <div>
            <div className="font-semibold text-lg text-gray-900">
              {conversation.participant_name || conversation.participant_username || conversation.participant_id}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{platformNames[conversation.platform]}</span>
              {conversation.participant_username && (
                <>
                  <span>•</span>
                  <span>@{conversation.participant_username}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.status === 'unread' && (
            <Badge variant="default" className="bg-blue-500">
              Non lu
            </Badge>
          )}
          {conversation.status === 'replied' && (
            <Badge variant="outline">
              <CheckCircle className="w-3 h-3 mr-1" />
              Répondu
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aucun message dans cette conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOutgoing = message.direction === 'outgoing';
              const showAvatar = index === 0 || messages[index - 1].direction !== message.direction;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isOutgoing
                        ? 'bg-purple-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
                        : 'bg-white text-gray-900 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
                    } p-3 shadow-sm`}
                  >
                    {/* Sender Name (for incoming messages) */}
                    {!isOutgoing && showAvatar && message.sender_name && (
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        {message.sender_name}
                      </div>
                    )}

                    {/* Media */}
                    {message.media_url && (
                      <div className="mb-2">
                        {message.message_type === 'image' ? (
                          <img
                            src={message.media_url}
                            alt="Media"
                            className="rounded-lg max-w-full"
                          />
                        ) : message.message_type === 'video' ? (
                          <video
                            src={message.media_url}
                            controls
                            className="rounded-lg max-w-full"
                          />
                        ) : (
                          <a
                            href={message.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm underline"
                          >
                            <File className="w-4 h-4" />
                            Télécharger le fichier
                          </a>
                        )}
                      </div>
                    )}

                    {/* Text */}
                    {message.text_content && (
                      <div className="whitespace-pre-wrap break-words">
                        {message.text_content}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div
                      className={`text-xs mt-1 ${
                        isOutgoing ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.sent_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Box */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 items-end">
          {/* AI Suggestion Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAISuggestion}
            disabled={isGeneratingSuggestion || messages.length === 0}
            className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0"
            title="Générer une suggestion de réponse avec l'IA"
          >
            {isGeneratingSuggestion ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>

          {/* Voice Message Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleVoiceMessage}
            disabled={isRecording}
            className="flex-shrink-0"
            title="Enregistrer un message vocal"
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
          </Button>

          {/* Text Input */}
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message... (Ctrl+Entrée pour envoyer)"
            className="flex-1 resize-none"
            rows={3}
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="self-end bg-purple-600 hover:bg-purple-700"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-500">
            Répondre via {platformNames[conversation.platform]}
          </div>
          {isGeneratingSuggestion && (
            <div className="text-xs text-purple-600 animate-pulse">
              ✨ Génération d'une suggestion...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
