/**
 * Supabase Edge Function - Process OCR
 *
 * Appelle OpenAI Vision API pour extraire les données d'une facture/devis
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { scan_id } = await req.json();

    if (!scan_id) {
      throw new Error('scan_id requis');
    }

    // Créer client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Récupérer le scan
    const { data: scan, error: scanError } = await supabaseClient
      .from('compta_ocr_scans')
      .select('*')
      .eq('id', scan_id)
      .single();

    if (scanError || !scan) {
      throw new Error('Scan introuvable');
    }

    // Appeler OpenAI Vision API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY non configurée');
    }

    const prompt = `
Vous êtes un assistant spécialisé dans l'extraction de données de factures et devis.

Analysez cette image de facture ou devis et extrayez les informations suivantes au format JSON:

{
  "document_type": "quote" ou "invoice",
  "company_name": "nom de l'entreprise émettrice",
  "document_number": "numéro du document (ex: FAC-2024-001, DEV-123)",
  "issue_date": "date d'émission (format ISO YYYY-MM-DD)",
  "due_date": "date d'échéance (format ISO YYYY-MM-DD)" // pour facture uniquement,
  "expiration_date": "date d'expiration (format ISO YYYY-MM-DD)" // pour devis uniquement,
  "client_name": "nom du client",
  "client_address": "adresse du client",
  "subtotal": montant HT (nombre),
  "tax_rate": taux de TVA en pourcentage (nombre),
  "tax_amount": montant de la TVA (nombre),
  "total": montant total TTC (nombre),
  "currency": "XOF, EUR, USD, etc.",
  "items": [
    {
      "description": "description du produit/service",
      "quantity": quantité (nombre),
      "unit_price": prix unitaire (nombre),
      "total": montant total ligne (nombre)
    }
  ]
}

Répondez UNIQUEMENT avec le JSON, sans texte supplémentaire.
Si vous ne pouvez pas extraire une information, mettez null.
Soyez précis avec les nombres (pas de formatage, juste le nombre).
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Modèle avec vision
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: scan.file_url,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.2, // Faible température pour plus de précision
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const openaiData = await openaiResponse.json();
    const extractedText = openaiData.choices[0]?.message?.content || '';

    // Parser le JSON extrait
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (e) {
      // Si le parsing échoue, retourner le texte brut
      extractedData = { raw_text: extractedText };
    }

    // Calculer un score de confiance basé sur les champs remplis
    const requiredFields = [
      'document_type',
      'document_number',
      'issue_date',
      'client_name',
      'total',
    ];
    const filledFields = requiredFields.filter(
      (field) => extractedData[field] !== null && extractedData[field] !== undefined
    );
    const confidenceScore = Math.round((filledFields.length / requiredFields.length) * 100);

    return new Response(
      JSON.stringify({
        extracted_data: extractedData,
        raw_text: extractedText,
        confidence_score: confidenceScore,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error processing OCR:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur lors du traitement OCR',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
