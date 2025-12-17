import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockMessageTemplates, replaceVariables } from '@/data/mockMessageTemplates';
import { toast } from 'sonner';
import { Send, MessageCircle, Mail, Sparkles, Loader2, Paperclip, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SendMessageModalProps {
  open: boolean;
  onClose: () => void;
  lead: any;
  channel: 'whatsapp' | 'email';
}

interface UserTemplate {
  id: string;
  name: string;
  category: string;
  subject?: string;
  content: string;
}

export function SendMessageModal({
  open,
  onClose,
  lead,
  channel
}: SendMessageModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Load user templates
  useEffect(() => {
    loadUserTemplates();
  }, [channel]);

  const loadUserTemplates = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_templates')
        .select('*')
        .eq('channel', channel)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserTemplates(data || []);
    } catch (error) {
      console.error('Error loading user templates:', error);
    }
  };

  // Combine default templates and user templates
  const templates = [
    ...mockMessageTemplates[channel],
    ...userTemplates.map(t => ({
      id: t.id,
      name: `${t.name} (Personnalisé)`,
      category: t.category,
      subject: t.subject,
      content: t.content,
    })),
  ];

  // Variables disponibles pour le remplacement
  const variables = {
    nom: lead?.name || '',
    entreprise: lead?.name || '',
    categorie: lead?.category || '',
    ville: lead?.city || '',
    telephone: lead?.phone || '',
    email: lead?.email || '',
    mon_prenom: 'Adja',
    mon_nom: 'Diakhate',
    mon_entreprise: 'Postelma',
    mon_telephone: '+33 6 12 34 56 78'
  };

  // Charger le template sélectionné
  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        const replacedContent = replaceVariables(template.content, variables);
        setMessage(replacedContent);

        if (channel === 'email' && 'subject' in template) {
          const replacedSubject = replaceVariables(template.subject as string, variables);
          setSubject(replacedSubject);
        }
      }
    }
  }, [selectedTemplateId, templates.length, channel]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      // Limit to 5MB per file
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} dépasse 5MB`);
          return false;
        }
        return true;
      });
      setAttachments([...attachments, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/png;base64, prefix
        const base64Content = base64.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
    });
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Le message ne peut pas être vide');
      return;
    }

    if (channel === 'email' && !subject.trim()) {
      toast.error('Le sujet ne peut pas être vide');
      return;
    }

    setIsSending(true);

    try {
      if (channel === 'whatsapp') {
        // Get phone number - use whatsapp field first, then fallback to phone
        const phoneNumber = (lead.whatsapp || lead.phone || '').replace(/[^0-9+]/g, '');

        if (!phoneNumber) {
          toast.error('Numéro WhatsApp non disponible pour ce lead');
          return;
        }

        const { data, error } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            lead_id: lead.id,
            recipient: phoneNumber,
            message: message,
          },
        });

        if (error) {
          throw error;
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Échec de l\'envoi WhatsApp');
        }

        toast.success('Message WhatsApp envoyé avec succès !');
      } else if (channel === 'email') {
        if (!lead.email) {
          toast.error('Email non disponible pour ce lead');
          return;
        }

        // Convert attachments to base64
        const attachmentsData = await Promise.all(
          attachments.map(async (file) => ({
            filename: file.name,
            content: await convertFileToBase64(file),
          }))
        );

        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            lead_id: lead.id,
            recipient: lead.email,
            subject: subject,
            message: message,
            attachments: attachmentsData.length > 0 ? attachmentsData : undefined,
          },
        });

        if (error) {
          throw error;
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Échec de l\'envoi email');
        }

        toast.success('Email envoyé avec succès !');
      }

      onClose();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channel === 'whatsapp' ? (
              <MessageCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Mail className="w-5 h-5 text-blue-600" />
            )}
            {channel === 'whatsapp' ? 'Envoyer un WhatsApp' : 'Envoyer un Email'}
          </DialogTitle>
          <DialogDescription>
            Message pour <span className="font-semibold">{lead?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection du template */}
          <div>
            <Label>Template (optionnel)</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choisir un template ou écrire un message personnalisé" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({template.category})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sujet (Email uniquement) */}
          {channel === 'email' && (
            <div>
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de l'email"
                className="mt-2"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                channel === 'whatsapp'
                  ? 'Votre message WhatsApp...'
                  : 'Corps de votre email...'
              }
              rows={12}
              className="mt-2 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} caractères
            </p>
          </div>

          {/* Pièces jointes (Email uniquement) */}
          {channel === 'email' && (
            <div>
              <Label htmlFor="attachments">Pièces jointes (optionnel)</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('attachments')?.click()}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Ajouter un fichier
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Max 5MB par fichier
                  </span>
                </div>

                {/* Liste des fichiers attachés */}
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[300px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer via {channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}