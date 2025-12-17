import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Globe,
  Star,
  Calendar,
  Tag,
  Pencil,
} from 'lucide-react';
import { EnrichedLead, LeadFormData } from '@/types/crm';
import { CommunicationHistory } from './CommunicationHistory';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EditLeadModal from '@/components/crm/EditLeadModal';

interface LeadDetailModalProps {
  open: boolean;
  onClose: () => void;
  lead: EnrichedLead;
  onSendEmail?: () => void;
  onSendWhatsApp?: () => void;
  onUpdate?: (leadId: string, data: Partial<LeadFormData>) => Promise<void>;
}

export function LeadDetailModal({
  open,
  onClose,
  lead,
  onSendEmail,
  onSendWhatsApp,
  onUpdate,
}: LeadDetailModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleUpdate = async (leadId: string, data: Partial<LeadFormData>) => {
    if (onUpdate) {
      await onUpdate(leadId, data);
    }
  };
  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{lead.name}</DialogTitle>
            {onUpdate && (
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
          <DialogDescription>
            Détails complets du lead et historique de communication
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              INFORMATIONS GÉNÉRALES
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Secteur */}
              {lead.sector && (
                <div className="flex items-start gap-2">
                  <Building className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Secteur</p>
                    <Badge
                      style={{
                        backgroundColor: lead.sector.color || '#3B82F6',
                        color: 'white',
                      }}
                      className="mt-1"
                    >
                      {lead.sector.name}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Segment */}
              {lead.segment && (
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Segment</p>
                    <p className="text-sm font-medium">{lead.segment.name}</p>
                  </div>
                </div>
              )}

              {/* Localisation */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Localisation</p>
                  <p className="text-sm font-medium">
                    {lead.city}
                    {lead.address && `, ${lead.address}`}
                  </p>
                </div>
              </div>

              {/* Score */}
              {lead.score && (
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-sm font-medium">{lead.score}/5</p>
                  </div>
                </div>
              )}

              {/* Google Rating */}
              {lead.google_rating && (
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-0.5 text-yellow-400 fill-yellow-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Note Google</p>
                    <p className="text-sm font-medium">
                      {lead.google_rating.toFixed(1)}
                      {lead.google_reviews_count && ` (${lead.google_reviews_count} avis)`}
                    </p>
                  </div>
                </div>
              )}

              {/* Date d'ajout */}
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Ajouté le</p>
                  <p className="text-sm font-medium">
                    {lead.added_at ? format(new Date(lead.added_at), 'dd MMMM yyyy', { locale: fr }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              COORDONNÉES
            </h3>

            <div className="space-y-2">
              {lead.phone && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`tel:${lead.phone}`)}
                  >
                    Appeler
                  </Button>
                </div>
              )}

              {lead.email && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{lead.email}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSendEmail}
                  >
                    Envoyer Email
                  </Button>
                </div>
              )}

              {lead.whatsapp && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{lead.whatsapp}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSendWhatsApp}
                  >
                    Envoyer WhatsApp
                  </Button>
                </div>
              )}

              {lead.website && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[300px]">{lead.website}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(lead.website, '_blank')}
                  >
                    Visiter
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  NOTES
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Communication History */}
          <CommunicationHistory leadId={lead.id} />
        </div>
      </DialogContent>
    </Dialog>

    {/* Edit Modal */}
    <EditLeadModal
      open={showEditModal}
      onClose={() => setShowEditModal(false)}
      lead={lead}
      onSubmit={handleUpdate}
    />
    </>
  );
}
