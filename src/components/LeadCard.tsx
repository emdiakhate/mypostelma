import { MapPin, Phone, Mail, Globe, Eye, MessageSquare, Instagram, Facebook, Linkedin, Twitter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Lead } from '@/types/leads';

interface LeadCardProps {
  lead: Lead;
  selected?: boolean;
  onSelect?: (id: string) => void;
  viewLead?: (lead: Lead) => void;
  sendMessage?: (lead: Lead) => void;
  markAsContacted?: (lead: Lead) => void;
}

export default function LeadCard({ lead, selected, onSelect, viewLead, sendMessage, markAsContacted }: LeadCardProps) {
  const statusConfig = {
    new: { label: 'Nouveau', className: 'bg-blue-100 text-blue-800' },
    contacted: { label: 'Contacté', className: 'bg-yellow-100 text-yellow-800' },
    interested: { label: 'Intéressé', className: 'bg-green-100 text-green-800' },
    client: { label: 'Client', className: 'bg-purple-100 text-purple-800' },
    not_interested: { label: 'Pas intéressé', className: 'bg-gray-100 text-gray-800' }
  };

  const config = statusConfig[lead.status];

  const viewLeadHandler = (lead: Lead) => {
    viewLead?.(lead);
  };

  const sendMessageHandler = (lead: Lead) => {
    sendMessage?.(lead);
  };

  const markAsContactedHandler = (lead: Lead) => {
    markAsContacted?.(lead);
  };

  return (
    <>
      {/* Version mobile (stack vertical) */}
      <div className="sm:hidden">
        <div className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelect?.(lead.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{lead.name}</h3>
              <div className="flex gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">{lead.category}</Badge>
                <Badge className={config.className + " text-xs"}>{config.label}</Badge>
              </div>
            </div>
          </div>

          {/* Contact (stack) */}
          <div className="space-y-1 text-sm">
            {lead.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="truncate hover:underline">{lead.email}</a>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-muted-foreground" />
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:underline">Site web</a>
              </div>
            )}
          </div>

          {/* Réseaux sociaux */}
          {lead.socialMedia && (
            <div className="flex gap-2 mt-2">
              {lead.socialMedia.instagram && (
                <a
                  href={`https://instagram.com/${lead.socialMedia.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                  title={`Instagram: @${lead.socialMedia.instagram}`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <Instagram className="w-3 h-3 text-white" />
                  </div>
                  {lead.metrics?.instagramFollowers && (
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(lead.metrics.instagramFollowers)}
                    </span>
                  )}
                </a>
              )}

              {lead.socialMedia.facebook && (
                <a
                  href={lead.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                  title="Facebook"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <Facebook className="w-3 h-3 text-white" />
                  </div>
                  {lead.metrics?.facebookLikes && (
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(lead.metrics.facebookLikes)}
                    </span>
                  )}
                </a>
              )}

              {lead.socialMedia.linkedin && (
                <a
                  href={lead.socialMedia.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  title="LinkedIn"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center">
                    <Linkedin className="w-3 h-3 text-white" />
                  </div>
                </a>
              )}

              {lead.socialMedia.twitter && (
                <a
                  href={lead.socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  title="Twitter/X"
                >
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                    <Twitter className="w-3 h-3 text-white" />
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-1 mt-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewLeadHandler(lead)}
              title="Voir les détails"
            >
              <Eye className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => sendMessageHandler(lead)}
              title="Envoyer un message"
              disabled={!lead.email}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsContactedHandler(lead)}
              title="Marquer comme contacté"
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Version desktop (déjà implémentée) */}
      <div className="hidden sm:block">
        <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            {/* Checkbox sélection */}
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelect?.(lead.id)}
              className="mt-1"
            />

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                {/* Infos principales */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{lead.name}</h3>
                    <Badge variant="secondary" className="text-xs">{lead.category}</Badge>
                    <Badge className={config.className}>{config.label}</Badge>
                  </div>
                  {/* Adresse */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{lead.address}, {lead.city}</span>
                  </div>
                </div>
              </div>

              {/* Contact + Réseaux sociaux (une seule ligne) */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Téléphone */}
                {lead.phone && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${lead.phone}`} className="hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {lead.email && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="hover:underline truncate max-w-[200px]">
                      {lead.email}
                    </a>
                  </div>
                )}

                {/* Site web */}
                {lead.website && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Site web
                    </a>
                  </div>
                )}

                {/* Séparateur si réseaux sociaux */}
                {lead.socialMedia && (lead.phone || lead.email || lead.website) && (
                  <div className="h-4 w-px bg-border" />
                )}

                {/* Réseaux sociaux (icônes cliquables) */}
                {lead.socialMedia && (
                  <div className="flex items-center gap-2">
                    {lead.socialMedia.instagram && (
                      <a
                        href={`https://instagram.com/${lead.socialMedia.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                        title={`Instagram: @${lead.socialMedia.instagram}`}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                          <Instagram className="w-4 h-4 text-white" />
                        </div>
                        {lead.metrics?.instagramFollowers && (
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(lead.metrics.instagramFollowers)}
                          </span>
                        )}
                      </a>
                    )}

                    {lead.socialMedia.facebook && (
                      <a
                        href={lead.socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                        title="Facebook"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                          <Facebook className="w-4 h-4 text-white" />
                        </div>
                        {lead.metrics?.facebookLikes && (
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(lead.metrics.facebookLikes)}
                          </span>
                        )}
                      </a>
                    )}

                    {lead.socialMedia.linkedin && (
                      <a
                        href={lead.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-70 transition-opacity"
                        title="LinkedIn"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center">
                          <Linkedin className="w-4 h-4 text-white" />
                        </div>
                      </a>
                    )}

                    {lead.socialMedia.twitter && (
                      <a
                        href={lead.socialMedia.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-70 transition-opacity"
                        title="Twitter/X"
                      >
                        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                          <Twitter className="w-4 h-4 text-white" />
                        </div>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => viewLeadHandler(lead)}
                title="Voir les détails"
              >
                <Eye className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => sendMessageHandler(lead)}
                title="Envoyer un message"
                disabled={!lead.email}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => markAsContactedHandler(lead)}
                title="Marquer comme contacté"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper pour formater les nombres
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}