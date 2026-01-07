/**
 * Accept Team Invitation
 * Validates token and accepts team invitation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key-change-in-production';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    let payload: any;
    try {
      payload = await verify(token, key);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get team member from database
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('*, teams(id, name, color)')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (memberError || !teamMember) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found or already accepted' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (teamMember.token_expires_at && new Date(teamMember.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is authenticated
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        userId = user.id;

        // Verify email matches
        if (user.email !== teamMember.email) {
          return new Response(
            JSON.stringify({
              error: 'This invitation was sent to a different email address',
              invited_email: teamMember.email,
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // If user is authenticated, accept the invitation
    if (userId) {
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          user_id: userId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', teamMember.id);

      if (updateError) {
        console.error('Failed to accept invitation:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to accept invitation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          team: teamMember.teams,
          message: 'Invitation accepted successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user is not authenticated, return invitation details for signup
    return new Response(
      JSON.stringify({
        success: false,
        requires_signup: true,
        invitation: {
          email: teamMember.email,
          team: teamMember.teams,
          role: teamMember.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in accept-team-invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
