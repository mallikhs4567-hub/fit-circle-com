import { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Send, MessageCircle, UserPlus, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SearchUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export default function Chat() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { threads, messages, loading, sendMessage, fetchMessages } = useChat(selectedUserId || undefined);
  const { friends, pendingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, refetch: refetchFriends } = useFriends();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);

  // Instagram-style real-time user search
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.length < 1) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .neq('user_id', user?.id || '')
        .limit(10);

      if (!error && data) {
        setSearchResults(data);
      }
      setSearchLoading(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user?.id]);

  const handleAddFriendFromSearch = async (username: string, userId: string) => {
    setAddingFriend(userId);
    await sendFriendRequest(username);
    await refetchFriends();
    setAddingFriend(null);
  };

  const isFriend = (userId: string) => friends.some(f => f.user_id === userId);
  const hasPendingRequest = (userId: string) => pendingRequests.some(r => r.user_id === userId);

  const selectedThread = threads.find(t => t.participantId === selectedUserId);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    await sendMessage(selectedUserId, newMessage.trim());
    setNewMessage('');
  };

  const getTimeDisplay = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    }
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Now';
  };

  // Thread List View
  if (!selectedUserId) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-display font-bold text-foreground">Chat</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="pl-10"
              />
            </div>
          </div>
        </header>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute left-0 right-0 mx-4 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {searchLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-4 px-4 text-center text-muted-foreground text-sm">
                No users found
              </div>
            ) : (
              searchResults.map((result) => (
                <div
                  key={result.user_id}
                  className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors"
                >
                  <Avatar name={result.username} src={result.avatar_url} size="md" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">@{result.username}</p>
                  </div>
                  {isFriend(result.user_id) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedUserId(result.user_id)}
                    >
                      Message
                    </Button>
                  ) : hasPendingRequest(result.user_id) ? (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddFriendFromSearch(result.username, result.user_id)}
                      disabled={addingFriend === result.user_id}
                    >
                      {addingFriend === result.user_id ? (
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
              ))
            )}
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Friend Requests</p>
            {pendingRequests.map((request) => (
              <div key={request.user_id} className="flex items-center gap-3 py-2">
                <Avatar name={request.username} src={request.avatar_url} size="md" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">@{request.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => acceptFriendRequest(request.user_id)}
                  >
                    <Check className="w-4 h-4 text-success" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => rejectFriendRequest(request.user_id)}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Thread List */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : threads.length === 0 && friends.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No conversations yet</h3>
              <p className="text-sm text-muted-foreground">
                Search for users above to add friends!
              </p>
            </div>
          ) : (
            threads
              .filter(t => !searchQuery || t.participantName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((thread) => (
                <button
                  key={thread.participantId}
                  onClick={() => setSelectedUserId(thread.participantId)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar name={thread.participantName} src={thread.participantAvatar} size="lg" />
                    {thread.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {thread.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-foreground">@{thread.participantName}</p>
                      <span className="text-xs text-muted-foreground">
                        {getTimeDisplay(thread.lastMessageAt)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      thread.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {thread.lastMessage}
                    </p>
                  </div>
                </button>
              ))
          )}
        </div>

        {/* Friends List (for starting new chats) */}
        {friends.length > 0 && threads.length === 0 && (
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-muted-foreground mb-2">Your Friends</p>
            {friends.map((friend) => (
              <button
                key={friend.user_id}
                onClick={() => setSelectedUserId(friend.user_id)}
                className="w-full flex items-center gap-3 py-2 hover:bg-secondary/50 rounded-lg px-2 transition-colors"
              >
                <Avatar name={friend.username} src={friend.avatar_url} size="md" />
                <p className="font-semibold text-foreground">@{friend.username}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chat View
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Chat Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSelectedUserId(null)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar name={selectedThread?.participantName} src={selectedThread?.participantAvatar} size="md" />
          <div>
            <p className="font-semibold text-foreground">@{selectedThread?.participantName}</p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((message, index) => {
          const isOwn = message.sender_id === user?.id;
          
          return (
            <div
              key={message.id}
              className={cn(
                "flex animate-fade-up",
                isOwn ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className={cn(
                "max-w-[80%] px-4 py-2.5 rounded-2xl",
                isOwn
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-foreground rounded-bl-md"
              )}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border safe-bottom">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
