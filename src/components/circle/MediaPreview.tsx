import { X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaPreviewProps {
  file: File;
  onRemove: () => void;
}

export function MediaPreview({ file, onRemove }: MediaPreviewProps) {
  const isVideo = file.type.startsWith('video/');
  const previewUrl = URL.createObjectURL(file);

  return (
    <div className="relative rounded-xl overflow-hidden bg-secondary">
      {isVideo ? (
        <div className="relative aspect-video">
          <video
            src={previewUrl}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-background/30">
            <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
              <Play className="w-6 h-6 text-foreground fill-current" />
            </div>
          </div>
        </div>
      ) : (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full aspect-square object-cover"
        />
      )}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
