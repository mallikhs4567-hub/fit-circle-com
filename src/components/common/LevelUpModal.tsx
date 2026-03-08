import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Zap } from 'lucide-react';

interface LevelUpModalProps {
  open: boolean;
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ open, level, onClose }: LevelUpModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs text-center bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display uppercase tracking-wide text-foreground">
            Level Up
          </DialogTitle>
          <DialogDescription className="text-base mt-2 text-muted-foreground">
            You are now <span className="text-primary font-bold">Level {level}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex items-center justify-center">
          <div className="w-16 h-16 rounded-xl gradient-primary glow-primary flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-bold text-sm uppercase tracking-wider press-effect"
        >
          Let's Go
        </button>
      </DialogContent>
    </Dialog>
  );
}
