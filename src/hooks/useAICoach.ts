import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useAICoach() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [chatMessages, setChatMessages] = useState<CoachMessage[]>([]);

  const streamAIResponse = useCallback(async (
    type: string,
    extraMessages?: CoachMessage[],
    formData?: any,
  ): Promise<string> => {
    if (!user) return '';
    setLoading(true);
    setStreamingText('');

    // Fetch recent workouts
    const { data: workouts } = await supabase
      .from('workout_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7);

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type,
          profile: profile ? {
            experience_level: profile.experience_level,
            goal: profile.goal,
            streak: profile.streak,
            xp: profile.xp,
            weight: profile.weight,
            height: profile.height,
            gender: profile.gender,
          } : {},
          workoutHistory: workouts || [],
          formData,
          messages: extraMessages || [],
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errMsg = errData.error || `Error ${resp.status}`;
        toast({ title: 'AI Coach', description: errMsg, variant: 'destructive' });
        setLoading(false);
        return '';
      }

      if (!resp.body) {
        setLoading(false);
        return '';
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setStreamingText(fullText);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Save to logs
      await supabase.from('ai_coach_logs').insert({
        user_id: user.id,
        workout_type: type,
        ai_feedback: fullText,
        context: { profile: profile?.goal, workoutCount: workouts?.length || 0 },
      });

      setLoading(false);
      return fullText;
    } catch (err) {
      console.error('AI Coach error:', err);
      toast({ title: 'AI Coach', description: 'Failed to connect to AI coach', variant: 'destructive' });
      setLoading(false);
      return '';
    }
  }, [user, profile, toast]);

  const getInsight = useCallback((type: string, formData?: any) => {
    return streamAIResponse(type, undefined, formData);
  }, [streamAIResponse]);

  const sendChatMessage = useCallback(async (message: string) => {
    const userMsg: CoachMessage = { role: 'user', content: message };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);

    const fullText = await streamAIResponse('chat', updatedMessages);
    if (fullText) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
    }
  }, [chatMessages, streamAIResponse]);

  return {
    loading,
    streamingText,
    chatMessages,
    getInsight,
    sendChatMessage,
    setChatMessages,
  };
}
