/**
 * Hook pour gérer les paramètres de l'entreprise
 * Logo, coordonnées, templates par défaut
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CompanySettings } from '@/types/templates';
import type { TemplateId } from '@/types/templates';

interface DbCompanySettings {
  id: string;
  user_id: string;
  company_name: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  siret: string | null;
  tva_number: string | null;
  logo_url: string | null;
  bank_name: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  default_payment_terms: string | null;
  default_notes: string | null;
  invoice_prefix: string | null;
  quote_prefix: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbSettings = (db: DbCompanySettings): CompanySettings => ({
  id: db.id,
  user_id: db.user_id,
  company_name: db.company_name || 'Mon Entreprise',
  company_address: db.address || undefined,
  company_phone: db.phone || undefined,
  company_email: db.email || undefined,
  logo_url: db.logo_url || undefined,
  default_invoice_template: 'classic' as TemplateId,
  default_quote_template: 'classic' as TemplateId,
  created_at: new Date(db.created_at),
  updated_at: new Date(db.updated_at),
});

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(mapDbSettings(data));
      } else {
        // Créer des settings par défaut si aucun n'existe
        // NB: la table `company_settings` ne contient pas de colonnes de template.
        // On conserve les templates par défaut côté front (mapDbSettings).
        const defaultSettings = {
          user_id: userData.user.id,
          company_name: 'Mon Entreprise',
        };

        const { data: newSettings, error: createError } = await supabase
          .from('company_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        setSettings(mapDbSettings(newSettings));
      }
    } catch (error: any) {
      console.error('Error loading company settings:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les paramètres',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (
    updates: Partial<Omit<CompanySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    try {
      if (!settings) throw new Error('Settings not loaded');

        const { error } = await supabase
          .from('company_settings')
          .update({
            company_name: updates.company_name,
            address: updates.company_address || null,
            phone: updates.company_phone || null,
            email: updates.company_email || null,
            logo_url: updates.logo_url || null,
          })
          .eq('id', settings.id);

      if (error) throw error;

      await loadSettings();

      toast({
        title: 'Paramètres mis à jour',
        description: 'Vos modifications ont été enregistrées',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour les paramètres',
      });
      return false;
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Vérifier le type de fichier
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Format invalide',
          description: 'Formats acceptés: PNG, JPG, WebP',
        });
        return null;
      }

      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Fichier trop volumineux',
          description: 'Taille maximum: 2 MB',
        });
        return null;
      }

      // Upload vers Supabase Storage - structure: userId/filename pour RLS
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;

      // Mettre à jour les settings
      await updateSettings({ logo_url: logoUrl });

      toast({
        title: 'Logo uploadé',
        description: 'Votre logo a été mis à jour',
      });

      return logoUrl;
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'uploader le logo",
      });
      return null;
    }
  };

  const deleteLogo = async (): Promise<boolean> => {
    try {
      if (!settings?.logo_url) return true;

      // Extraire le nom du fichier depuis l'URL
      const fileName = settings.logo_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('logos').remove([fileName]);
      }

      await updateSettings({ logo_url: undefined });

      toast({
        title: 'Logo supprimé',
        description: 'Votre logo a été retiré',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le logo',
      });
      return false;
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    uploadLogo,
    deleteLogo,
    reload: loadSettings,
  };
};

export default useCompanySettings;
