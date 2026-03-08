import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { type, profile, workoutHistory, formData, messages } = await req.json();

    const systemPrompt = buildSystemPrompt(type, profile, workoutHistory, formData);

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    // If no user message provided, add a default request
    if (!messages || messages.length === 0) {
      aiMessages.push({ role: "user", content: getDefaultPrompt(type) });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildSystemPrompt(type: string, profile: any, workoutHistory: any[], formData: any): string {
  const base = `You are FitCircle AI Coach — a world-class personal fitness coach. You speak in a motivating, concise, and actionable way. Use emojis sparingly for energy. Keep responses focused and practical.

USER PROFILE:
- Level: ${profile?.experience_level || 'beginner'}
- Goal: ${profile?.goal || 'general fitness'}
- Streak: ${profile?.streak || 0} days
- XP: ${profile?.xp || 0}
- Weight: ${profile?.weight ? profile.weight + 'kg' : 'not set'}
- Height: ${profile?.height ? profile.height + 'cm' : 'not set'}
- Gender: ${profile?.gender || 'not specified'}`;

  const history = workoutHistory?.length
    ? `\n\nRECENT WORKOUTS (last 7):\n${workoutHistory.map((w: any) => `- ${w.exercise_name}: ${w.reps_completed} reps, form ${w.avg_form_score}/100, ${w.calories_burned} cal`).join('\n')}`
    : '\n\nNo recent workout data available.';

  switch (type) {
    case 'workout_plan':
      return `${base}${history}\n\nGenerate a personalized workout plan. Include exercises, sets, reps, and rest times. Format with clear sections using markdown headers. Tailor to their level and goal.`;

    case 'post_workout':
      return `${base}${history}\n\nAnalyze the user's most recent workout. Cover: muscle groups trained, intensity assessment, recovery recommendations, and what to train next. Be specific and encouraging.`;

    case 'form_feedback':
      const formInfo = formData ? `\nFORM DATA: Exercise: ${formData.exercise}, Form Score: ${formData.formScore}/100, Issues: ${formData.issues?.join(', ') || 'none detected'}` : '';
      return `${base}${formInfo}\n\nProvide specific form correction advice. Be constructive and explain the biomechanics briefly. Suggest drills to improve.`;

    case 'motivation':
      return `${base}${history}\n\nGenerate a short, powerful motivational message personalized to their streak, recent activity, and goals. Include a specific actionable challenge for today.`;

    case 'diet':
      return `${base}${history}\n\nProvide diet recommendations based on their goal and recent workout intensity. Include: protein target, hydration, calorie suggestion, and a simple meal idea. Be practical.`;

    case 'recovery':
      return `${base}${history}\n\nAnalyze recovery needs based on recent workouts. Recommend rest/active recovery, stretching, sleep advice. Be specific about which muscle groups need recovery.`;

    case 'chat':
      return `${base}${history}\n\nYou are having a conversation with the user about fitness. Answer their questions with expert knowledge. Keep answers concise but thorough.`;

    default:
      return `${base}${history}\n\nProvide a helpful daily fitness insight tailored to the user.`;
  }
}

function getDefaultPrompt(type: string): string {
  switch (type) {
    case 'workout_plan': return 'Create my personalized workout plan for today.';
    case 'post_workout': return 'Analyze my last workout and give me feedback.';
    case 'form_feedback': return 'Review my exercise form and suggest improvements.';
    case 'motivation': return 'Give me motivation for today.';
    case 'diet': return 'What should I eat today based on my training?';
    case 'recovery': return 'What recovery do I need right now?';
    default: return 'Give me my daily fitness coaching insight.';
  }
}
