/**
 * Generate Reply Suggestion Edge Function
 *
 * Uses OpenAI to generate a suggested reply based on the last incoming message
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

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
    const { message_content, conversation_context, platform } = await req.json();

    console.log('Generating reply suggestion for:', {
      message_content,
      platform,
      context_length: conversation_context?.length || 0,
    });

    // Build context from conversation history
    const contextMessages = (conversation_context || [])
      .map((msg: any) => `${msg.direction === 'incoming' ? 'Client' : 'Vous'}: ${msg.content}`)
      .join('\n');

    const prompt = `Tu es un assistant qui aide à rédiger des réponses professionnelles et empathiques aux messages clients.

CONTEXTE DE LA CONVERSATION:
${contextMessages}

DERNIER MESSAGE DU CLIENT:
"${message_content}"

PLATEFORME: ${platform}

Génère une réponse appropriée, professionnelle et empathique. La réponse doit être:
- Courtoise et chaleureuse
- Concise (2-3 phrases maximum)
- Adaptée à la plateforme (${platform})
- En français
- Répond directement à la question ou préoccupation du client

Réponds UNIQUEMENT avec la suggestion de réponse, sans texte supplémentaire ni formatage.`;

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
              'Tu es un assistant qui génère des suggestions de réponse professionnelles et empathiques pour le service client.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const suggestion = data.choices[0].message.content.trim();

    console.log('Generated suggestion:', suggestion);

    return new Response(JSON.stringify({ suggestion }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Error generating suggestion:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
