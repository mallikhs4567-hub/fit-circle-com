import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, DailyChecklist, CirclePost, ChatThread, FitnessGoal } from '@/types';

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  dailyChecklist: DailyChecklist | null;
  setDailyChecklist: (checklist: DailyChecklist | null) => void;
  posts: CirclePost[];
  setPosts: (posts: CirclePost[]) => void;
  chatThreads: ChatThread[];
  setChatThreads: (threads: ChatThread[]) => void;
  updateStreak: (completed: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Demo data
const demoUser: UserProfile = {
  id: '1',
  username: 'fituser',
  email: 'demo@fitcircle.app',
  streak: 7,
  totalActiveDays: 23,
  goal: 'weight-loss',
  height: 170,
  weight: 70,
  gender: 'male',
  createdAt: new Date(),
};

const demoPosts: CirclePost[] = [
  {
    id: '1',
    userId: '2',
    username: 'maya_fit',
    content: 'Day 12 streak 🔥 Morning yoga done!',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
    reactions: { heart: 5, fire: 12, clap: 3 },
  },
  {
    id: '2',
    userId: '3',
    username: 'rahul_gains',
    content: 'Workout done ✅ Push day complete!',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000),
    reactions: { heart: 8, fire: 15, clap: 7 },
  },
  {
    id: '3',
    userId: '4',
    username: 'priya.wellness',
    content: 'Clean eating day 5 💪 Feeling amazing!',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000),
    reactions: { heart: 12, fire: 6, clap: 9 },
  },
];

const demoChats: ChatThread[] = [
  {
    id: '1',
    participantId: '2',
    participantName: 'maya_fit',
    lastMessage: 'Keep it up! 💪',
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 2,
  },
  {
    id: '2',
    participantId: '3',
    participantName: 'rahul_gains',
    lastMessage: 'What workout are you doing today?',
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [dailyChecklist, setDailyChecklist] = useState<DailyChecklist | null>(null);
  const [posts, setPosts] = useState<CirclePost[]>(demoPosts);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(demoChats);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('fitcircle_user');
    const storedOnboarded = localStorage.getItem('fitcircle_onboarded');
    const storedChecklist = localStorage.getItem('fitcircle_checklist');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedOnboarded === 'true') {
      setIsOnboarded(true);
    }
    if (storedChecklist) {
      const checklist = JSON.parse(storedChecklist);
      const today = new Date().toISOString().split('T')[0];
      if (checklist.date === today) {
        setDailyChecklist(checklist);
      }
    }
  }, []);

  // Persist user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('fitcircle_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fitcircle_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('fitcircle_onboarded', isOnboarded.toString());
  }, [isOnboarded]);

  useEffect(() => {
    if (dailyChecklist) {
      localStorage.setItem('fitcircle_checklist', JSON.stringify(dailyChecklist));
    }
  }, [dailyChecklist]);

  const updateStreak = (completed: boolean) => {
    if (!user) return;
    
    if (completed) {
      setUser({
        ...user,
        streak: user.streak + 1,
        totalActiveDays: user.totalActiveDays + 1,
      });
    } else {
      setUser({
        ...user,
        streak: 0,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        isOnboarded,
        setIsOnboarded,
        dailyChecklist,
        setDailyChecklist,
        posts,
        setPosts,
        chatThreads,
        setChatThreads,
        updateStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
