/**
 * Hook pour la persistance des données dans localStorage
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer un état persistant dans localStorage
 * @param key - Clé de stockage dans localStorage
 * @param initialValue - Valeur initiale si aucune donnée n'est trouvée
 * @returns [value, setValue] - État et fonction de mise à jour
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // État local
  const [state, setState] = useState<T>(initialValue);
  
  // Charger depuis localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir les dates string en Date objects si nécessaire
        const processed = processDates(parsed);
        setState(processed);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de ${key} depuis localStorage:`, error);
    }
  }, [key]);
  
  // Sauvegarder dans localStorage à chaque changement
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde de ${key} dans localStorage:`, error);
      }
      
      return newValue;
    });
  }, [key]);
  
  return [state, setValue];
}

/**
 * Traite les objets pour convertir les dates string en Date objects
 * @param obj - Objet à traiter
 * @returns Objet avec dates converties
 */
function processDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(processDates);
  }
  
  if (typeof obj === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'connectedAt' || key === 'lastSync' || key === 'createdAt') {
        processed[key] = new Date(value as string);
      } else {
        processed[key] = processDates(value);
      }
    }
    return processed;
  }
  
  return obj;
}

/**
 * Hook spécialisé pour les comptes sociaux
 * @param initialAccounts - Comptes initiaux
 * @returns [accounts, setAccounts, addAccount, removeAccount, updateAccount]
 */
export function useSocialAccounts(initialAccounts: any[] = []) {
  const [accounts, setAccounts] = usePersistentState('postelma_social_accounts', initialAccounts);
  
  const addAccount = useCallback((account: any) => {
    setAccounts(prev => [...prev, account]);
  }, [setAccounts]);
  
  const removeAccount = useCallback((accountId: string) => {
    setAccounts(prev => prev.filter((acc: any) => acc.id !== accountId));
  }, [setAccounts]);
  
  const updateAccount = useCallback((accountId: string, updates: Partial<any>) => {
    setAccounts(prev => prev.map((acc: any) => 
      acc.id === accountId ? { ...acc, ...updates } : acc
    ));
  }, [setAccounts]);
  
  const syncAllAccounts = useCallback(() => {
    const now = new Date();
    setAccounts(prev => prev.map((acc: any) => ({
      ...acc,
      lastSync: now
    })));
  }, [setAccounts]);
  
  return {
    accounts,
    setAccounts,
    addAccount,
    removeAccount,
    updateAccount,
    syncAllAccounts
  };
}
