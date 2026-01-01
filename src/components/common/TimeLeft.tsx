import { Clock } from 'lucide-react';

interface TimeLeftProps {
  expiresAt: Date;
}

export function TimeLeft({ expiresAt }: TimeLeftProps) {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return null;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="w-3 h-3" />
      <span>
        {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} left
      </span>
    </div>
  );
}
