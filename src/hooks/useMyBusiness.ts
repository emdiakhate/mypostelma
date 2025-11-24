import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { MyBusiness } from '@/types/competitor';
import { getMyBusiness, upsertMyBusiness, deleteMyBusiness } from '@/services/myBusiness';
import { toast } from 'sonner';

export const useMyBusiness = () => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBusiness = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getMyBusiness();
      setBusiness(data);
    } catch (err) {
      setError(err as Error);
      toast.error('Erreur lors du chargement du profil business');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveBusiness = async (businessData: Omit<MyBusiness, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const data = await upsertMyBusiness(businessData);
      setBusiness(data);
      toast.success('Profil business enregistré avec succès');
      return data;
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement');
      throw err;
    }
  };

  const removeBusiness = async (id: string) => {
    try {
      await deleteMyBusiness(id);
      setBusiness(null);
      toast.success('Profil business supprimé');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      throw err;
    }
  };

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  return {
    business,
    loading,
    error,
    saveBusiness,
    removeBusiness,
    refreshBusiness: loadBusiness,
  };
};
