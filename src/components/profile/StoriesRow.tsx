import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { useStories, Story, StoryPost } from '@/hooks/useStories';
import { useProfile } from '@/hooks/useProfile';
 import { Loader2, Plus } from 'lucide-react';
 import { StoryViewer } from '@/components/circle/StoryViewer';

interface StoriesRowProps {
  onAddStory?: () => void;
}

export function StoriesRow({ onAddStory }: StoriesRowProps) {
  const { stories, myStory, loading, refetch } = useStories();
  const { profile } = useProfile();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setCurrentPostIndex(0);
  };

  const handleClose = () => {
    setSelectedStory(null);
    setCurrentPostIndex(0);
    refetch();
  };

  const allStories = myStory ? [myStory, ...stories] : stories;

  if (loading) {
    return (
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Stories
        </h3>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stories Row */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Stories
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* User's Story - shows either add button or their story */}
          {myStory ? (
            // User has active story - show it without plus icon
            <button
              onClick={() => handleStoryClick(myStory)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div
                className="p-0.5 rounded-full bg-gradient-to-tr from-primary via-streak to-primary"
              >
                <div className="p-0.5 bg-background rounded-full">
                  <Avatar
                    name={profile?.username}
                    src={profile?.avatar_url}
                    size="lg"
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Your story</span>
            </button>
          ) : (
            // No active story - show add button with plus icon
            <button
              onClick={onAddStory}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className="relative">
                <div className="p-0.5 rounded-full bg-muted">
                  <div className="p-0.5 bg-background rounded-full">
                    <Avatar
                      name={profile?.username}
                      src={profile?.avatar_url}
                      size="lg"
                    />
                  </div>
                </div>
                {/* Plus icon overlay */}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <Plus className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Your story</span>
            </button>
          )}

          {/* Friends' Stories */}
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

      {/* Story Viewer */}
      <StoryViewer
        story={selectedStory}
        allStories={allStories}
        currentPostIndex={currentPostIndex}
        onClose={handleClose}
        onPrev={() => {}}
        onNext={() => {}}
        onPostIndexChange={setCurrentPostIndex}
        onStoryChange={setSelectedStory}
      />
    </>
  );
}
