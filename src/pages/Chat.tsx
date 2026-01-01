import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
}

export default function Chat() {
  const { chatThreads, user } = useApp();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: 'Hey! How\'s your workout going?', senderId: '2', createdAt: new Date(Date.now() - 60000) },
    { id: '2', content: 'Great! Just finished my morning routine 💪', senderId: '1', createdAt: new Date(Date.now() - 30000) },
    { id: '3', content: 'Keep it up!', senderId: '2', createdAt: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedChat = chatThreads.find(t => t.id === selectedThread);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      content: newMessage,
      senderId: user.id,
      createdAt: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const getTimeDisplay = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      return new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
    }
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Now';
  };

  // Thread List View
  if (!selectedThread) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
          <div className="px-4 py-3">
            <h1 className="text-xl font-display font-bold text-foreground mb-3">Chat</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </header>

        {/* Thread List */}
        <div className="divide-y divide-border">
          {chatThreads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No conversations yet</h3>
              <p className="text-sm text-muted-foreground">
                Start chatting with your friends!
              </p>
            </div>
          ) : (
            chatThreads
              .filter(t => t.participantName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar name={thread.participantName} size="lg" />
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
            onClick={() => setSelectedThread(null)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar name={selectedChat?.participantName} size="md" />
          <div>
            <p className="font-semibold text-foreground">@{selectedChat?.participantName}</p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((message, index) => {
          const isOwn = message.senderId === user?.id || message.senderId === '1';
          
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
