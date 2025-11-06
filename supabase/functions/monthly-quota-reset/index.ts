import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetResult {
  success: boolean;
  totalReset: number;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting monthly quota reset...');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all beta users
    const { data: betaUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('beta_user', true);

    if (fetchError) {
      console.error('Error fetching beta users:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${betaUsers?.length || 0} beta users to reset`);

    const result: ResetResult = {
      success: true,
      totalReset: 0,
      errors: []
    };

    // Reset quotas for each beta user
    if (betaUsers && betaUsers.length > 0) {
      for (const user of betaUsers) {
        try {
          const { error: resetError } = await supabase.rpc('reset_user_quotas', {
            p_user_id: user.id
          });

          if (resetError) {
            console.error(`❌ Failed to reset quotas for ${user.email}:`, resetError);
            result.errors.push(`${user.email}: ${resetError.message}`);
          } else {
            console.log(`✅ Successfully reset quotas for ${user.email}`);
            result.totalReset++;
          }
        } catch (error: any) {
          console.error(`❌ Error processing ${user.email}:`, error);
          result.errors.push(`${user.email}: ${error?.message || 'Unknown error'}`);
        }
      }
    }

    console.log(`✨ Quota reset completed: ${result.totalReset}/${betaUsers?.length || 0} users`);

    return new Response(
      JSON.stringify({
        success: result.errors.length === 0,
        message: `Reset quotas for ${result.totalReset} beta users`,
        totalUsers: betaUsers?.length || 0,
        successCount: result.totalReset,
        errorCount: result.errors.length,
        errors: result.errors,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in monthly-quota-reset function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
