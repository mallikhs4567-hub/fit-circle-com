import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  // joined from profiles
  username?: string;
  avatar_url?: string | null;
}

export function useActivities(limit = 20) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('activities' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
      return;
    }

    const items = (data || []) as any[];
    if (items.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(items.map((a: any) => a.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    const enriched: Activity[] = items.map((a: any) => {
      const profile = profileMap.get(a.user_id);
      return {
        ...a,
        username: profile?.username || 'User',
        avatar_url: profile?.avatar_url || null,
      };
    });

    setActivities(enriched);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime
    const channel = supabase
      .channel('activities-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        async (payload) => {
          const newItem = payload.new as any;
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url')
            .eq('user_id', newItem.user_id)
            .limit(1);

          const profile = profiles?.[0];
          const enriched: Activity = {
            ...newItem,
            username: profile?.username || 'User',
            avatar_url: profile?.avatar_url || null,
          };

          setActivities((prev) => [enriched, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivities, limit]);

  return { activities, loading, refetch: fetchActivities };
}
