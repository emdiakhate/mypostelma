/**
 * AI Message Routing Edge Function
 *
 * Analyzes incoming messages and automatically assigns them to the right team
 * using OpenAI GPT-4
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { conversation_id, message_id } = await req.json();

    console.log('Analyzing message routing:', { conversation_id, message_id });

    // Get the message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', message_id)
      .single();

    if (msgError || !message) {
      throw new Error('Message not found');
    }

    // Get the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Get all teams for this user
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', conversation.user_id);

    if (teamsError) {
      throw new Error('Failed to load teams');
    }

    if (!teams || teams.length === 0) {
      console.log('No teams found, skipping routing');
      return new Response(JSON.stringify({ success: true, routed: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Analyze message with OpenAI
    const analysis = await analyzeMessageWithAI(message, conversation, teams);

    console.log('AI Analysis:', analysis);

    // Store AI analysis
    await supabase.from('message_ai_analysis').insert({
      message_id: message.id,
      conversation_id: conversation.id,
      analyzed_content: message.text_content,
      detected_intent: analysis.detected_intent,
      detected_language: analysis.detected_language,
      suggested_team_ids: analysis.suggested_team_id ? [analysis.suggested_team_id] : [],
      confidence_scores: analysis.suggested_team_id
        ? { [analysis.suggested_team_id]: analysis.confidence_score }
        : {},
      model_used: 'gpt-4',
      tokens_used: 0, // TODO: track actual tokens
      processing_time_ms: 0,
    });

    // Assign to team if confidence is high enough
    if (analysis.suggested_team_id && analysis.confidence_score >= 0.6) {
      await supabase.from('conversation_teams').upsert({
        conversation_id: conversation.id,
        team_id: analysis.suggested_team_id,
        auto_assigned: true,
        confidence_score: analysis.confidence_score,
        ai_reasoning: analysis.reasoning,
      });

      console.log('Assigned to team:', analysis.suggested_team_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        routed: !!analysis.suggested_team_id,
        team_id: analysis.suggested_team_id,
        confidence: analysis.confidence_score,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in analyze-message-routing:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

async function analyzeMessageWithAI(message: any, conversation: any, teams: any[]) {
  const startTime = Date.now();

  // Build teams description
  const teamsDescription = teams
    .map(
      (t) =>
        `- ${t.name}${t.description ? ': ' + t.description : ''} (ID: ${t.id})`
    )
    .join('\n');

  const prompt = `Analysez le message suivant et déterminez quelle équipe devrait le traiter.

ÉQUIPES DISPONIBLES:
${teamsDescription}

MESSAGE:
De: ${conversation.participant_name || conversation.participant_username || 'Inconnu'}
Plateforme: ${conversation.platform}
Contenu: "${message.text_content}"

Répondez UNIQUEMENT avec un objet JSON dans ce format exact:
{
  "team_id": "uuid-de-l-equipe" ou null si aucune équipe ne correspond,
  "confidence": 0.85 (score entre 0 et 1),
  "reasoning": "Explication courte de pourquoi cette équipe",
  "detected_intent": "recrutement" ou "support" ou "vente" etc.,
  "detected_language": "fr" ou "en" etc.
}

IMPORTANT: Ne pas inclure de texte avant ou après le JSON.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'Tu es un assistant qui analyse les messages et les route vers la bonne équipe. Réponds UNIQUEMENT avec du JSON valide, sans texte supplémentaire.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    console.log('OpenAI response:', content);

    // Parse JSON response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    const processingTime = Date.now() - startTime;

    return {
      suggested_team_id: parsed.team_id,
      confidence_score: parsed.confidence || 0,
      reasoning: parsed.reasoning || '',
      detected_intent: parsed.detected_intent,
      detected_language: parsed.detected_language,
      processing_time_ms: processingTime,
    };
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}
