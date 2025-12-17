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
import { Send, MessageCircle, Mail, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SendMessageModalProps {
  open: boolean;
  onClose: () => void;
  lead: any;
  channel: 'whatsapp' | 'email';
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

  // Templates selon le canal
  const templates = mockMessageTemplates[channel];

  // Variables disponibles pour le remplacement
  const variables = {
    nom: lead.name || '',
    entreprise: lead.name || '',
    categorie: lead.category || '',
    ville: lead.location?.split(',')[0] || '',
    telephone: lead.phone || '',
    email: lead.email || '',
    mon_prenom: 'Adja', // Remplacer par le vrai prénom de l'utilisateur connecté
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
  }, [selectedTemplateId, templates, channel]);

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

        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            lead_id: lead.id,
            recipient: lead.email,
            subject: subject,
            message: message,
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
            Message pour <span className="font-semibold">{lead.name}</span>
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
