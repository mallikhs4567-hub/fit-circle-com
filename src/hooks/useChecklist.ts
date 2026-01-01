import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DailyChecklist {
  id: string;
  user_id: string;
  date: string;
  workout_completed: boolean;
  diet_followed: boolean;
  completed_at: string | null;
  created_at: string;
}

export function useChecklist() {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchChecklist = async () => {
    if (!user) {
      setChecklist(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('daily_checklists')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error fetching checklist:', error);
      setLoading(false);
      return;
    }

    if (!data) {
      // Create today's checklist
      const { data: newChecklist, error: createError } = await supabase
        .from('daily_checklists')
        .insert({
          user_id: user.id,
          date: today,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating checklist:', createError);
      } else {
        setChecklist(newChecklist as DailyChecklist);
      }
    } else {
      setChecklist(data as DailyChecklist);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchChecklist();
  }, [user, today]);

  const updateChecklist = async (type: 'workout' | 'diet') => {
    if (!user || !checklist) return;

    const field = type === 'workout' ? 'workout_completed' : 'diet_followed';
    const newValue = !checklist[field];

    const updates: Partial<DailyChecklist> = {
      [field]: newValue,
    };

    // Check if both are now completed
    const otherField = type === 'workout' ? 'diet_followed' : 'workout_completed';
    const bothCompleted = newValue && checklist[otherField];
    
    if (bothCompleted) {
      updates.completed_at = new Date().toISOString();
      
      // Update streak in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('streak, total_active_days')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            streak: profile.streak + 1,
            total_active_days: profile.total_active_days + 1,
          })
          .eq('user_id', user.id);
        
        toast.success('🔥 Day complete! Streak updated!');
      }
    }

    const { data, error } = await supabase
      .from('daily_checklists')
      .update(updates)
      .eq('id', checklist.id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update checklist');
      return { error };
    }

    setChecklist(data as DailyChecklist);
    return { data, error: null };
  };

  return {
    checklist,
    loading,
    updateChecklist,
    refetch: fetchChecklist,
  };
}
