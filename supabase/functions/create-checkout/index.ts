import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const allowedOrigins = [
  'https://postelma.com',
  'https://www.postelma.com',
  'https://preview--mypostelma.lovable.app',
  'https://8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovableproject.com',
  'https://id-preview--8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Récupérer le JWT depuis l'en-tête Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("Vous devez être connecté pour effectuer cette action");
    }
    
    const jwt = authHeader.replace("Bearer ", "");
    logStep("JWT token found");

    // Créer un client Supabase avec le JWT de l'utilisateur
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Récupérer les informations de l'utilisateur en passant le JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    
    if (userError || !user) {
      logStep("ERROR: Failed to get user", { error: userError });
      throw new Error("Session invalide. Veuillez vous reconnecter.");
    }

    if (!user.email) {
      logStep("ERROR: User has no email");
      throw new Error("Votre compte n'a pas d'email associé");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId } = await req.json();
    if (!priceId) {
      logStep("ERROR: No price ID provided");
      throw new Error("ID de prix manquant");
    }
    logStep("Price ID received", { priceId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: Stripe key not configured");
      throw new Error("Configuration Stripe manquante");
    }

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2025-08-27.basil" 
    });
    
    logStep("Checking for existing Stripe customer", { email: user.email });
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found, will create new");
    }

    const origin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:8080";
    logStep("Creating checkout session", { origin });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/checkout-success`,
      cancel_url: `${origin}/pricing?subscription=canceled`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
