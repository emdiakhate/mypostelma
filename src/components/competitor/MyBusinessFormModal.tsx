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
import { Instagram, Facebook, Linkedin, Globe, Youtube } from 'lucide-react';
import { TwitterIcon, TikTokIcon } from '@/config/socialIcons';
import type { MyBusiness } from '@/types/competitor';

interface MyBusinessFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<MyBusiness, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  business?: MyBusiness | null;
}

export function MyBusinessFormModal({
  open,
  onOpenChange,
  onSubmit,
  business,
}: MyBusinessFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    description: '',
    instagram_url: '',
    instagram_followers: '',
    facebook_url: '',
    facebook_likes: '',
    linkedin_url: '',
    linkedin_followers: '',
    twitter_url: '',
    tiktok_url: '',
    youtube_url: '',
    website_url: '',
  });

  // Initialize form with business data if editing
  useEffect(() => {
    if (business) {
      setFormData({
        business_name: business.business_name || '',
        industry: business.industry || '',
        description: business.description || '',
        instagram_url: business.instagram_url || '',
        instagram_followers: business.instagram_followers || '',
        facebook_url: business.facebook_url || '',
        facebook_likes: business.facebook_likes || '',
        linkedin_url: business.linkedin_url || '',
        linkedin_followers: business.linkedin_followers || '',
        twitter_url: business.twitter_url || '',
        tiktok_url: business.tiktok_url || '',
        youtube_url: business.youtube_url || '',
        website_url: business.website_url || '',
      });
    } else {
      // Reset form
      setFormData({
        business_name: '',
        industry: '',
        description: '',
        instagram_url: '',
        instagram_followers: '',
        facebook_url: '',
        facebook_likes: '',
        linkedin_url: '',
        linkedin_followers: '',
        twitter_url: '',
        tiktok_url: '',
        youtube_url: '',
        website_url: '',
      });
    }
  }, [business, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        business_name: formData.business_name,
        industry: formData.industry || undefined,
        description: formData.description || undefined,
        instagram_url: formData.instagram_url || undefined,
        instagram_followers: formData.instagram_followers || undefined,
        facebook_url: formData.facebook_url || undefined,
        facebook_likes: formData.facebook_likes || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        linkedin_followers: formData.linkedin_followers || undefined,
        twitter_url: formData.twitter_url || undefined,
        tiktok_url: formData.tiktok_url || undefined,
        youtube_url: formData.youtube_url || undefined,
        website_url: formData.website_url || undefined,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting business:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {business ? 'Modifier mon profil business' : 'Configurer mon profil business'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations de votre entreprise pour permettre une comparaison avec vos concurrents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_name">Nom de votre entreprise *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Ex: Ma Startup, Mon Entreprise..."
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
                placeholder="Décrivez votre activité, votre offre principale..."
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
                <Label htmlFor="instagram_followers">Nombre de followers Instagram</Label>
                <Input
                  id="instagram_followers"
                  value={formData.instagram_followers}
                  onChange={(e) => setFormData({ ...formData, instagram_followers: e.target.value })}
                  placeholder="Ex: 10K, 50K, 1M..."
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
                <Label htmlFor="facebook_likes">Nombre de likes Facebook</Label>
                <Input
                  id="facebook_likes"
                  value={formData.facebook_likes}
                  onChange={(e) => setFormData({ ...formData, facebook_likes: e.target.value })}
                  placeholder="Ex: 5K, 25K, 500K..."
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
                <Label htmlFor="linkedin_followers">Nombre de followers LinkedIn</Label>
                <Input
                  id="linkedin_followers"
                  value={formData.linkedin_followers}
                  onChange={(e) => setFormData({ ...formData, linkedin_followers: e.target.value })}
                  placeholder="Ex: 2K, 10K, 100K..."
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
                <Label htmlFor="youtube_url" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </Label>
                <Input
                  id="youtube_url"
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/@..."
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
              {isSubmitting ? 'Enregistrement...' : business ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
