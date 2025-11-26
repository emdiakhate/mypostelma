import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const allowedOrigins = [
  'https://postelma.com',
  'https://preview--mypostelma.lovable.app',
];

const corsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const clientId = Deno.env.get('VITE_GOOGLE_CLIENT_ID');

    if (!clientId) {
      return new Response(
        JSON.stringify({ 
          error: 'Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID secret.' 
        }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...headers },
        }
      );
    }

    return new Response(
      JSON.stringify({
        clientId,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
        ],
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in get-google-oauth-config:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
    );
  }
});
