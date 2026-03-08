import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Dumbbell, MessageCircle, User, Search, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'circle', label: 'Feed', icon: Users, path: '/circle' },
  { id: 'fitness', label: 'Train', icon: Dumbbell, path: '/fitness' },
  { id: 'challenges', label: 'Compete', icon: Trophy, path: '/challenges' },
  { id: 'chat', label: 'Chat', icon: MessageCircle, path: '/chat' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border safe-bottom"
      style={{ background: 'linear-gradient(180deg, hsl(0 0% 8% / 0.97), hsl(0 0% 6% / 0.99))' }}>
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || 
            (tab.path === '/circle' && location.pathname === '/');
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-150 press-effect",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-lg transition-all duration-150",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-150",
                  isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                )} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-semibold tracking-wide uppercase transition-colors",
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
