import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PersonalTone {
  id: string;
  user_id: string;
  name: string;
  style_description: string | null;
  style_instructions: string;
  examples: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export function usePersonalTones() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: personalTones = [], isLoading } = useQuery({
    queryKey: ['personal-tones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_writing_styles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PersonalTone[];
    },
  });

  const createToneMutation = useMutation({
    mutationFn: async ({ name, examples }: { name: string; examples: string[] }) => {
      const { data, error } = await supabase.functions.invoke('analyze-writing-style', {
        body: { name, examples },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tones'] });
      toast({
        title: 'Ton personnel créé',
        description: 'Votre style d\'écriture a été analysé et sauvegardé.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteToneMutation = useMutation({
    mutationFn: async (toneId: string) => {
      const { error } = await supabase
        .from('user_writing_styles')
        .update({ is_active: false })
        .eq('id', toneId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tones'] });
      toast({
        title: 'Ton supprimé',
        description: 'Le ton personnel a été supprimé.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le ton.',
        variant: 'destructive',
      });
    },
  });

  return {
    personalTones,
    isLoading,
    createTone: createToneMutation.mutate,
    isCreating: createToneMutation.isPending,
    deleteTone: deleteToneMutation.mutate,
  };
}
