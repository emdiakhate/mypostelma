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
    const { prompt, type = 'simple', sourceImages = [] } = await req.json();
    
    if (!prompt) {
      throw new Error("Le prompt est requis");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    let messages: any[] = [];

    if (type === 'simple') {
      // Génération simple d'image
      messages = [
        {
          role: "user",
          content: `Generate a professional social media image: ${prompt}. High quality, visually appealing, suitable for Instagram/Facebook posts.`
        }
      ];
    } else if (type === 'edit' && sourceImages.length > 0) {
      // Édition d'image existante
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Edit this image: ${prompt}`
            },
            {
              type: "image_url",
              image_url: {
                url: sourceImages[0]
              }
            }
          ]
        }
      ];
    } else if (type === 'combine' && sourceImages.length > 1) {
      // Combinaison de plusieurs images
      const imageContent = sourceImages.map((url: string) => ({
        type: "image_url",
        image_url: { url }
      }));
      
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Combine these images: ${prompt}`
            },
            ...imageContent
          ]
        }
      ];
    } else {
      throw new Error("Type de génération non supporté ou images manquantes");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"]
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
      throw new Error("Erreur lors de la génération de l'image");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("Aucune image générée");
    }

    return new Response(
      JSON.stringify({ imageUrl }),
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
