import { useState } from 'react';
import { Bell, UserPlus, Heart, MessageSquare, Eye, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const typeIcons: Record<string, typeof Bell> = {
  friend_request: UserPlus,
  friend_accepted: UserPlus,
  like: Heart,
  story_reply: MessageSquare,
  story_view: Eye,
  chat_message: MessageSquare,
};

const typeColors: Record<string, string> = {
  friend_request: 'text-primary bg-primary/10',
  friend_accepted: 'text-primary bg-primary/10',
  like: 'text-pink-500 bg-pink-500/10',
  story_reply: 'text-blue-500 bg-blue-500/10',
  story_view: 'text-muted-foreground bg-secondary',
  chat_message: 'text-green-500 bg-green-500/10',
};

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || 'text-muted-foreground bg-secondary';

  return (
    <button
      onClick={() => !notification.read && onRead(notification.id)}
      className={cn(
        "w-full flex items-start gap-3 p-3 text-left transition-colors rounded-lg",
        notification.read
          ? "opacity-60"
          : "bg-primary/5 hover:bg-primary/10"
      )}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm text-foreground", !notification.read && "font-medium")}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{notification.body}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(notification.created_at)}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </button>
  );
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
