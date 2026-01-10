/**
 * Types TypeScript pour le système de gestion de caisse
 *
 * Note: Ce module utilise stock_warehouses (module Stock) pour les boutiques/entrepôts
 */

// =====================================================
// ENUMS
// =====================================================

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
// INTERFACES - Types spécifiques au module Caisse
// =====================================================

/**
 * Warehouse (Boutique/Entrepôt)
 * Correspond à stock_warehouses du module Stock
 * Type 'STORE' = boutique physique
 */
export interface Warehouse {
  id: string;
  user_id: string;
  name: string;
  type: 'STORE' | 'WAREHOUSE' | 'MOBILE' | 'OTHER';
  address?: string;
  city?: string;
  country?: string;
  gps_lat?: number;
  gps_lng?: number;
  manager_name?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Caisse Journalière
 */
export interface CaisseJournaliere {
  id: string;
  warehouse_id: string; // Référence stock_warehouses
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
  warehouse?: Warehouse;
  mouvements?: MouvementCaisse[];

  // Statistiques calculées (non stockées en DB)
  total_ventes_cash?: number;
  total_ventes_mobile_money?: number;
  total_ventes_carte?: number;
  total_entrees?: number;
  total_sorties?: number;
  nombre_ventes?: number;
}

/**
 * Mouvement de Caisse
 */
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

export interface CaisseOuvertureFormData {
  warehouse_id: string; // ID de la boutique (stock_warehouses)
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
  warehouse_id: string;
  warehouse_nom: string;
  ventes_jour: number;
  nombre_ventes: number;
  stock_total_value: number;
  produits_stock_bas: number;
  caisse_statut: CaisseStatut;
  caisse_solde: number;
}

// =====================================================
// TYPES POUR FILTRES
// =====================================================

export interface CaisseFilters {
  warehouse_id?: string;
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
