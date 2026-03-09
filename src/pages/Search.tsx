import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { UserDiscovery } from '@/components/discover/UserDiscovery';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search as SearchIcon, Users, UsersRound, FileText, Loader2, Globe, Lock, Dumbbell, PersonStanding, Bike, Flame, ArrowLeft } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const categoryIcons: Record<string, any> = {
  gym: Dumbbell,
  running: Bike,
  yoga: PersonStanding,
  calisthenics: Flame,
};

const categoryColors: Record<string, string> = {
  gym: 'bg-blue-500/20 text-blue-400',
  running: 'bg-green-500/20 text-green-400',
  yoga: 'bg-purple-500/20 text-purple-400',
  calisthenics: 'bg-orange-500/20 text-orange-400',
};

export default function Search() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, myGroups, joinGroup, loading: groupsLoading } = useGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const myGroupIds = new Set(myGroups.map(g => g.id));
  const discoverGroups = groups.filter(g => !myGroupIds.has(g.id));
  const filteredGroups = debouncedSearch.trim()
    ? [...myGroups, ...discoverGroups].filter(g =>
        g.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        g.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : discoverGroups;

  // Search posts
  const { data: postResults = [], isLoading: postsLoading } = useQuery({
    queryKey: ['search-posts', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, type, created_at, user_id, image_url, like_count')
        .ilike('content', `%${debouncedSearch}%`)
        .eq('type', 'post')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!debouncedSearch.trim(),
    staleTime: 30000,
  });

  // Fetch profile info for posts
  const postUserIds = [...new Set(postResults.map(p => p.user_id))];
  const { data: postProfiles = [] } = useQuery({
    queryKey: ['post-profiles', postUserIds],
    queryFn: async () => {
      if (postUserIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', postUserIds);
      return data || [];
    },
    enabled: postUserIds.length > 0,
  });

  const getProfile = (userId: string) => postProfiles.find(p => p.user_id === userId);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search people, communities, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm rounded-xl bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="people" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid grid-cols-3 h-9 bg-secondary rounded-xl">
          <TabsTrigger value="people" className="rounded-lg text-xs font-bold gap-1">
            <Users className="w-3.5 h-3.5" /> People
          </TabsTrigger>
          <TabsTrigger value="communities" className="rounded-lg text-xs font-bold gap-1">
            <UsersRound className="w-3.5 h-3.5" /> Groups
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg text-xs font-bold gap-1">
            <FileText className="w-3.5 h-3.5" /> Posts
          </TabsTrigger>
        </TabsList>

        {/* People Tab */}
        <TabsContent value="people" className="flex-1 mt-3">
          <UserDiscovery
            onSelectUser={(userId) => navigate('/chat', { state: { selectedUserId: userId } })}
          />
        </TabsContent>

        {/* Communities Tab */}
        <TabsContent value="communities" className="flex-1 mt-3 px-4 pb-4">
          {groupsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <UsersRound className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {debouncedSearch.trim() ? 'No communities found' : 'No communities to discover'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {debouncedSearch.trim() ? 'Try different keywords' : 'All communities have been joined!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => {
                const isMember = myGroupIds.has(group.id);
                const Icon = categoryIcons[group.category] || Dumbbell;
                return (
                  <div
                    key={group.id}
                    onClick={() => isMember ? navigate(`/groups/${group.id}`) : undefined}
                    className={`p-4 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm space-y-3 ${isMember ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[group.category] || 'bg-primary/20 text-primary'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{group.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {group.category}
                            </Badge>
                            {group.privacy === 'private' ? (
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <Globe className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Users className="w-3.5 h-3.5" />
                        {group.member_count}
                      </div>
                    </div>
                    {group.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                    )}
                    {isMember ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full h-8 text-xs font-semibold"
                        onClick={(e) => { e.stopPropagation(); navigate(`/groups/${group.id}`); }}
                      >
                        Open Group
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs font-semibold"
                        onClick={(e) => { e.stopPropagation(); joinGroup(group.id, group.privacy); }}
                      >
                        {group.privacy === 'public' ? 'Join' : 'Request to Join'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="flex-1 mt-3 px-4 pb-4">
          {!debouncedSearch.trim() ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Search posts</h3>
              <p className="text-sm text-muted-foreground">Type something to find posts</p>
            </div>
          ) : postsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : postResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No posts found</h3>
              <p className="text-sm text-muted-foreground">Try different keywords</p>
            </div>
          ) : (
            <div className="space-y-3">
              {postResults.map((post) => {
                const profile = getProfile(post.user_id);
                return (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm space-y-2 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => navigate(`/user/${post.user_id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={profile?.username} src={profile?.avatar_url} size="sm" />
                      <span className="text-sm font-semibold text-foreground">@{profile?.username || 'user'}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{getTimeAgo(post.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground/90 line-clamp-3">{post.content}</p>
                    {post.image_url && (
                      <img src={post.image_url} alt="" className="w-full h-32 object-cover rounded-xl" loading="lazy" />
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>❤️ {post.like_count || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
