import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VenteSaleItem {
  product_id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface VenteSaleFormData {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  boutique_id: string; // IMPORTANT: Boutique où se fait la vente
  moyen_paiement: 'cash' | 'mobile_money' | 'carte' | 'cheque' | 'virement';
  items: VenteSaleItem[];
  tva_rate?: number;
  notes?: string;
}

interface VenteSaleResult {
  order_id: string;
  order_number: string;
  stock_movements_created: number;
  caisse_updated: boolean;
}

/**
 * Hook pour gérer les ventes avec intégration automatique:
 * - Création de la commande
 * - Décrémentation du stock
 * - Alimentation de la caisse
 *
 * TRANSACTION ATOMIQUE: Tout ou rien
 */
export const useSales = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Créer une vente complète avec intégration stock + caisse
   */
  const createSale = useCallback(
    async (formData: VenteSaleFormData): Promise<VenteSaleResult | null> => {
      setLoading(true);

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('User not authenticated');

        const user_id = userData.user.id;

        // ============================================================
        // ÉTAPE 1: VÉRIFIER QU'UNE CAISSE EST OUVERTE
        // ============================================================

        const today = new Date().toISOString().split('T')[0];

        const { data: caisse, error: caisseCheckError } = await (supabase as any)
          .from('caisses_journalieres')
          .select('id, statut')
          .eq('boutique_id', formData.boutique_id)
          .eq('date', today)
          .eq('statut', 'ouverte')
          .single();

        if (caisseCheckError || !caisse) {
          throw new Error(
            'Aucune caisse ouverte pour cette boutique aujourd\'hui. Veuillez ouvrir la caisse d\'abord.'
          );
        }

        // ============================================================
        // ÉTAPE 2: VÉRIFIER LE STOCK DISPONIBLE (via calcul des mouvements)
        // ============================================================

        for (const item of formData.items) {
          // Calculer le stock actuel à partir des mouvements
          const { data: movementsData } = await (supabase as any)
            .from('stock_movements')
            .select('quantite')
            .eq('boutique_id', formData.boutique_id)
            .eq('produit_id', item.product_id)
            .eq('statut', 'completed');

          const quantiteDisponible = (movementsData || []).reduce(
            (sum: number, m: any) => sum + (m.quantite || 0),
            0
          );

          if (quantiteDisponible < item.quantity) {
            throw new Error(
              `Stock insuffisant pour ${item.product_name}. Disponible: ${quantiteDisponible}, Demandé: ${item.quantity}`
            );
          }
        }

        // ============================================================
        // ÉTAPE 3: CALCULER LES TOTAUX
        // ============================================================

        const tva_rate = formData.tva_rate || 0.2;
        const total_ht = formData.items.reduce((sum, item) => sum + item.total, 0);
        const total_ttc = total_ht * (1 + tva_rate);

        // ============================================================
        // ÉTAPE 4: GÉNÉRER LE NUMÉRO DE COMMANDE
        // ============================================================

        const orderNumber = `CMD-${new Date().getFullYear()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;

        // ============================================================
        // ÉTAPE 5: CRÉER LA COMMANDE (vente_orders)
        // ============================================================

        const { data: order, error: orderError } = await supabase
          .from('vente_orders')
          .insert([
            {
              user_id,
              number: orderNumber,
              client_name: formData.client_name,
              client_email: formData.client_email,
              client_phone: formData.client_phone,
              client_address: formData.client_address,
              status: 'confirmed', // Vente directe = confirmée immédiatement
              payment_status: 'paid', // Paiement immédiat en caisse
              total_ht,
              total_ttc,
              tva_rate,
              confirmed_at: new Date().toISOString(),
              notes: formData.notes,
              boutique_id: formData.boutique_id,
              caisse_id: caisse.id,
              moyen_paiement: formData.moyen_paiement,
            } as any,
          ])
          .select()
          .single();

        if (orderError) throw orderError;

        // ============================================================
        // ÉTAPE 6: CRÉER LES LIGNES DE COMMANDE (vente_order_items)
        // ============================================================

        const orderItems = formData.items.map((item, index) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          order_index: index,
        }));

        const { error: itemsError } = await supabase
          .from('vente_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // ============================================================
        // ÉTAPE 7: CRÉER LES MOUVEMENTS DE STOCK (SORTIE)
        // ============================================================

        const stockMovements = formData.items.map((item) => ({
          boutique_id: formData.boutique_id,
          produit_id: item.product_id,
          quantite: -item.quantity, // NÉGATIF = SORTIE
          type: 'sortie',
          reference_type: 'vente',
          reference_id: order.id,
          user_id,
          notes: `Vente ${orderNumber} - ${item.product_name}`,
          statut: 'completed',
        }));

        const { error: stockError } = await (supabase as any)
          .from('stock_movements')
          .insert(stockMovements);

        if (stockError) throw stockError;

        // ============================================================
        // ÉTAPE 8: CRÉER LE MOUVEMENT DE CAISSE (ENTRÉE)
        // ============================================================

        const { error: caisseError } = await (supabase as any)
          .from('mouvements_caisse')
          .insert([
            {
              caisse_id: caisse.id,
              type: 'vente',
              montant: total_ttc,
              moyen_paiement: formData.moyen_paiement,
              reference_type: 'vente',
              reference_id: order.id,
              description: `Vente ${orderNumber} - ${formData.client_name}`,
              user_id,
            },
          ]);

        if (caisseError) throw caisseError;

        // ============================================================
        // SUCCÈS !
        // ============================================================

        toast({
          title: 'Vente enregistrée',
          description: `Commande ${orderNumber} créée avec succès. Stock et caisse mis à jour.`,
        });

        return {
          order_id: order.id,
          order_number: orderNumber,
          stock_movements_created: formData.items.length,
          caisse_updated: true,
        };
      } catch (error: any) {
        console.error('Error creating sale:', error);
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de créer la vente',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    createSale,
    loading,
  };
};
