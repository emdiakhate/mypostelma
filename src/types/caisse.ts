/**
 * Types TypeScript pour le système de gestion de caisse
 */

// =====================================================
// ENUMS
// =====================================================

export type BoutiqueStatut = 'active' | 'inactive' | 'closed';

export type StockMovementType =
  | 'entree'
  | 'sortie'
  | 'ajustement'
  | 'transfert_out'
  | 'transfert_in';

export type StockMovementReferenceType =
  | 'vente'
  | 'achat'
  | 'ajustement'
  | 'transfert'
  | 'inventaire';

export type StockMovementStatut = 'pending' | 'completed' | 'cancelled';

export type CaisseStatut = 'ouverte' | 'fermee';

export type MouvementCaisseType = 'vente' | 'entree' | 'sortie';

export type MoyenPaiement =
  | 'cash'
  | 'mobile_money'
  | 'carte'
  | 'cheque'
  | 'virement';

export type MouvementCaisseReferenceType =
  | 'vente'
  | 'depense'
  | 'ajustement'
  | 'depot'
  | 'retrait';

// =====================================================
// INTERFACES
// =====================================================

export interface Boutique {
  id: string;
  user_id: string;
  nom: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  responsable_nom?: string;
  responsable_telephone?: string;
  latitude?: number;
  longitude?: number;
  statut: BoutiqueStatut;
  created_at: Date;
  updated_at: Date;
}

export interface StockMovement {
  id: string;
  boutique_id: string;
  produit_id: string;
  quantite: number;
  type: StockMovementType;
  reference_type?: StockMovementReferenceType;
  reference_id?: string;
  user_id: string;
  notes?: string;
  statut: StockMovementStatut;
  created_at: Date;

  // Relations (populated via joins)
  boutique?: Boutique;
  produit?: {
    id: string;
    name: string;
    sku?: string;
  };
  user?: {
    id: string;
    email?: string;
  };
}

export interface StockActuel {
  boutique_id: string;
  produit_id: string;
  quantite_disponible: number;
  derniere_mise_a_jour: Date;

  // Relations
  boutique?: Boutique;
  produit?: {
    id: string;
    name: string;
    sku?: string;
    price?: number;
  };
}

export interface CaisseJournaliere {
  id: string;
  boutique_id: string;
  date: Date;
  user_id: string;

  // Ouverture
  solde_ouverture: number;
  heure_ouverture?: Date;
  ouvert_par?: string;

  // Clôture
  solde_theorique: number;
  solde_cloture?: number;
  ecart?: number;
  heure_cloture?: Date;
  cloture_par?: string;

  // Statut
  statut: CaisseStatut;

  // Notes
  notes_ouverture?: string;
  notes_cloture?: string;

  created_at: Date;
  updated_at: Date;

  // Relations
  boutique?: Boutique;
  mouvements?: MouvementCaisse[];

  // Statistiques calculées (non stockées en DB)
  total_ventes_cash?: number;
  total_ventes_mobile_money?: number;
  total_ventes_carte?: number;
  total_entrees?: number;
  total_sorties?: number;
  nombre_ventes?: number;
}

export interface MouvementCaisse {
  id: string;
  caisse_id: string;
  type: MouvementCaisseType;
  montant: number;
  moyen_paiement: MoyenPaiement;
  reference_type?: MouvementCaisseReferenceType;
  reference_id?: string;
  description?: string;
  user_id: string;
  created_at: Date;

  // Relations
  caisse?: CaisseJournaliere;
  user?: {
    id: string;
    email?: string;
  };
}

// =====================================================
// TYPES POUR FORMULAIRES
// =====================================================

export interface BoutiqueFormData {
  nom: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  responsable_nom?: string;
  responsable_telephone?: string;
  latitude?: number;
  longitude?: number;
  statut?: BoutiqueStatut;
}

export interface StockMovementFormData {
  boutique_id: string;
  produit_id: string;
  quantite: number;
  type: StockMovementType;
  reference_type?: StockMovementReferenceType;
  reference_id?: string;
  notes?: string;
}

export interface CaisseOuvertureFormData {
  boutique_id: string;
  solde_ouverture: number;
  notes_ouverture?: string;
}

export interface CaisseClotureFormData {
  solde_cloture: number;
  notes_cloture?: string;
}

export interface MouvementCaisseFormData {
  caisse_id: string;
  type: MouvementCaisseType;
  montant: number;
  moyen_paiement: MoyenPaiement;
  reference_type?: MouvementCaisseReferenceType;
  reference_id?: string;
  description?: string;
}

// =====================================================
// TYPES POUR STATISTIQUES
// =====================================================

export interface StatistiquesCaisse {
  total_ventes: number;
  total_ventes_cash: number;
  total_ventes_mobile_money: number;
  total_ventes_carte: number;
  total_ventes_autres: number;
  nombre_ventes: number;
  panier_moyen: number;
  total_entrees: number;
  total_sorties: number;
  solde_theorique: number;
}

export interface StatistiquesBoutique {
  boutique_id: string;
  boutique_nom: string;
  ventes_jour: number;
  nombre_ventes: number;
  stock_total_value: number;
  produits_stock_bas: number;
  caisse_statut: CaisseStatut;
  caisse_solde: number;
}

export interface StockAlert {
  boutique_id: string;
  boutique_nom: string;
  produit_id: string;
  produit_nom: string;
  quantite_actuelle: number;
  seuil_alerte: number;
  severite: 'critique' | 'bas' | 'moyen';
}

// =====================================================
// TYPES POUR FILTRES
// =====================================================

export interface StockMovementFilters {
  boutique_id?: string;
  produit_id?: string;
  type?: StockMovementType;
  date_debut?: Date;
  date_fin?: Date;
  statut?: StockMovementStatut;
}

export interface CaisseFilters {
  boutique_id?: string;
  date_debut?: Date;
  date_fin?: Date;
  statut?: CaisseStatut;
}

export interface MouvementCaisseFilters {
  caisse_id?: string;
  type?: MouvementCaisseType;
  moyen_paiement?: MoyenPaiement;
  date_debut?: Date;
  date_fin?: Date;
}
