import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Dumbbell, MessageCircle, User, Trophy, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'circle', label: 'Feed', icon: Users, path: '/circle' },
  { id: 'groups', label: 'Groups', icon: UsersRound, path: '/groups' },
  { id: 'fitness', label: 'Train', icon: Dumbbell, path: '/fitness' },
  { id: 'challenges', label: 'Compete', icon: Trophy, path: '/challenges' },
  { id: 'chat', label: 'Chat', icon: MessageCircle, path: '/chat' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 safe-bottom"
      style={{ background: 'linear-gradient(180deg, hsl(0 0% 7% / 0.98), hsl(0 0% 5%))' }}>
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || 
            (tab.path === '/circle' && location.pathname === '/');
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 w-14 py-1.5 transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground active:scale-90"
              )}
            >
              {/* Active glow dot */}
              {isActive && (
                <span className="absolute -top-1 w-1 h-1 rounded-full bg-primary animate-online-pulse" />
              )}
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive && "scale-110"
              )} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn(
                "text-[9px] font-semibold tracking-wide uppercase transition-all duration-200",
                isActive && "text-primary"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
