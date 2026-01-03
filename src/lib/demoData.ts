// Demo data for showcasing the app without requiring database entries
import workoutImg from '@/assets/demo/workout-1.jpg';
import mealImg from '@/assets/demo/meal-1.jpg';
import runImg from '@/assets/demo/run-1.jpg';
import yogaImg from '@/assets/demo/yoga-1.jpg';

export interface DemoPost {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  image_url: string | null;
  reactions: { heart: number; fire: number; clap: number };
  userReaction: 'heart' | 'fire' | 'clap' | null;
  created_at: string;
  expires_at: string;
}

export interface DemoFriend {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  streak: number;
}

export interface DemoChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface DemoChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

// Helper to create timestamps
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

// Demo posts with realistic fitness content
export const demoPosts: DemoPost[] = [
  {
    id: 'demo-post-1',
    user_id: 'demo-user-1',
    username: 'fitness_priya',
    avatar_url: null,
    content: "Just crushed my morning workout! 💪 30 mins of HIIT and feeling amazing. Who else is on their fitness journey?",
    image_url: workoutImg,
    reactions: { heart: 12, fire: 8, clap: 5 },
    userReaction: null,
    created_at: hoursAgo(2),
    expires_at: hoursFromNow(22),
  },
  {
    id: 'demo-post-2',
    user_id: 'demo-user-2',
    username: 'muscle_rahul',
    avatar_url: null,
    content: "Meal prep Sunday! Keeping it clean with dal, roti, and lots of veggies. Consistency is key 🔑",
    image_url: mealImg,
    reactions: { heart: 18, fire: 6, clap: 9 },
    userReaction: 'heart',
    created_at: hoursAgo(4),
    expires_at: hoursFromNow(20),
  },
  {
    id: 'demo-post-3',
    user_id: 'demo-user-3',
    username: 'runner_vikram',
    avatar_url: null,
    content: "5K done before sunrise! There's something magical about morning runs. Day 7 streak going strong! 🏃‍♂️",
    image_url: runImg,
    reactions: { heart: 24, fire: 15, clap: 11 },
    userReaction: 'fire',
    created_at: hoursAgo(6),
    expires_at: hoursFromNow(18),
  },
  {
    id: 'demo-post-4',
    user_id: 'demo-user-4',
    username: 'yoga_anita',
    avatar_url: null,
    content: "Morning yoga session complete. 42 day streak! Remember - progress, not perfection 🧘‍♀️",
    image_url: yogaImg,
    reactions: { heart: 31, fire: 12, clap: 18 },
    userReaction: null,
    created_at: hoursAgo(8),
    expires_at: hoursFromNow(16),
  },
  {
    id: 'demo-post-5',
    user_id: 'demo-user-1',
    username: 'fitness_priya',
    avatar_url: null,
    content: "Small wins matter! Chose stairs over elevator today. Every step counts on this journey! 🚀",
    image_url: null,
    reactions: { heart: 8, fire: 4, clap: 6 },
    userReaction: 'clap',
    created_at: hoursAgo(10),
    expires_at: hoursFromNow(14),
  },
  {
    id: 'demo-post-6',
    user_id: 'demo-user-2',
    username: 'muscle_rahul',
    avatar_url: null,
    content: "Rest day but staying active with a light walk. Recovery is part of the process! 🚶",
    image_url: null,
    reactions: { heart: 6, fire: 2, clap: 3 },
    userReaction: null,
    created_at: hoursAgo(12),
    expires_at: hoursFromNow(12),
  },
];

// Demo friends
export const demoFriends: DemoFriend[] = [
  { id: 'demo-friend-1', user_id: 'demo-user-1', username: 'fitness_priya', avatar_url: null, streak: 21 },
  { id: 'demo-friend-2', user_id: 'demo-user-2', username: 'muscle_rahul', avatar_url: null, streak: 14 },
  { id: 'demo-friend-3', user_id: 'demo-user-3', username: 'runner_vikram', avatar_url: null, streak: 7 },
  { id: 'demo-friend-4', user_id: 'demo-user-4', username: 'yoga_anita', avatar_url: null, streak: 42 },
];

// Demo chat threads
export const demoChatThreads: DemoChatThread[] = [
  {
    id: 'demo-thread-1',
    participantId: 'demo-user-1',
    participantName: 'fitness_priya',
    participantAvatar: null,
    lastMessage: "We're in this together! Keep it up!",
    lastMessageTime: hoursAgo(1),
    unreadCount: 2,
  },
  {
    id: 'demo-thread-2',
    participantId: 'demo-user-2',
    participantName: 'muscle_rahul',
    participantAvatar: null,
    lastMessage: "Bro, what's your workout routine?",
    lastMessageTime: hoursAgo(3),
    unreadCount: 1,
  },
  {
    id: 'demo-thread-3',
    participantId: 'demo-user-4',
    participantName: 'yoga_anita',
    participantAvatar: null,
    lastMessage: "Your streak is growing! Proud of you 🌟",
    lastMessageTime: hoursAgo(5),
    unreadCount: 0,
  },
];

// Demo messages for each thread
export const demoChatMessagesMap: Record<string, DemoChatMessage[]> = {
  'demo-user-1': [
    { id: 'msg-1', senderId: 'demo-user-1', receiverId: 'current', content: "Hey! Saw your post, amazing progress!", createdAt: hoursAgo(3), isOwn: false },
    { id: 'msg-2', senderId: 'current', receiverId: 'demo-user-1', content: "Thanks! Your consistency is inspiring 💪", createdAt: hoursAgo(2), isOwn: true },
    { id: 'msg-3', senderId: 'demo-user-1', receiverId: 'current', content: "We're in this together! Keep it up!", createdAt: hoursAgo(1), isOwn: false },
  ],
  'demo-user-2': [
    { id: 'msg-4', senderId: 'demo-user-2', receiverId: 'current', content: "Bro, what's your workout routine?", createdAt: hoursAgo(3), isOwn: false },
    { id: 'msg-5', senderId: 'current', receiverId: 'demo-user-2', content: "Mostly home workouts - push pull legs split", createdAt: hoursAgo(2.5), isOwn: true },
  ],
  'demo-user-4': [
    { id: 'msg-6', senderId: 'demo-user-4', receiverId: 'current', content: "Love seeing your progress! 🙌", createdAt: hoursAgo(8), isOwn: false },
    { id: 'msg-7', senderId: 'current', receiverId: 'demo-user-4', content: "Thanks! Your yoga posts are so calming", createdAt: hoursAgo(7), isOwn: true },
    { id: 'msg-8', senderId: 'demo-user-4', receiverId: 'current', content: "Your streak is growing! Proud of you 🌟", createdAt: hoursAgo(5), isOwn: false },
  ],
};

// Pending friend requests for demo
export const demoPendingRequests = [
  { id: 'demo-pending-1', user_id: 'demo-user-5', username: 'healthy_amit', avatar_url: null, streak: 5 },
];
