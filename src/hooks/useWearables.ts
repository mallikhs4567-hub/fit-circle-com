import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface WearableDevice {
  id: string;
  user_id: string;
  device_name: string;
  provider: string;
  last_sync_at: string | null;
  is_connected: boolean;
  connected_at: string;
}

export interface WearableActivity {
  id: string;
  user_id: string;
  device_id: string | null;
  steps: number;
  calories: number;
  heart_rate: number | null;
  distance: number;
  sleep_minutes: number | null;
  workout_type: string | null;
  workout_duration_minutes: number | null;
  recorded_at: string;
  synced_at: string;
}

const PROVIDERS = [
  { id: 'apple_watch', name: 'Apple Watch', icon: '⌚', brand: 'Apple' },
  { id: 'fitbit', name: 'Fitbit Charge', icon: '📟', brand: 'Fitbit' },
  { id: 'garmin', name: 'Garmin Forerunner', icon: '🏃', brand: 'Garmin' },
] as const;

// Simulated data generation for mock sync
function generateMockActivity(userId: string, deviceId: string, provider: string): Omit<WearableActivity, 'id' | 'synced_at'> {
  const now = new Date();
  const baseSteps = provider === 'garmin' ? 12000 : provider === 'fitbit' ? 9500 : 8000;
  const baseCal = provider === 'garmin' ? 650 : provider === 'fitbit' ? 520 : 480;
  const baseHR = 68 + Math.floor(Math.random() * 15);
  const baseDist = provider === 'garmin' ? 8.5 : provider === 'fitbit' ? 6.2 : 5.8;

  return {
    user_id: userId,
    device_id: deviceId,
    steps: baseSteps + Math.floor(Math.random() * 3000),
    calories: baseCal + Math.floor(Math.random() * 200),
    heart_rate: baseHR,
    distance: parseFloat((baseDist + Math.random() * 3).toFixed(1)),
    sleep_minutes: 360 + Math.floor(Math.random() * 120),
    workout_type: ['running', 'strength', 'cycling', 'walking'][Math.floor(Math.random() * 4)],
    workout_duration_minutes: 30 + Math.floor(Math.random() * 45),
    recorded_at: now.toISOString(),
  };
}

export function useWearables() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [todayActivity, setTodayActivity] = useState<WearableActivity | null>(null);
  const [recentActivity, setRecentActivity] = useState<WearableActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wearable_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false });
    setDevices((data as WearableDevice[]) || []);
  }, [user]);

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayData } = await supabase
      .from('wearable_activity')
      .select('*')
      .eq('user_id', user.id)
      .gte('recorded_at', todayStart.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(1);

    setTodayActivity(todayData?.[0] as WearableActivity | null);

    const { data: recent } = await supabase
      .from('wearable_activity')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(7);

    setRecentActivity((recent as WearableActivity[]) || []);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDevices(), fetchActivity()]).finally(() => setLoading(false));
  }, [fetchDevices, fetchActivity]);

  const connectDevice = async (provider: string) => {
    if (!user) return;
    const providerInfo = PROVIDERS.find(p => p.id === provider);
    if (!providerInfo) return;

    const { error } = await supabase.from('wearable_devices').insert({
      user_id: user.id,
      device_name: providerInfo.name,
      provider,
      is_connected: true,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already connected', description: `${providerInfo.name} is already linked.` });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Device connected!', description: `${providerInfo.name} linked successfully. Syncing data...` });
    await fetchDevices();

    // Auto-sync after connect
    const { data: newDevice } = await supabase
      .from('wearable_devices')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();
    if (newDevice) {
      await syncDevice(newDevice.id, provider);
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    if (!user) return;
    await supabase.from('wearable_devices').delete().eq('id', deviceId).eq('user_id', user.id);
    toast({ title: 'Device disconnected' });
    await fetchDevices();
    await fetchActivity();
  };

  const syncDevice = async (deviceId: string, provider: string) => {
    if (!user) return;
    setSyncing(deviceId);

    // Simulate sync delay
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    const mockData = generateMockActivity(user.id, deviceId, provider);
    await supabase.from('wearable_activity').insert(mockData as any);
    await supabase
      .from('wearable_devices')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', deviceId);

    toast({ title: 'Sync complete!', description: `${mockData.steps.toLocaleString()} steps, ${mockData.calories} cal imported` });
    setSyncing(null);
    await fetchDevices();
    await fetchActivity();
  };

  return {
    devices,
    todayActivity,
    recentActivity,
    loading,
    syncing,
    connectDevice,
    disconnectDevice,
    syncDevice,
    providers: PROVIDERS,
    refetch: () => { fetchDevices(); fetchActivity(); },
  };
}
