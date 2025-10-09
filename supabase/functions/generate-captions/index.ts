import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, tone, platforms, campaign } = await req.json();
    
    if (!content) {
      throw new Error("Le contenu est requis");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    const platformsList = platforms || ['instagram', 'facebook', 'twitter', 'linkedin'];
    
    const systemPrompt = `Tu es un expert en rédaction de contenu pour les réseaux sociaux. 
Génère des captions optimisées pour chaque plateforme en respectant:
- Le ton demandé: ${tone || 'professionnel'}
- Les bonnes pratiques de chaque plateforme
- Les limites de caractères
- L'engagement et la conversion

${campaign ? `Cette publication fait partie de la campagne: ${campaign}` : ''}

Retourne UNIQUEMENT un objet JSON avec les captions pour chaque plateforme, sans markdown.`;

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
          { 
            role: "user", 
            content: `Génère des captions pour ces plateformes: ${platformsList.join(', ')}\n\nContenu de base: ${content}` 
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_captions",
              description: "Génère des captions optimisées pour chaque plateforme",
              parameters: {
                type: "object",
                properties: {
                  captions: {
                    type: "object",
                    properties: {
                      instagram: { type: "string" },
                      facebook: { type: "string" },
                      twitter: { type: "string" },
                      linkedin: { type: "string" },
                      tiktok: { type: "string" },
                      youtube: { type: "string" }
                    },
                    additionalProperties: false
                  }
                },
                required: ["captions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_captions" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Veuillez réessayer plus tard." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants. Veuillez ajouter des crédits à votre compte Lovable." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erreur AI Gateway:", response.status, errorText);
      throw new Error("Erreur lors de la génération des captions");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("Aucune caption générée");
    }

    const captions = JSON.parse(toolCall.function.arguments).captions;

    return new Response(
      JSON.stringify({ captions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
