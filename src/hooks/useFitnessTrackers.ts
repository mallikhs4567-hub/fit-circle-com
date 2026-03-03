import { useState, useEffect } from 'react';

interface TrackerData {
  water: number; // glasses
  steps: number;
  sleep: number; // hours
  weightLog: { date: string; value: number }[];
}

const STORAGE_KEY = 'fitcircle_trackers';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadTrackers(): Record<string, TrackerData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTrackers(data: Record<string, TrackerData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useFitnessTrackers(userWeight: number | null) {
  const today = getTodayKey();
  const [trackers, setTrackers] = useState<TrackerData>({
    water: 0,
    steps: 0,
    sleep: 0,
    weightLog: [],
  });

  useEffect(() => {
    const all = loadTrackers();
    const todayData = all[today];
    if (todayData) {
      setTrackers(todayData);
    } else {
      // Init today with weight log from profile
      const weightLog = Object.entries(all)
        .filter(([, v]) => v.weightLog?.length)
        .flatMap(([, v]) => v.weightLog)
        .slice(-7);
      
      if (userWeight && !weightLog.find(w => w.date === today)) {
        weightLog.push({ date: today, value: userWeight });
      }
      setTrackers({ water: 0, steps: 0, sleep: 0, weightLog });
    }
  }, [today, userWeight]);

  const update = (partial: Partial<TrackerData>) => {
    setTrackers(prev => {
      const next = { ...prev, ...partial };
      const all = loadTrackers();
      all[today] = next;
      saveTrackers(all);
      return next;
    });
  };

  const addWater = () => update({ water: Math.min(trackers.water + 1, 12) });
  const removeWater = () => update({ water: Math.max(trackers.water - 1, 0) });
  const setSteps = (v: number) => update({ steps: v });
  const setSleep = (v: number) => update({ sleep: v });
  const logWeight = (v: number) => {
    const log = [...trackers.weightLog.filter(w => w.date !== today), { date: today, value: v }].slice(-14);
    update({ weightLog: log });
  };

  // Get last 7 days of tracker data for heatmap
  const getWeekData = () => {
    const all = loadTrackers();
    const days: { date: string; completed: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const data = all[key];
      days.push({
        date: key,
        completed: !!(data && data.water >= 4 && data.steps >= 3000),
      });
    }
    return days;
  };

  return {
    trackers,
    addWater,
    removeWater,
    setSteps,
    setSleep,
    logWeight,
    getWeekData,
  };
}
