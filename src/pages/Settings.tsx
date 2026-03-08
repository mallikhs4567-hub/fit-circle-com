import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/common/Avatar';
import { GoalBadge } from '@/components/common/GoalBadge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Camera,
  Loader2,
  User,
  Ruler,
  Weight,
  Target,
  Dumbbell,
  ChevronRight,
  LogOut,
  Save,
  Watch,
  Crown,
} from 'lucide-react';
import { ConnectedDevices } from '@/components/settings/ConnectedDevices';
import { useSubscription } from '@/hooks/useSubscription';
import { PremiumBadge } from '@/components/premium/PremiumBadge';

type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'yoga' | 'runner' | 'general-fitness';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

const goalOptions: { id: FitnessGoal; label: string; icon: string }[] = [
  { id: 'weight-loss', label: 'Weight Loss', icon: '🎯' },
  { id: 'muscle-gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'yoga', label: 'Yoga', icon: '🧘' },
  { id: 'runner', label: 'Runner', icon: '🏃' },
  { id: 'general-fitness', label: 'General Fitness', icon: '🥗' },
];

const experienceOptions: { id: ExperienceLevel; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const genderOptions = [
  { id: 'male' as const, label: 'Male' },
  { id: 'female' as const, label: 'Female' },
  { id: 'other' as const, label: 'Other' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const { isPremium } = useSubscription();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(
    (profile?.gender as any) || null
  );
  const [goal, setGoal] = useState<FitnessGoal | null>(
    (profile?.goal as FitnessGoal) || null
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(
    (profile?.experience_level as ExperienceLevel) || null
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload photo');
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    await updateProfile({ avatar_url: urlData.publicUrl });
    toast.success('Photo updated!');
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    setSaving(true);
    const { error } = await updateProfile({
      username: username.trim(),
      bio: bio.trim() || null,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      gender,
      goal,
      experience_level: experienceLevel,
    });
    setSaving(false);
    if (!error) {
      toast.success('Profile saved!');
      navigate('/profile');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!profile) return null;

  // Instagram-style section renderer
  const renderSection = (id: string, title: string, icon: React.ReactNode, content: React.ReactNode) => {
    const isOpen = activeSection === id;
    return (
      <div className="border-b border-border">
        <button
          onClick={() => setActiveSection(isOpen ? null : id)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        >
          <span className="text-muted-foreground">{icon}</span>
          <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
          <ChevronRight className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )} />
        </button>
        {isOpen && (
          <div className="px-4 pb-4 animate-fade-up">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-foreground flex-1">Edit Profile</h1>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1">Save</span>
          </Button>
        </div>
      </header>

      {/* Avatar section */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <Avatar name={profile.username} src={profile.avatar_url} size="xl" showBorder />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full gradient-primary flex items-center justify-center border-2 border-background"
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
            ) : (
              <Camera className="w-4 h-4 text-primary-foreground" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <p className="text-sm text-primary mt-2 font-medium">Change profile photo</p>
      </div>

      {/* Edit fields */}
      <div className="card-elevated mx-4 mb-4 overflow-hidden">
        {/* Username */}
        <div className="px-4 py-3 border-b border-border">
          <label className="text-xs text-muted-foreground mb-1 block">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            className="border-0 p-0 h-auto text-foreground bg-transparent focus-visible:ring-0 shadow-none"
          />
        </div>

        {/* Bio */}
        <div className="px-4 py-3">
          <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            maxLength={150}
            className="border-0 p-0 min-h-[60px] text-foreground bg-transparent focus-visible:ring-0 shadow-none resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right mt-1">{bio.length}/150</p>
        </div>
      </div>

      {/* Expandable sections */}
      <div className="card-elevated mx-4 mb-4 overflow-hidden">
        {renderSection('personal', 'Personal Info', <User className="w-4 h-4" />, (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {genderOptions.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id)}
                    className={cn(
                      "py-2.5 rounded-xl border text-sm font-medium transition-all",
                      gender === g.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {renderSection('body', 'Body Stats', <Ruler className="w-4 h-4" />, (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Height (cm)</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Weight (kg)</label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
              />
            </div>
          </div>
        ))}

        {renderSection('goal', 'Fitness Goal', <Target className="w-4 h-4" />, (
          <div className="space-y-2">
            {goalOptions.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition-all",
                  goal === g.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-foreground"
                )}
              >
                <span>{g.icon}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        ))}

        {renderSection('experience', 'Experience Level', <Dumbbell className="w-4 h-4" />, (
          <div className="space-y-2">
            {experienceOptions.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setExperienceLevel(lvl.id)}
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl border text-left text-sm transition-all",
                  experienceLevel === lvl.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-foreground"
                )}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Connected Devices */}
      <div className="border-b border-border">
        <button
          onClick={() => setActiveSection(activeSection === 'devices' ? null : 'devices')}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        >
          <Watch className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium text-foreground">Connected Devices</span>
          <ChevronRight className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            activeSection === 'devices' && "rotate-90"
          )} />
        </button>
        {activeSection === 'devices' && (
          <div className="px-4 pb-4 animate-fade-up">
            <ConnectedDevices />
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="px-4 pt-2">
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
