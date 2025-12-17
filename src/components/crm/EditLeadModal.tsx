/**
 * Modal pour modifier un lead existant
 */

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadFormData, LeadStatus, EnrichedLead } from '@/types/crm';
import { useSectors, useSegments } from '@/hooks/useCRM';
import { toast } from 'sonner';

interface EditLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: EnrichedLead;
  onSubmit: (leadId: string, data: Partial<LeadFormData>) => Promise<void>;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ open, onClose, lead, onSubmit }) => {
  const { sectors } = useSectors();
  const { segments } = useSegments();

  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    sector_id: undefined,
    segment_id: undefined,
    social_media: {
      instagram: '',
      facebook: '',
      linkedin: '',
      twitter: '',
    },
    google_rating: undefined,
    google_reviews_count: undefined,
    google_maps_url: '',
    notes: '',
    tags: [],
    status: 'new',
    score: undefined,
    source: 'manual',
  });

  const [loading, setLoading] = useState(false);

  // Initialiser le formulaire avec les données du lead
  useEffect(() => {
    if (lead) {
      const socialMedia = lead.social_media as { instagram?: string; facebook?: string; linkedin?: string; twitter?: string } || {};
      setFormData({
        name: lead.name || '',
        address: lead.address || '',
        city: lead.city || '',
        postal_code: lead.postal_code || '',
        phone: lead.phone || '',
        whatsapp: lead.whatsapp || '',
        email: lead.email || '',
        website: lead.website || '',
        sector_id: lead.sector_id || undefined,
        segment_id: lead.segment_id || undefined,
        social_media: {
          instagram: socialMedia.instagram || '',
          facebook: socialMedia.facebook || '',
          linkedin: socialMedia.linkedin || '',
          twitter: socialMedia.twitter || '',
        },
        google_rating: lead.google_rating || undefined,
        google_reviews_count: lead.google_reviews_count || undefined,
        google_maps_url: lead.google_maps_url || '',
        notes: lead.notes || '',
        tags: lead.tags || [],
        status: lead.status || 'new',
        score: lead.score || undefined,
        source: lead.source || 'manual',
      });
    }
  }, [lead]);

  const handleChange = (field: keyof LeadFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.city || !formData.address) {
      toast.error('Veuillez remplir les champs obligatoires (Nom, Ville, Adresse)');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(lead.id, formData);
      toast.success('Lead mis à jour avec succès');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour du lead');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les segments selon le secteur sélectionné
  const filteredSegments = formData.sector_id
    ? segments.filter((s) => s.sector_id === formData.sector_id)
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le Lead</DialogTitle>
          <DialogDescription>
            Modifiez les informations du lead. Les champs marqués * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Informations de base</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nom du lead"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sector">Secteur</Label>
                <Select
                  value={formData.sector_id || 'none'}
                  onValueChange={(value) => {
                    handleChange('sector_id', value === 'none' ? undefined : value);
                    handleChange('segment_id', undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun secteur</SelectItem>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="segment">Segment</Label>
                <Select
                  value={formData.segment_id || 'none'}
                  onValueChange={(value) => handleChange('segment_id', value === 'none' ? undefined : value)}
                  disabled={!formData.sector_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun segment</SelectItem>
                    {filteredSegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Localisation</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Rue Example"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Dakar"
                  required
                />
              </div>

              <div>
                <Label htmlFor="postal_code">Code Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code || ''}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="12000"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="google_maps_url">URL Google Maps</Label>
                <Input
                  id="google_maps_url"
                  value={formData.google_maps_url || ''}
                  onChange={(e) => handleChange('google_maps_url', e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Contact</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+221 77 123 45 67"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp || ''}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="+33769683468"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format international requis: +33769683468 (pas 0769...)
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <Label htmlFor="website">Site Web</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Réseaux Sociaux</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.social_media?.instagram || ''}
                  onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                  placeholder="@username"
                />
              </div>

              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.social_media?.facebook || ''}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                  placeholder="facebook.com/page"
                />
              </div>

              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.social_media?.linkedin || ''}
                  onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                  placeholder="linkedin.com/company/..."
                />
              </div>

              <div>
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  value={formData.social_media?.twitter || ''}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  placeholder="@username"
                />
              </div>
            </div>
          </div>

          {/* Google Business */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Google Business</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="google_rating">Note Google</Label>
                <Input
                  id="google_rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.google_rating || ''}
                  onChange={(e) => handleChange('google_rating', parseFloat(e.target.value) || undefined)}
                  placeholder="4.5"
                />
              </div>

              <div>
                <Label htmlFor="google_reviews_count">Nombre d'avis</Label>
                <Input
                  id="google_reviews_count"
                  type="number"
                  min="0"
                  value={formData.google_reviews_count || ''}
                  onChange={(e) => handleChange('google_reviews_count', parseInt(e.target.value) || undefined)}
                  placeholder="123"
                />
              </div>
            </div>
          </div>

          {/* CRM */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">CRM</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status || 'new'}
                  onValueChange={(value) => handleChange('status', value as LeadStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">🆕 Nouveau</SelectItem>
                    <SelectItem value="contacted">📞 Contacté</SelectItem>
                    <SelectItem value="interested">👍 Intéressé</SelectItem>
                    <SelectItem value="qualified">🔥 Qualifié</SelectItem>
                    <SelectItem value="client">✅ Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="score">Score (1-5)</Label>
                <Input
                  id="score"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.score || ''}
                  onChange={(e) => handleChange('score', parseInt(e.target.value) || undefined)}
                  placeholder="3"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Notes internes sur ce lead..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadModal;
