export type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'healthy-routine';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  goal?: FitnessGoal;
  height?: number;
  weight?: number;
  gender?: 'male' | 'female' | 'other';
  streak: number;
  totalActiveDays: number;
  createdAt: Date;
}

export interface DailyChecklist {
  date: string;
  workoutCompleted: boolean;
  dietFollowed: boolean;
}

export interface CirclePost {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  image?: string;
  createdAt: Date;
  expiresAt: Date;
  reactions: {
    heart: number;
    fire: number;
    clap: number;
  };
  userReaction?: 'heart' | 'fire' | 'clap';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface ChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

export interface FitnessPlan {
  goal: FitnessGoal;
  workout: string[];
  diet: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
}
