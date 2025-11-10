import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const allowedOrigins = [
  'https://postelma.com',
  'https://www.postelma.com',
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

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔐 User authenticated:', user.id);

    const { leadName, leadCategory, leadCity, template, customContext } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en prospection commerciale et génération de leads. 
Ton rôle est de créer des messages personnalisés et convaincants pour contacter des prospects.

Règles importantes:
- Personnalise le message avec les informations du prospect
- Sois professionnel mais chaleureux
- Mets en avant la valeur ajoutée de tes services
- Inclus un appel à l'action clair
- Garde le message concis (150-250 mots)
- Utilise un ton adapté au secteur d'activité`;

    let userPrompt = `Crée un message de prospection pour:
Nom: ${leadName}
Catégorie: ${leadCategory}
Ville: ${leadCity}`;

    if (template) {
      userPrompt += `\n\nUtilise ce template comme base:\n${template}`;
    }

    if (customContext) {
      userPrompt += `\n\nContexte additionnel:\n${customContext}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Veuillez réessayer plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants. Veuillez ajouter des crédits à votre espace de travail." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ generatedMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-lead-message:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
