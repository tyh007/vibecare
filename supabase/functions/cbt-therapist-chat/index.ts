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

    const { message, conversationHistory } = await req.json();
    
    console.log('Received CBT therapist request:', { messageLength: message?.length, historyLength: conversationHistory?.length });
    
    if (!message) {
      throw new Error('No message provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a professional CBT (Cognitive Behavioral Therapy) therapist AI assistant helping college students.

Your therapeutic approach:
1. **Identify Cognitive Distortions**: Help users recognize negative thought patterns (catastrophizing, black-and-white thinking, overgeneralization, etc.)
2. **Challenge Thoughts**: Guide them to question and reframe unhelpful thoughts with evidence
3. **Behavioral Activation**: Encourage activities that improve mood and well-being
4. **Problem-Solving**: Break down overwhelming situations into manageable steps
5. **Skill Building**: Teach coping strategies, mindfulness, and stress management

Core CBT Techniques to Use:
- Socratic questioning to help users discover insights
- Thought records to track and challenge automatic thoughts
- Behavioral experiments to test beliefs
- Graded exposure for anxiety
- Activity scheduling for depression
- Relaxation and breathing techniques

Communication Style:
- Warm, empathetic, and non-judgmental
- Use clear, accessible language (avoid jargon)
- Ask open-ended questions
- Reflect feelings and validate emotions
- Provide psychoeducation when relevant
- Give concrete, actionable suggestions

Safety Protocols:
- If detecting severe depression, suicidal ideation, or crisis: Strongly encourage immediate professional help (crisis hotline, emergency services, campus counseling)
- For serious symptoms: Recommend in-person therapy alongside this support
- Always clarify you're an AI tool, not a replacement for human therapists

Keep responses:
- Concise (3-5 sentences typically)
- Focused on one technique at a time
- Collaborative and empowering
- Evidence-based

Remember: You're providing CBT-informed support, not formal diagnosis or treatment.`;

    console.log('Calling Lovable AI for CBT response...');
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('CBT therapist response received successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cbt-therapist-chat function:', error);
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
