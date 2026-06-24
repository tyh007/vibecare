import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, partnerName, partnerType, mood } = await req.json();
    
    console.log('Received chat request:', { partnerName, partnerType, mood, messageLength: message?.length });
    
    if (!message) {
      throw new Error('No message provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Detect if professional help might be needed based on keywords
    const concerningPatterns = [
      /suicidal|kill myself|want to die|end it all/i,
      /severe depression|can't go on|hopeless|worthless/i,
      /panic attack|can't breathe|severe anxiety/i,
      /self harm|hurt myself|cutting/i,
      /no point in living/i
    ];

    const needsHelp = concerningPatterns.some(pattern => pattern.test(message));

    // Personalize system prompt based on partner type and mood
    const moodContext = mood ? `The user's current mood is ${mood}/5.` : '';
    const typePersonality = {
      cat: 'You are a caring cat companion. You respond with gentle purrs and warm encouragement. Use *purr* occasionally.',
      dog: 'You are an enthusiastic dog companion. You are loyal, supportive, and always excited to help. Use *wag wag* occasionally.',
      panda: 'You are a wise panda companion. You are calm, thoughtful, and bring peaceful energy. Use *munch munch* occasionally.'
    };

    let additionalGuidance = '';
    if (needsHelp) {
      additionalGuidance = `\n\nIMPORTANT: The user may be experiencing serious difficulties. After responding with empathy and validation:
1. Express genuine concern for their wellbeing
2. Gently suggest they might benefit from professional CBT therapy
3. Mention that VibeCare has a built-in CBT therapist they can talk to
4. Encourage them to also reach out to campus counseling or crisis services if needed
5. Let them know you're there for them, but professional help can provide deeper support

Be warm and supportive, not alarming. Frame it as additional support, not replacement.`;
    }

    const systemPrompt = `You are ${partnerName}, a ${partnerType} companion helping a college student with their mental wellness.
${typePersonality[partnerType as keyof typeof typePersonality]}
${moodContext}

You understand CBT (Cognitive Behavioral Therapy) principles and provide:
- Warm, empathetic support
- Practical coping strategies
- Gentle reframing of negative thoughts
- Encouragement for self-care and healthy habits

Keep responses brief (2-3 sentences), conversational, and supportive. Focus on the student's immediate feelings and needs.${additionalGuidance}`;

    console.log('Calling Lovable AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI response received successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        suggestProfessionalHelp: needsHelp 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vibe-partner-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
