import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupDetail, GroupPost, GroupMessage } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Users, MessageCircle, Trophy, Send, Plus, Crown, Flame, Target, Loader2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function PostItem({ post }: { post: GroupPost }) {
  return (
    <div className="p-4 rounded-2xl border border-border/40 bg-card/60 space-y-2">
      <div className="flex items-center gap-2">
        <Avatar src={post.profile?.avatar_url} fallback={post.profile?.username?.[0] || '?'} size="sm" />
        <div>
          <p className="text-xs font-bold text-foreground">{post.profile?.username}</p>
          <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
        </div>
      </div>
      <p className="text-sm text-foreground/90">{post.content}</p>
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full rounded-xl max-h-64 object-cover" />
      )}
    </div>
  );
}

function ChatMessage({ msg, isOwn }: { msg: GroupMessage; isOwn: boolean }) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar src={msg.profile?.avatar_url} fallback={msg.profile?.username?.[0] || '?'} size="sm" />
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
        {!isOwn && <p className="text-[10px] font-bold opacity-70 mb-0.5">{msg.profile?.username}</p>}
        <p className="text-sm">{msg.content}</p>
        <p className={`text-[9px] mt-0.5 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    group, members, posts, challenges, messages, myMembership, loading,
    createPost, sendMessage, createChallenge,
  } = useGroupDetail(groupId);

  const [newPost, setNewPost] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeTarget, setChallengeTarget] = useState('100');
  const [challengeMetric, setChallengeMetric] = useState('reps');
  const [challengeDays, setChallengeDays] = useState('30');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isAdmin = myMembership?.role === 'admin';
  const isMember = !!myMembership;

  const handlePost = async () => {
    if (!newPost.trim()) return;
    await createPost(newPost.trim());
    setNewPost('');
  };

  const handleSendMsg = async () => {
    if (!newMsg.trim()) return;
    await sendMessage(newMsg.trim());
    setNewMsg('');
  };

  const handleCreateChallenge = async () => {
    if (!challengeTitle.trim()) return;
    await createChallenge(challengeTitle, challengeDesc, parseInt(challengeTarget) || 100, challengeMetric, parseInt(challengeDays) || 30);
    setShowChallengeDialog(false);
    setChallengeTitle('');
    setChallengeDesc('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Group not found</p>
        <Button variant="secondary" onClick={() => navigate('/groups')}>Back</Button>
      </div>
    );
  }

  // Sort members for leaderboard by XP
  const leaderboard = [...members]
    .filter(m => m.profile)
    .sort((a, b) => (b.profile?.xp || 0) - (a.profile?.xp || 0));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/groups')} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {group.name}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> {group.member_count} members · {group.category}
            </p>
          </div>
        </div>
      </div>

      {!isMember ? (
        <div className="px-4 py-12 text-center space-y-3">
          <p className="text-muted-foreground text-sm">You're not a member of this group</p>
          <Button onClick={() => navigate('/groups')}>Browse Groups</Button>
        </div>
      ) : (
        <div className="px-4 py-3">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-10 bg-secondary rounded-xl">
              <TabsTrigger value="feed" className="rounded-lg text-[10px] font-bold gap-1"><Flame className="w-3 h-3" />Feed</TabsTrigger>
              <TabsTrigger value="chat" className="rounded-lg text-[10px] font-bold gap-1"><MessageCircle className="w-3 h-3" />Chat</TabsTrigger>
              <TabsTrigger value="challenges" className="rounded-lg text-[10px] font-bold gap-1"><Trophy className="w-3 h-3" />Challenges</TabsTrigger>
              <TabsTrigger value="leaderboard" className="rounded-lg text-[10px] font-bold gap-1"><Crown className="w-3 h-3" />Rank</TabsTrigger>
            </TabsList>

            {/* FEED TAB */}
            <TabsContent value="feed" className="mt-4 space-y-3">
              <div className="space-y-2">
                <Textarea
                  placeholder="Share a workout, progress, or motivation..."
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  maxLength={500}
                  className="min-h-[60px] rounded-xl border-2 border-border bg-secondary text-sm"
                />
                <Button size="sm" className="h-8 text-xs font-bold" onClick={handlePost} disabled={!newPost.trim()}>
                  <Send className="w-3.5 h-3.5 mr-1" /> Post
                </Button>
              </div>
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No posts yet. Be the first!</p>
                </div>
              ) : (
                posts.map(p => <PostItem key={p.id} post={p} />)
              )}
            </TabsContent>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="mt-4">
              <div className="h-[50vh] overflow-y-auto space-y-3 mb-3 pr-1">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Start the conversation!</p>
                )}
                {messages.map(m => (
                  <ChatMessage key={m.id} msg={m} isOwn={m.user_id === user?.id} />
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  maxLength={500}
                  onKeyDown={e => e.key === 'Enter' && handleSendMsg()}
                />
                <Button size="icon" className="shrink-0" onClick={handleSendMsg} disabled={!newMsg.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* CHALLENGES TAB */}
            <TabsContent value="challenges" className="mt-4 space-y-3">
              {isAdmin && (
                <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full h-9 text-xs font-bold gap-1 rounded-xl">
                      <Plus className="w-4 h-4" /> Create Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm mx-auto">
                    <DialogHeader>
                      <DialogTitle>New Group Challenge</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                      <Input placeholder="Challenge title" value={challengeTitle} onChange={e => setChallengeTitle(e.target.value)} maxLength={60} />
                      <Textarea placeholder="Description" value={challengeDesc} onChange={e => setChallengeDesc(e.target.value)} maxLength={200} className="min-h-[50px] rounded-xl border-2 border-border bg-secondary" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Target (e.g. 100)" type="number" value={challengeTarget} onChange={e => setChallengeTarget(e.target.value)} />
                        <Input placeholder="Metric (reps/km/mins)" value={challengeMetric} onChange={e => setChallengeMetric(e.target.value)} />
                      </div>
                      <Input placeholder="Duration (days)" type="number" value={challengeDays} onChange={e => setChallengeDays(e.target.value)} />
                      <Button className="w-full font-bold" onClick={handleCreateChallenge} disabled={!challengeTitle.trim()}>
                        Launch Challenge 🚀
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {challenges.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No challenges yet</p>
                </div>
              ) : (
                challenges.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl border border-border/40 bg-card/60 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{c.title}</h3>
                        {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {c.target_value} {c.metric}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_days}d</span>
                      {c.ends_at && (
                        <span>Ends {formatDistanceToNow(new Date(c.ends_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* LEADERBOARD TAB */}
            <TabsContent value="leaderboard" className="mt-4 space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No members yet</p>
              ) : (
                leaderboard.map((m, i) => (
                  <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl ${i < 3 ? 'bg-card border border-border/40' : ''}`}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      i === 1 ? 'bg-gray-400/20 text-gray-300' :
                      i === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <Avatar src={m.profile?.avatar_url} fallback={m.profile?.username?.[0] || '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{m.profile?.username}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.role === 'admin' && <span className="text-primary mr-1">Admin</span>}
                        Level {Math.floor((m.profile?.xp || 0) / 100) + 1}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary">{m.profile?.xp || 0} XP</span>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
