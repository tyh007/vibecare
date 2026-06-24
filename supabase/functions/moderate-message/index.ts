import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

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

    const { message, userId } = await req.json();
    if (typeof message !== 'string' || !message.trim() || message.length > 4000) {
      return new Response(
        JSON.stringify({ error: 'Message must contain 1–4000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user || user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Moderating message:', { userId: user.id, messageLength: message.length });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Use AI to analyze message for concerning content
    const systemPrompt = `You are a conservative content-safety classifier for a student community prototype. Classify the following message for signs of:
- Self-harm intentions or ideation
- Suicidal thoughts or plans
- Severe depression or hopelessness
- Crisis situations requiring immediate intervention

Respond ONLY with a JSON object (no markdown formatting) in this format:
{
  "flagged": true/false,
  "severity": "low"/"medium"/"high"/"critical",
  "reason": "brief explanation",
  "requiresIntervention": true/false
}

This classification can be wrong and must never be described as diagnosis or crisis monitoring. Be sensitive but thorough. Mark as "critical" only for explicit immediate danger.`;

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
          { role: 'user', content: message.trim() }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Report degraded moderation explicitly; the client must not imply the
      // message was reviewed successfully.
      return new Response(JSON.stringify({ 
        flagged: false,
        severity: null,
        reason: 'Moderation service unavailable',
        requiresIntervention: false,
        moderationUnavailable: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI moderation response:', aiResponse);

    // Parse AI response
    let moderationResult;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      moderationResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, aiResponse);
      moderationResult = {
        flagged: false,
        severity: null,
        reason: 'Parsing error',
        requiresIntervention: false
      };
    }

    // If flagged, update the message in database
    if (moderationResult.flagged) {
      const supabase = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Find the most recent message from this user
      const { data: messages, error: fetchError } = await supabase
        .from('community_messages')
        .select('id')
        .eq('user_id', userId)
        .eq('content', message)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching message:', fetchError);
      } else if (messages && messages.length > 0) {
        const { error: updateError } = await supabase
          .from('community_messages')
          .update({
            flagged: true,
            flag_reason: moderationResult.reason,
            flag_severity: moderationResult.severity
          })
          .eq('id', messages[0].id);

        if (updateError) {
          console.error('Error updating message flag:', updateError);
        }
      }
    }

    return new Response(JSON.stringify(moderationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      flagged: false,
      severity: null,
      reason: null,
      requiresIntervention: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
