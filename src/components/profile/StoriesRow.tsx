import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { demoPosts, demoFriends, DemoPost } from '@/lib/demoData';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PostMedia } from '@/components/circle/PostMedia';

interface Story {
  userId: string;
  username: string;
  avatarUrl: string | null;
  posts: DemoPost[];
  hasUnviewed: boolean;
}

// Group demo posts by user to create stories
const getStories = (): Story[] => {
  const userMap = new Map<string, Story>();
  
  demoPosts.forEach((post) => {
    if (!userMap.has(post.user_id)) {
      const friend = demoFriends.find(f => f.user_id === post.user_id);
      userMap.set(post.user_id, {
        userId: post.user_id,
        username: post.username,
        avatarUrl: friend?.avatar_url || null,
        posts: [],
        hasUnviewed: Math.random() > 0.3, // Randomly mark some as unviewed for demo
      });
    }
    userMap.get(post.user_id)!.posts.push(post);
  });
  
  return Array.from(userMap.values());
};

export function StoriesRow() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const stories = getStories();

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setCurrentPostIndex(0);
  };

  const handleClose = () => {
    setSelectedStory(null);
    setCurrentPostIndex(0);
  };

  const handlePrev = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
    } else {
      // Go to previous story
      const currentIdx = stories.findIndex(s => s.userId === selectedStory?.userId);
      if (currentIdx > 0) {
        setSelectedStory(stories[currentIdx - 1]);
        setCurrentPostIndex(stories[currentIdx - 1].posts.length - 1);
      }
    }
  };

  const handleNext = () => {
    if (selectedStory && currentPostIndex < selectedStory.posts.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
    } else {
      // Go to next story
      const currentIdx = stories.findIndex(s => s.userId === selectedStory?.userId);
      if (currentIdx < stories.length - 1) {
        setSelectedStory(stories[currentIdx + 1]);
        setCurrentPostIndex(0);
      } else {
        handleClose();
      }
    }
  };

  const currentPost = selectedStory?.posts[currentPostIndex];

  return (
    <>
      {/* Stories Row */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Stories
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {stories.map((story) => (
            <button
              key={story.userId}
              onClick={() => handleStoryClick(story)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div
                className={cn(
                  "p-0.5 rounded-full",
                  story.hasUnviewed
                    ? "bg-gradient-to-tr from-primary via-streak to-primary"
                    : "bg-muted"
                )}
              >
                <div className="p-0.5 bg-background rounded-full">
                  <Avatar
                    name={story.username}
                    src={story.avatarUrl}
                    size="lg"
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-16">
                {story.username.split('_')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      <Dialog open={!!selectedStory} onOpenChange={() => handleClose()}>
        <DialogContent className="max-w-md w-full h-[85vh] p-0 bg-black border-0 overflow-hidden">
          {selectedStory && currentPost && (
            <div className="relative h-full flex flex-col">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                {selectedStory.posts.map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden"
                  >
                    <div
                      className={cn(
                        "h-full bg-white transition-all duration-300",
                        idx < currentPostIndex ? "w-full" : idx === currentPostIndex ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={selectedStory.username}
                    src={selectedStory.avatarUrl}
                    size="sm"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{selectedStory.username}</p>
                    <p className="text-white/60 text-xs">
                      {new Date(currentPost.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center bg-black">
                {currentPost.image_url ? (
                  <PostMedia url={currentPost.image_url} />
                ) : (
                  <div className="p-8 flex items-center justify-center">
                    <p className="text-white text-xl text-center font-medium">
                      {currentPost.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Caption */}
              {currentPost.image_url && currentPost.content && (
                <div className="absolute bottom-16 left-4 right-4 z-20">
                  <p className="text-white text-sm bg-black/50 rounded-lg p-3">
                    {currentPost.content}
                  </p>
                </div>
              )}

              {/* Navigation areas */}
              <button
                onClick={handlePrev}
                className="absolute left-0 top-20 bottom-20 w-1/3 z-10"
                aria-label="Previous"
              />
              <button
                onClick={handleNext}
                className="absolute right-0 top-20 bottom-20 w-1/3 z-10"
                aria-label="Next"
              />

              {/* Navigation arrows for desktop */}
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors hidden sm:block z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors hidden sm:block z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
