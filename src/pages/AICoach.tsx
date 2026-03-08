import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAICoach } from '@/hooks/useAICoach';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription, FREE_LIMITS } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/premium/UpgradeModal';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Bot, Dumbbell, Apple, Heart, Flame, Zap, Send,
  MessageCircle, Loader2, Sparkles, Target, Battery, BrainCircuit, Crown, Lock
} from 'lucide-react';

function InsightCard({
  icon: Icon,
  title,
  description,
  color,
  onGenerate,
  loading,
  streamingText,
  activeType,
  type,
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
  onGenerate: () => void;
  loading: boolean;
  streamingText: string;
  activeType: string | null;
  type: string;
}) {
  const isActive = activeType === type;
  const showContent = isActive && streamingText;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 h-8 text-xs font-bold gap-1 rounded-lg"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading && isActive ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Generate
        </Button>
      </div>
      {showContent && (
        <div className="px-4 pb-4 pt-0">
          <div className="p-3 rounded-xl bg-secondary/80 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {streamingText}
            {loading && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-foreground'
      }`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

export default function AICoach() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { loading, streamingText, chatMessages, getInsight, sendChatMessage } = useAICoach();
  const { isPremium, checkFeatureAccess, incrementFeatureUsage, getRemainingUsage } = useSubscription();
  const [activeType, setActiveType] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingText]);

  useEffect(() => {
    getRemainingUsage('ai_coach').then(setRemaining);
  }, [getRemainingUsage, chatMessages.length]);

  const handleGenerate = async (type: string) => {
    const hasAccess = await checkFeatureAccess('ai_coach');
    if (!hasAccess) {
      setShowUpgrade(true);
      return;
    }
    setActiveType(type);
    await getInsight(type);
    await incrementFeatureUsage('ai_coach');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || loading) return;
    const hasAccess = await checkFeatureAccess('ai_coach');
    if (!hasAccess) {
      setShowUpgrade(true);
      return;
    }
    const msg = chatInput.trim();
    setChatInput('');
    setActiveType('chat');
    await sendChatMessage(msg);
    await incrementFeatureUsage('ai_coach');
  };

  const level = Math.floor((profile?.xp || 0) / 100) + 1;

  return (
    <div className="min-h-screen bg-background">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature="Unlimited AI Coach" />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                AI Coach
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Level {level} · {profile?.experience_level || 'beginner'} · {profile?.goal || 'general fitness'}
              </p>
            </div>
          </div>
          {isPremium ? (
            <PremiumBadge size="md" />
          ) : remaining !== null ? (
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              {remaining}/{FREE_LIMITS.ai_coach} left
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-10 bg-secondary rounded-xl">
            <TabsTrigger value="dashboard" className="rounded-lg text-xs font-bold gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg text-xs font-bold gap-1">
              <MessageCircle className="w-3.5 h-3.5" /> Chat
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="mt-4 space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                <Flame className="w-4 h-4 text-primary mx-auto" />
                <p className="text-lg font-black text-foreground mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {profile?.streak || 0}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Streak</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                <Zap className="w-4 h-4 text-yellow-400 mx-auto" />
                <p className="text-lg font-black text-foreground mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {profile?.xp || 0}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">XP</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                <Target className="w-4 h-4 text-green-400 mx-auto" />
                <p className="text-lg font-black text-foreground mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Lv{level}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Level</p>
              </div>
            </div>

            {/* Insight Cards */}
            <InsightCard
              icon={Dumbbell}
              title="Workout Plan"
              description="AI-generated workout tailored to your level and goals"
              color="bg-primary/20 text-primary"
              type="workout_plan"
              onGenerate={() => handleGenerate('workout_plan')}
              loading={loading}
              streamingText={streamingText}
              activeType={activeType}
            />
            <InsightCard
              icon={Heart}
              title="Post-Workout Analysis"
              description="Review your last session — intensity, recovery needs"
              color="bg-red-500/20 text-red-400"
              type="post_workout"
              onGenerate={() => handleGenerate('post_workout')}
              loading={loading}
              streamingText={streamingText}
              activeType={activeType}
            />
            <InsightCard
              icon={Bot}
              title="Form Feedback"
              description="AI analysis of your exercise form and corrections"
              color="bg-blue-500/20 text-blue-400"
              type="form_feedback"
              onGenerate={() => handleGenerate('form_feedback')}
              loading={loading}
              streamingText={streamingText}
              activeType={activeType}
            />
            <InsightCard
              icon={Battery}
              title="Recovery Advice"
              description="Rest, stretching, and recovery recommendations"
              color="bg-purple-500/20 text-purple-400"
              type="recovery"
              onGenerate={() => handleGenerate('recovery')}
              loading={loading}
              streamingText={streamingText}
              activeType={activeType}
            />
            <InsightCard
              icon={Apple}
              title="Diet Suggestions"
              description="Nutrition, protein targets, and meal ideas"
              color="bg-green-500/20 text-green-400"
              type="diet"
              onGenerate={() => handleGenerate('diet')}
              loading={loading}
              streamingText={streamingText}
              activeType={activeType}
            />
            <InsightCard
              icon={Flame}
              title="Daily Motivation"
              description="Personalized motivation and today's challenge"
              color="bg-orange-500/20 text-orange-400"
              type="motivation"
              onGenerate={() => handleGenerate('motivation')}
              loading={loading}
              streamingText={streamingText}
              activeType={activeType}
            />
          </TabsContent>

          {/* CHAT TAB */}
          <TabsContent value="chat" className="mt-4">
            <div className="h-[55vh] overflow-y-auto space-y-3 mb-3 pr-1">
              {chatMessages.length === 0 && !loading && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
                    <BrainCircuit className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Ask your AI Coach anything</p>
                  <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                    Workout advice, form tips, nutrition, recovery — I'm here to help you crush your goals.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {['What should I train today?', 'How much protein do I need?', 'Am I overtraining?'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setChatInput(q); }}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground/80 hover:bg-secondary/80 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <ChatBubble key={i} role={m.role} content={m.content} />
              ))}
              {loading && activeType === 'chat' && streamingText && (
                <ChatBubble role="assistant" content={streamingText} />
              )}
              {loading && activeType === 'chat' && !streamingText && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-secondary">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask your AI Coach..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                maxLength={500}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              />
              <Button size="icon" className="shrink-0" onClick={handleSendChat} disabled={loading || !chatInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
