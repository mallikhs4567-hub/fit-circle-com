import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import { StreakBadge } from '@/components/common/StreakBadge';
import { Button } from '@/components/ui/button';
import {
  Settings, 
  LogOut, 
  Trophy, 
  Target, 
  Calendar, 
  Flame,
  ChevronRight,
  User,
  Scale,
  Ruler,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const goalLabels = {
  'weight-loss': 'Weight Loss',
  'muscle-gain': 'Muscle Gain',
  'healthy-routine': 'Healthy Routine',
};

export default function Profile() {
  const { profile, loading } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="safe-top px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-foreground">Profile</h1>
          <Button variant="ghost" size="icon-sm">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Profile Card */}
      <div className="px-4 mb-6">
        <div className="card-elevated p-6 text-center">
          <Avatar 
            name={profile.username} 
            src={profile.avatar_url} 
            size="xl" 
            showBorder 
            className="mx-auto mb-4"
          />
          <h2 className="text-xl font-display font-bold text-foreground mb-1">
            @{profile.username}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{profile.email}</p>
          
          {/* Streak Display */}
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-streak/10 border border-streak/20">
            <StreakBadge streak={profile.streak} size="md" animate={profile.streak > 0} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${profile.streak} days`}
            iconColor="text-streak"
          />
          <StatCard
            icon={Trophy}
            label="Total Active"
            value={`${profile.total_active_days} days`}
            iconColor="text-primary"
          />
          <StatCard
            icon={Calendar}
            label="Member Since"
            value={new Date(profile.created_at).toLocaleDateString(undefined, { 
              month: 'short', 
              year: 'numeric' 
            })}
            iconColor="text-muted-foreground"
          />
          <StatCard
            icon={Target}
            label="Goal"
            value={profile.goal ? goalLabels[profile.goal] : 'Not set'}
            iconColor="text-success"
          />
        </div>
      </div>

      {/* Details Section */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Personal Details
        </h3>
        <div className="card-elevated divide-y divide-border">
          <DetailRow
            icon={User}
            label="Gender"
            value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set'}
          />
          <DetailRow
            icon={Ruler}
            label="Height"
            value={profile.height ? `${profile.height} cm` : 'Not set'}
          />
          <DetailRow
            icon={Scale}
            label="Weight"
            value={profile.weight ? `${profile.weight} kg` : 'Not set'}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  iconColor: string;
}) {
  return (
    <div className="card-elevated p-4">
      <div className={cn("flex items-center gap-2 mb-1", iconColor)}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-display font-bold text-foreground">{value}</p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{value}</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}
