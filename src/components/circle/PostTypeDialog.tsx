import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, CircleDot } from 'lucide-react';

interface PostTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPost: () => void;
  onSelectStory: () => void;
}

export function PostTypeDialog({
  open,
  onOpenChange,
  onSelectPost,
  onSelectStory,
}: PostTypeDialogProps) {
  const handleSelectPost = () => {
    onSelectPost();
    onOpenChange(false);
  };

  const handleSelectStory = () => {
    onSelectStory();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-lg">What would you like to share?</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleSelectPost}
            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Post</p>
              <p className="text-xs text-muted-foreground mt-0.5">Visible to everyone</p>
            </div>
          </button>

          <button
            onClick={handleSelectStory}
            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <CircleDot className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Story</p>
              <p className="text-xs text-muted-foreground mt-0.5">Visible to friends</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
