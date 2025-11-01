import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const userId = userData.user.id;
    console.log('Creating beta subscription for user:', userId);

    // Créer l'abonnement bêta
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'pro',
        status: 'active',
        beta_user: true,
        trial_ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      throw new Error('Failed to create subscription');
    }

    // Mettre à jour le profil utilisateur
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        beta_user: true,
        lead_generation_limit: 5,
        posts_unlimited: true,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error('Failed to update profile');
    }

    console.log('Beta subscription created successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        subscription,
        message: 'Abonnement bêta créé avec succès'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-beta-subscription:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
