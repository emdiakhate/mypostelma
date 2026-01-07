/**
 * Supabase Edge Function - Process OCR
 *
 * Appelle OpenAI Vision API pour extraire les données d'une facture/devis
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper pour convertir ArrayBuffer en base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { scan_id } = await req.json();

    if (!scan_id) {
      throw new Error('scan_id requis');
    }

    console.log('Processing OCR for scan_id:', scan_id);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: scan, error: scanError } = await supabaseClient
      .from('compta_ocr_scans')
      .select('*')
      .eq('id', scan_id)
      .single();

    if (scanError || !scan) {
      console.error('Scan error:', scanError);
      throw new Error('Scan introuvable');
    }

    console.log('Scan found:', scan.file_path);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY non configurée. Veuillez ajouter votre clé API OpenAI dans les secrets.');
    }

    // Télécharger l'image depuis le storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(scan.file_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      throw new Error('Impossible de télécharger le fichier');
    }

    // Convertir en base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const mimeType = scan.file_type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log('Image converted to base64');

    const prompt = `Analysez cette image de facture ou devis et extrayez les informations au format JSON strict:

{
  "document_type": "quote" ou "invoice",
  "company_name": "nom entreprise émettrice",
  "document_number": "numéro document",
  "issue_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD ou null",
  "expiration_date": "YYYY-MM-DD ou null",
  "client_name": "nom client",
  "client_address": "adresse client",
  "subtotal": nombre HT,
  "tax_rate": taux TVA %,
  "tax_amount": montant TVA,
  "total": montant TTC,
  "currency": "XOF/EUR/USD",
  "items": [{"description": "...", "quantity": 1, "unit_price": 0, "total": 0}]
}

UNIQUEMENT le JSON, sans texte.`;

    console.log('Calling OpenAI API...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`Erreur OpenAI: ${errorData.error?.message || 'Erreur inconnue'}`);
    }

    const openaiData = await openaiResponse.json();
    const extractedText = openaiData.choices[0]?.message?.content || '';

    console.log('OpenAI response received');

    // Parser le JSON extrait
    let extractedData;
    try {
      let cleanText = extractedText.trim();
      if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
      if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
      if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);
      extractedData = JSON.parse(cleanText.trim());
    } catch (e) {
      console.error('JSON parse error:', e);
      extractedData = { raw_text: extractedText, parse_error: true };
    }

    // Score de confiance
    const requiredFields = ['document_type', 'document_number', 'issue_date', 'client_name', 'total'];
    const filledFields = requiredFields.filter(
      (field) => extractedData[field] !== null && extractedData[field] !== undefined
    );
    const confidenceScore = Math.round((filledFields.length / requiredFields.length) * 100);

    console.log('OCR complete, confidence:', confidenceScore);

    // Mettre à jour le scan
    await supabaseClient
      .from('compta_ocr_scans')
      .update({
        status: 'completed',
        extracted_data: extractedData,
        raw_text: extractedText,
        confidence_score: confidenceScore,
        processed_at: new Date().toISOString(),
      })
      .eq('id', scan_id);

    return new Response(
      JSON.stringify({
        extracted_data: extractedData,
        raw_text: extractedText,
        confidence_score: confidenceScore,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing OCR:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors du traitement OCR' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
