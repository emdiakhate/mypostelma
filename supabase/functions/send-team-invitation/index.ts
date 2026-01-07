/**
 * Send Team Invitation via Email
 * Invites a user to join a team by email
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { create, verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@postelma.com';
const APP_URL = Deno.env.get('APP_URL') || 'https://preview--mypostelma.lovable.app';
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
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Parse request body
    const { team_id, email, role } = await req.json();

    // Validate input
    if (!team_id || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: team_id, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user owns the team or is an admin
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, user_id, name')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: 'Team not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is owner or admin member
    const isOwner = team.user_id === userId;
    let isAdmin = false;

    if (!isOwner) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', team_id)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .single();

      isAdmin = membership?.role === 'admin';
    }

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - You do not have permission to invite members' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('team_id', team_id)
      .eq('email', email)
      .single();

    if (existingMember) {
      if (existingMember.status === 'accepted') {
        return new Response(
          JSON.stringify({ error: 'This user is already a member of the team' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (existingMember.status === 'pending') {
        return new Response(
          JSON.stringify({ error: 'An invitation has already been sent to this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate invitation token (JWT)
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days expiry

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const payload = {
      team_id,
      email,
      invited_by: userId,
      exp: Math.floor(tokenExpiry.getTime() / 1000),
    };

    const token = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);

    // Create team member invitation
    const { data: teamMember, error: insertError } = await supabase
      .from('team_members')
      .insert({
        team_id,
        email,
        role: role || 'member',
        invited_by: userId,
        status: 'pending',
        invitation_token: token,
        token_expires_at: tokenExpiry.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create team member:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    const inviterName = inviterProfile?.name || user.email;

    // Send invitation email via Resend
    const invitationUrl = `${APP_URL}/accept-invitation/${token}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Invitation à rejoindre une équipe</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p><strong>${inviterName}</strong> vous invite à rejoindre l'équipe <strong>${team.name}</strong> sur Postelma.</p>
              <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation :</p>
              <div style="text-align: center;">
                <a href="${invitationUrl}" class="button">Accepter l'invitation</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                <a href="${invitationUrl}">${invitationUrl}</a>
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Cette invitation expire dans 7 jours.
              </p>
            </div>
            <div class="footer">
              <p>© 2024 Postelma - Gestion de réseaux sociaux</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Invitation à rejoindre l'équipe ${team.name}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Failed to send email:', resendData);
      // Don't fail the request, just log the error
      // The invitation is created, user can still be re-invited
    }

    console.log('Team invitation sent successfully:', {
      team_id,
      email,
      resend_id: resendData.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        member_id: teamMember.id,
        email_sent: resendResponse.ok,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-team-invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
