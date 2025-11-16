import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Instagram, Facebook, Linkedin, Globe } from 'lucide-react';
import { TwitterIcon, TikTokIcon } from '@/config/socialIcons';
import type { Competitor } from '@/types/competitor';

interface CompetitorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Competitor>) => Promise<void>;
  competitor?: Competitor | null;
  title?: string;
  description?: string;
}

export function CompetitorFormModal({
  open,
  onOpenChange,
  onSubmit,
  competitor,
  title = "Ajouter un concurrent",
  description = "Renseignez les informations du concurrent à analyser."
}: CompetitorFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    instagram_url: '',
    facebook_url: '',
    linkedin_url: '',
    twitter_url: '',
    tiktok_url: '',
    website_url: '',
  });

  // Initialize form with competitor data if editing
  useEffect(() => {
    if (competitor) {
      setFormData({
        name: competitor.name || '',
        industry: competitor.industry || '',
        description: competitor.description || '',
        instagram_url: competitor.instagram_url || '',
        facebook_url: competitor.facebook_url || '',
        linkedin_url: competitor.linkedin_url || '',
        twitter_url: competitor.twitter_url || '',
        tiktok_url: competitor.tiktok_url || '',
        website_url: competitor.website_url || '',
      });
    } else {
      // Reset form
      setFormData({
        name: '',
        industry: '',
        description: '',
        instagram_url: '',
        facebook_url: '',
        linkedin_url: '',
        twitter_url: '',
        tiktok_url: '',
        website_url: '',
      });
    }
  }, [competitor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: formData.name,
        industry: formData.industry || undefined,
        description: formData.description || undefined,
        instagram_url: formData.instagram_url || undefined,
        facebook_url: formData.facebook_url || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        twitter_url: formData.twitter_url || undefined,
        tiktok_url: formData.tiktok_url || undefined,
        website_url: formData.website_url || undefined,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting competitor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du concurrent *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Nike, Apple..."
                required
              />
            </div>

            <div>
              <Label htmlFor="industry">Secteur d'activité</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Ex: Mode, Tech, Food..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Notes ou description du concurrent..."
                rows={3}
              />
            </div>
          </div>

          {/* Social Media URLs */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Réseaux sociaux et site web</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram_url" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram_url"
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <Label htmlFor="facebook_url" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook_url"
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div>
                <Label htmlFor="twitter_url" className="flex items-center gap-2">
                  <TwitterIcon className="h-4 w-4" />
                  Twitter/X
                </Label>
                <Input
                  id="twitter_url"
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  placeholder="https://x.com/..."
                />
              </div>

              <div>
                <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                  <TikTokIcon className="h-4 w-4" />
                  TikTok
                </Label>
                <Input
                  id="tiktok_url"
                  type="url"
                  value={formData.tiktok_url}
                  onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                  placeholder="https://tiktok.com/@..."
                />
              </div>

              <div>
                <Label htmlFor="website_url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Site web
                </Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : competitor ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
