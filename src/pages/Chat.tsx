import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
 import { useBlocking } from '@/hooks/useBlocking';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
 import { Search, ArrowLeft, Send, MessageCircle, Loader2, Check, X, UserPlus, Clock, MoreVertical, Ban, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { threads, messages, loading, sendMessage } = useChat(selectedUserId || undefined);
  const { friends, pendingRequests, sentRequests, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } = useFriends();
  const { isBlocked, blockUser, unblockUser, blockedUsers } = useBlocking();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle navigation state for selecting a user from Search page
  useEffect(() => {
    if (location.state?.selectedUserId) {
      setSelectedUserId(location.state.selectedUserId);
      // Clear the state so it doesn't persist on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
          <div className="px-4 py-3">
            <h1 className="text-xl font-display font-bold text-foreground">Chat</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col">
          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Friend Requests Section with Tabs */}
          <Tabs defaultValue="received" className="px-4 py-3 bg-secondary/30 border-b border-border">
            <TabsList className="w-full mb-3">
              <TabsTrigger value="received" className="flex-1">
                Received {pendingRequests.length > 0 && `(${pendingRequests.length})`}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1">
                Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="received">
              {pendingRequests.length > 0 ? (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div 
                      key={request.user_id} 
                      className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border"
                    >
                      <Avatar name={request.username} src={request.avatar_url} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">@{request.username}</p>
                        <p className="text-xs text-muted-foreground">🔥 {request.streak} day streak</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => acceptFriendRequest(request.user_id)}
                          className="h-8 px-3"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rejectFriendRequest(request.user_id)}
                          className="h-8 px-3"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No pending requests
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="sent">
              {sentRequests.length > 0 ? (
                <div className="space-y-2">
                  {sentRequests.map((request) => (
                    <div 
                      key={request.user_id} 
                      className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border"
                    >
                      <Avatar name={request.username} src={request.avatar_url} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">@{request.username}</p>
                        <p className="text-xs text-muted-foreground">🔥 {request.streak} day streak</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelFriendRequest(request.user_id)}
                        className="h-8 px-3 text-destructive hover:text-destructive"
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No sent requests
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Thread List */}
          <div className="flex-1 divide-y divide-border overflow-y-auto">
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
                <p className="text-sm text-muted-foreground mb-4">
                  Discover new people to connect with!
                </p>
                <Button onClick={() => navigate('/search')}>
                  <Search className="w-4 h-4 mr-2" />
                  Discover People
                </Button>
              </div>
            ) : (
              <>
                {threads
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
                  ))}
                
                {/* Friends without threads - show them for quick access */}
                {friends
                  .filter(f => !threads.some(t => t.participantId === f.user_id))
                  .filter(f => !searchQuery || f.username.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((friend) => (
                    <button
                      key={friend.user_id}
                      onClick={() => setSelectedUserId(friend.user_id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Avatar name={friend.username} src={friend.avatar_url} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">@{friend.username}</p>
                        <p className="text-sm text-muted-foreground">
                          🔥 {friend.streak} day streak
                        </p>
                      </div>
                    </button>
                  ))}
              </>
            )}
          </div>
        </div>
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
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isBlocked(selectedUserId!) ? (
                  <DropdownMenuItem onClick={() => unblockUser(selectedUserId!)}>
                    <Ban className="w-4 h-4 mr-2" />
                    Unblock
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => blockUser(selectedUserId!)} className="text-destructive">
                    <Ban className="w-4 h-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={async () => {
                    if (!selectedUserId) return;
                    const { error } = await supabase.rpc('delete_chat_for_user', { 
                      other_user_id: selectedUserId 
                    });
                    if (!error) {
                      toast.success('Chat deleted');
                      setSelectedUserId(null);
                    }
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
