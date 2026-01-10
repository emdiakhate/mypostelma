import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  CaisseJournaliere,
  MouvementCaisse,
  CaisseOuvertureFormData,
  CaisseClotureFormData,
  MouvementCaisseFormData,
  StatistiquesCaisse,
  CaisseFilters,
} from '@/types/caisse';

export const useCaisseJournaliere = (filters?: CaisseFilters) => {
  const [caisses, setCaisses] = useState<CaisseJournaliere[]>([]);
  const [caisseActive, setCaisseActive] = useState<CaisseJournaliere | null>(
    null
  );
  const [mouvements, setMouvements] = useState<MouvementCaisse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCaisses = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('caisses_journalieres')
        .select(
          `
          *,
          boutique:boutiques(id, nom, ville)
        `
        )
        .order('date', { ascending: false });

      if (filters?.boutique_id) {
        query = query.eq('boutique_id', filters.boutique_id);
      }
      if (filters?.statut) {
        query = query.eq('statut', filters.statut);
      }
      if (filters?.date_debut) {
        query = query.gte('date', filters.date_debut.toISOString());
      }
      if (filters?.date_fin) {
        query = query.lte('date', filters.date_fin.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const caissesData = (data || []).map((c) => ({
        ...c,
        date: new Date(c.date),
        heure_ouverture: c.heure_ouverture ? new Date(c.heure_ouverture) : undefined,
        heure_cloture: c.heure_cloture ? new Date(c.heure_cloture) : undefined,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at),
      }));

      setCaisses(caissesData);

      // Charger la caisse active (ouverte aujourd'hui)
      const today = new Date().toISOString().split('T')[0];
      const active = caissesData.find(
        (c) =>
          c.statut === 'ouverte' &&
          c.date.toISOString().split('T')[0] === today
      );
      setCaisseActive(active || null);
    } catch (error: any) {
      console.error('Error loading caisses:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les caisses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const loadMouvements = useCallback(
    async (caisseId: string) => {
      try {
        const { data, error } = await supabase
          .from('mouvements_caisse')
          .select('*')
          .eq('caisse_id', caisseId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setMouvements(
          (data || []).map((m) => ({
            ...m,
            created_at: new Date(m.created_at),
          }))
        );
      } catch (error: any) {
        console.error('Error loading mouvements:', error);
      }
    },
    []
  );

  useEffect(() => {
    loadCaisses();
  }, [loadCaisses]);

  useEffect(() => {
    if (caisseActive) {
      loadMouvements(caisseActive.id);
    }
  }, [caisseActive, loadMouvements]);

  const ouvrirCaisse = async (
    formData: CaisseOuvertureFormData
  ): Promise<CaisseJournaliere | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Vérifier qu'il n'y a pas déjà une caisse ouverte
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('caisses_journalieres')
        .select('id')
        .eq('boutique_id', formData.boutique_id)
        .eq('date', today)
        .single();

      if (existing) {
        toast({
          title: 'Erreur',
          description: 'Une caisse est déjà ouverte pour aujourd\'hui',
          variant: 'destructive',
        });
        return null;
      }

      const { data, error } = await supabase
        .from('caisses_journalieres')
        .insert([
          {
            boutique_id: formData.boutique_id,
            date: today,
            user_id: userData.user.id,
            solde_ouverture: formData.solde_ouverture,
            notes_ouverture: formData.notes_ouverture,
            heure_ouverture: new Date().toISOString(),
            ouvert_par: userData.user.id,
            statut: 'ouverte',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const nouvelleCaisse: CaisseJournaliere = {
        ...data,
        date: new Date(data.date),
        heure_ouverture: new Date(data.heure_ouverture),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setCaisses((prev) => [nouvelleCaisse, ...prev]);
      setCaisseActive(nouvelleCaisse);

      toast({
        title: 'Succès',
        description: 'Caisse ouverte avec succès',
      });

      return nouvelleCaisse;
    } catch (error: any) {
      console.error('Error opening caisse:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ouvrir la caisse',
        variant: 'destructive',
      });
      return null;
    }
  };

  const cloturerCaisse = async (
    caisseId: string,
    formData: CaisseClotureFormData
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Calculer le solde théorique
      const { data: theorique } = await supabase.rpc(
        'calculer_solde_theorique_caisse',
        { p_caisse_id: caisseId }
      );

      const ecart = formData.solde_cloture - (theorique || 0);

      const { error } = await supabase
        .from('caisses_journalieres')
        .update({
          solde_cloture: formData.solde_cloture,
          ecart: ecart,
          notes_cloture: formData.notes_cloture,
          heure_cloture: new Date().toISOString(),
          cloture_par: userData.user.id,
          statut: 'fermee',
        })
        .eq('id', caisseId);

      if (error) throw error;

      setCaisses((prev) =>
        prev.map((c) =>
          c.id === caisseId
            ? {
                ...c,
                solde_cloture: formData.solde_cloture,
                ecart: ecart,
                notes_cloture: formData.notes_cloture,
                heure_cloture: new Date(),
                cloture_par: userData.user.id,
                statut: 'fermee',
              }
            : c
        )
      );

      if (caisseActive?.id === caisseId) {
        setCaisseActive(null);
      }

      toast({
        title: 'Succès',
        description: `Caisse clôturée. Écart: ${ecart.toFixed(2)} FCFA`,
        variant: Math.abs(ecart) > 1000 ? 'destructive' : 'default',
      });

      return true;
    } catch (error: any) {
      console.error('Error closing caisse:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de clôturer la caisse',
        variant: 'destructive',
      });
      return false;
    }
  };

  const ajouterMouvement = async (
    formData: MouvementCaisseFormData
  ): Promise<MouvementCaisse | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('mouvements_caisse')
        .insert([
          {
            ...formData,
            user_id: userData.user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newMouvement: MouvementCaisse = {
        ...data,
        created_at: new Date(data.created_at),
      };

      setMouvements((prev) => [newMouvement, ...prev]);

      toast({
        title: 'Succès',
        description: 'Mouvement enregistré avec succès',
      });

      return newMouvement;
    } catch (error: any) {
      console.error('Error adding mouvement:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'enregistrer le mouvement',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getStatistiquesCaisse = (caisseId: string): StatistiquesCaisse => {
    const caisse = caisses.find((c) => c.id === caisseId);
    const mouvementsCaisse = mouvements.filter((m) => m.caisse_id === caisseId);

    const ventes = mouvementsCaisse.filter((m) => m.type === 'vente');
    const entrees = mouvementsCaisse.filter((m) => m.type === 'entree');
    const sorties = mouvementsCaisse.filter((m) => m.type === 'sortie');

    const total_ventes = ventes.reduce((sum, m) => sum + m.montant, 0);
    const total_ventes_cash = ventes
      .filter((m) => m.moyen_paiement === 'cash')
      .reduce((sum, m) => sum + m.montant, 0);
    const total_ventes_mobile_money = ventes
      .filter((m) => m.moyen_paiement === 'mobile_money')
      .reduce((sum, m) => sum + m.montant, 0);
    const total_ventes_carte = ventes
      .filter((m) => m.moyen_paiement === 'carte')
      .reduce((sum, m) => sum + m.montant, 0);
    const total_ventes_autres =
      total_ventes -
      total_ventes_cash -
      total_ventes_mobile_money -
      total_ventes_carte;

    const nombre_ventes = ventes.length;
    const panier_moyen = nombre_ventes > 0 ? total_ventes / nombre_ventes : 0;

    const total_entrees = entrees.reduce((sum, m) => sum + m.montant, 0);
    const total_sorties = sorties.reduce((sum, m) => sum + m.montant, 0);

    const solde_theorique =
      (caisse?.solde_ouverture || 0) +
      total_ventes +
      total_entrees -
      total_sorties;

    return {
      total_ventes,
      total_ventes_cash,
      total_ventes_mobile_money,
      total_ventes_carte,
      total_ventes_autres,
      nombre_ventes,
      panier_moyen,
      total_entrees,
      total_sorties,
      solde_theorique,
    };
  };

  return {
    caisses,
    caisseActive,
    mouvements,
    loading,
    ouvrirCaisse,
    cloturerCaisse,
    ajouterMouvement,
    getStatistiquesCaisse,
    reload: loadCaisses,
    reloadMouvements: loadMouvements,
  };
};
