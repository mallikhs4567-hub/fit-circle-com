import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LevelUpModalProps {
  open: boolean;
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ open, level, onClose }: LevelUpModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader>
          <DialogTitle className="text-3xl font-display">
            🔥 Level Up!
          </DialogTitle>
          <DialogDescription className="text-lg mt-2">
            You are now <span className="text-primary font-bold">Level {level}</span>
          </DialogDescription>
        </DialogHeader>
        <p className="text-6xl my-4">🏆</p>
        <Button onClick={onClose} className="w-full">
          Let's Go!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
