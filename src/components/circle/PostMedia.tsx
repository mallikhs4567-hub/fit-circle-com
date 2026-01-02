import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostMediaProps {
  url: string;
}

export function PostMedia({ url }: PostMediaProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  if (isVideo) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-secondary -mx-4 mt-3">
        <video
          src={url}
          className="w-full aspect-video object-cover cursor-pointer"
          onClick={handleVideoClick}
          muted={isMuted}
          loop
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-7 h-7 text-foreground fill-current ml-1" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-secondary -mx-4 mt-3">
      <img
        src={url}
        alt="Post media"
        className="w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
