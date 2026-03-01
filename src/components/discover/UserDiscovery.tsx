import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { Avatar } from '@/components/common/Avatar';
import { StreakBadge } from '@/components/common/StreakBadge';
import { GoalBadge } from '@/components/common/GoalBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Loader2, Users, Sparkles, Check, Flame } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface DiscoverUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  streak: number;
}

interface UserDiscoveryProps {
  onSelectUser?: (userId: string) => void;
}

export function UserDiscovery({ onSelectUser }: UserDiscoveryProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { friends, pendingRequests, sendFriendRequest, refetch: refetchFriends } = useFriends();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [addingFriend, setAddingFriend] = useState<string | null>(null);
  
  // Debounce search query for 150ms (faster response)
  const debouncedSearch = useDebounce(searchQuery, 150);

  // Memoize exclude IDs
  const excludeIds = useMemo(() => {
    const friendIds = friends.map(f => f.user_id);
    const pendingIds = pendingRequests.map(p => p.user_id);
    return [user?.id, ...friendIds, ...pendingIds].filter(Boolean);
  }, [user?.id, friends, pendingRequests]);

  // Fetch recommendations with React Query
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ['user-recommendations', user?.id, excludeIds],
    queryFn: async () => {
      if (!user || excludeIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, streak')
        .not('user_id', 'in', `(${excludeIds.join(',')})`)
        .order('streak', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as DiscoverUser[];
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Search users with React Query
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['user-search', debouncedSearch, user?.id],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];

      const { data, error } = await supabase
        .rpc('search_users_by_username', { search_username: debouncedSearch })
        .neq('user_id', user?.id || '');

      if (error) throw error;
      return data as DiscoverUser[];
    },
    enabled: !!debouncedSearch.trim(),
    staleTime: 1000 * 30, // 30 seconds
  });

  const handleAddFriend = async (username: string, userId: string) => {
    setAddingFriend(userId);
    await sendFriendRequest(username);
    await refetchFriends();
    // Invalidate recommendations to update the list
    queryClient.invalidateQueries({ queryKey: ['user-recommendations'] });
    setAddingFriend(null);
  };

  const isFriend = (userId: string) => friends.some(f => f.user_id === userId);
  const hasPendingRequest = (userId: string) => pendingRequests.some(r => r.user_id === userId);

  const displayUsers = searchQuery.trim() ? searchResults : recommendations;
  const isSearching = searchQuery.trim().length > 0;

  const renderUserCard = (discoverUser: DiscoverUser) => {
    const isFriendUser = isFriend(discoverUser.user_id);
    const isPending = hasPendingRequest(discoverUser.user_id);

    return (
      <div
        key={discoverUser.user_id}
        className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all duration-200"
      >
        <Avatar name={discoverUser.username} src={discoverUser.avatar_url} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">@{discoverUser.username}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {discoverUser.streak > 0 && (
              <StreakBadge streak={discoverUser.streak} size="sm" />
            )}
          </div>
        </div>
        {isFriendUser ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSelectUser?.(discoverUser.user_id)}
          >
            <Check className="w-4 h-4 mr-1" />
            Friends
          </Button>
        ) : isPending ? (
          <Button variant="outline" size="sm" disabled>
            Pending
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => handleAddFriend(discoverUser.username, discoverUser.user_id)}
            disabled={addingFriend === discoverUser.user_id}
          >
            {addingFriend === discoverUser.user_id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 text-base rounded-xl bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-3">
          {isSearching ? (
            <>
              <Search className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Search Results
              </h3>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Suggested For You
              </h3>
            </>
          )}
        </div>

        {/* Loading State */}
        {(isSearching ? searchLoading : recommendationsLoading) && displayUsers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {isSearching ? 'No users found' : 'No suggestions yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isSearching 
                ? `Try searching with different keywords`
                : 'Start searching to find people to connect with!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayUsers.map(renderUserCard)}
          </div>
        )}
      </div>
    </div>
  );
}
