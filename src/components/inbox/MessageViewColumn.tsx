/**
 * Message View Column (Column 3)
 */

import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Sparkles, Loader2, MoreVertical, Paperclip, Smile, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConversationWithLastMessage } from '@/types/inbox';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { PLATFORM_LABELS } from '@/config/inboxPlatforms';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversation) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversation]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('New message in conversation:', payload);
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    if ((!messageText.trim() && !selectedFile) || !conversation || sending) return;

    try {
      setSending(true);

      let mediaUrl: string | undefined;
      let mediaType: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (uploadedUrl) {
          mediaUrl = uploadedUrl;
          mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
        }
      }

      // Call the send-message edge function to actually send to the recipient
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversation_id: conversation.id,
          text_content: messageText || (selectedFile ? `📎 ${selectedFile.name}` : ''),
          media_url: mediaUrl,
          media_type: mediaType,
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors de l\'envoi');
      }

      setMessageText('');
      setSelectedFile(null);
      await loadMessages();
      onConversationUpdate();

      toast({
        title: 'Message envoyé',
        description: selectedFile ? 'Votre message avec pièce jointe a été envoyé' : 'Votre message a été envoyé avec succès',
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

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 10 Mo',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: 'Fichier sélectionné',
      description: `${file.name} - Cliquez sur envoyer pour joindre`,
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!conversation) return null;

    try {
      setUploadingFile(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation_id', conversation.id);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-inbox-attachment`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      return result.url;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'uploader le fichier',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
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
    if (!conversation || messages.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucun message dans la conversation',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingAI(true);

      // Get the last 5 messages for context
      const lastMessages = messages.slice(-5);

      // Find the last incoming message
      const lastIncomingMessage = [...messages].reverse().find(
        m => m.direction === 'received' || m.direction === 'incoming' || m.direction === 'inbound'
      );

      if (!lastIncomingMessage) {
        toast({
          title: 'Erreur',
          description: 'Aucun message entrant trouvé',
          variant: 'destructive',
        });
        return;
      }

      // Build conversation context
      const conversationContext = lastMessages.map(msg => ({
        direction: (msg.direction === 'received' || msg.direction === 'incoming' || msg.direction === 'inbound') ? 'incoming' : 'outgoing',
        content: msg.text_content || '',
      }));

      // Call the AI suggestion function
      const { data, error } = await supabase.functions.invoke('generate-reply-suggestion', {
        body: {
          message_content: lastIncomingMessage.text_content || '',
          conversation_context: conversationContext,
          platform: conversation.platform,
        },
      });

      if (error) throw error;

      if (data?.suggestion) {
        setMessageText(data.suggestion);
        toast({
          title: 'Suggestion générée',
          description: 'La suggestion IA a été ajoutée au message',
        });
      }
    } catch (error: any) {
      console.error('Error generating AI suggestion:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de générer une suggestion',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAI(false);
    }
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
                {PLATFORM_LABELS[conversation.platform] || conversation.platform}
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
                  message.direction === 'outgoing' || message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2',
                    message.direction === 'outgoing' || message.direction === 'outbound'
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
                      message.direction === 'outgoing' || message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,video/*,application/pdf,.doc,.docx"
        />

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
            {selectedFile.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <FileIcon className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} Ko</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="h-8 w-8 p-0 hover:bg-gray-200"
            >
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        )}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Écrivez votre message... (Ctrl+Entrée pour envoyer)"
            className="min-h-[80px] pr-40 resize-none"
            disabled={sending || uploadingFile}
          />

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
              <div className="grid grid-cols-8 gap-1 max-w-xs">
                {['😀', '😊', '😂', '🤣', '😍', '🥰', '😎', '🤔', '👍', '👏', '🙏', '💪', '🎉', '❤️', '✨', '🔥', '👋', '🙌', '💯', '✅', '❌', '⚡', '🎯', '📧'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-xs text-gray-500 mt-2 w-full text-center hover:text-gray-700"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Integrated buttons inside textarea */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileSelect}
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
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
              disabled={(!messageText.trim() && !selectedFile) || sending || uploadingFile}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
              title="Envoyer (Ctrl+Entrée)"
            >
              {sending || uploadingFile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {uploadingFile ? 'Upload en cours...' : 'Appuyez sur Ctrl+Entrée pour envoyer'}
        </p>
      </div>
    </div>
  );
}
