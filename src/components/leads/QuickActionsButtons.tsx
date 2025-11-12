import { Eye, Phone, Mail, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuickActionsButtonsProps {
  lead: any;
  onViewDetails: () => void;
  onOpenMessageModal: (channel: 'whatsapp' | 'email') => void;
  onMarkAsCompetitor?: () => void;
}

export function QuickActionsButtons({
  lead,
  onViewDetails,
  onOpenMessageModal,
  onMarkAsCompetitor
}: QuickActionsButtonsProps) {
  
  const handleCall = () => {
    if (!lead.phone) {
      toast.error('Aucun numéro de téléphone');
      return;
    }
    window.location.href = `tel:${lead.phone}`;
  };

  const handleWhatsApp = () => {
    if (!lead.phone) {
      toast.error('Aucun numéro de téléphone');
      return;
    }
    onOpenMessageModal('whatsapp');
  };

  const handleEmail = () => {
    if (!lead.email) {
      toast.error('Aucune adresse email');
      return;
    }
    onOpenMessageModal('email');
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onViewDetails}
        title="Voir les détails"
      >
        <Eye className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCall}
        title="Appeler"
      >
        <Phone className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleWhatsApp}
        title="Envoyer un WhatsApp"
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleEmail}
        title="Envoyer un email"
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Mail className="w-4 h-4" />
      </Button>

      {onMarkAsCompetitor && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkAsCompetitor}
          title="Marquer comme concurrent"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          <Users className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
