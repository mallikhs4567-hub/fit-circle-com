import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image, Shield } from 'lucide-react';

interface MediaPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
}

export function MediaPermissionDialog({
  open,
  onOpenChange,
  onAllow,
}: MediaPermissionDialogProps) {
  const handleAllow = () => {
    onAllow();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Image className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Access Your Media</DialogTitle>
          <DialogDescription className="text-center">
            FitCircle would like to access your photos and videos to let you share your fitness journey with your circle.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 my-2">
          <Shield className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Your media stays private. Only what you choose to post will be shared with your circle for 24 hours.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleAllow} className="w-full">
            Allow Access
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
