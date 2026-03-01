import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { Dumbbell, Target, Salad, ArrowRight, Check, Flame, Loader2, Footprints, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'yoga' | 'runner' | 'general-fitness';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

const goals = [
  { id: 'weight-loss' as FitnessGoal, title: 'Weight Loss', description: 'Burn fat & get lean', icon: Target },
  { id: 'muscle-gain' as FitnessGoal, title: 'Muscle Gain', description: 'Build strength & size', icon: Dumbbell },
  { id: 'yoga' as FitnessGoal, title: 'Yoga', description: 'Flexibility & mindfulness', icon: Sparkles },
  { id: 'runner' as FitnessGoal, title: 'Runner', description: 'Speed & endurance', icon: Footprints },
  { id: 'general-fitness' as FitnessGoal, title: 'General Fitness', description: 'Stay active & healthy', icon: Salad },
];

const experienceLevels: { id: ExperienceLevel; title: string; description: string }[] = [
  { id: 'beginner', title: 'Beginner', description: 'Just getting started' },
  { id: 'intermediate', title: 'Intermediate', description: '6+ months of training' },
  { id: 'advanced', title: 'Advanced', description: '2+ years of experience' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);

  const handleComplete = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      goal: selectedGoal!,
      experience_level: experienceLevel!,
      height: Number(height),
      weight: Number(weight),
      gender: gender!,
    });
    setLoading(false);
    if (!error) navigate('/fitness');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedGoal !== null;
      case 2: return experienceLevel !== null;
      case 3: return height && weight && gender;
      default: return false;
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="safe-top px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">FitCircle</h1>
        </div>
        <div className="flex gap-2 mt-6">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                s <= step ? "gradient-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {step === 1 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">What's your goal? 🎯</h2>
              <p className="text-muted-foreground">We'll personalize your daily plan based on this</p>
            </div>
            <div className="space-y-3">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                      isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? "gradient-primary" : "bg-secondary"
                      )}>
                        <Icon className={cn("w-6 h-6", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{goal.title}</h3>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Experience level 💪</h2>
              <p className="text-muted-foreground">This helps us tailor the difficulty</p>
            </div>
            <div className="space-y-3">
              {experienceLevels.map((lvl) => {
                const isSelected = experienceLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => setExperienceLevel(lvl.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                      isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{lvl.title}</h3>
                        <p className="text-sm text-muted-foreground">{lvl.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">About you 📊</h2>
              <p className="text-muted-foreground">This helps us create your personalized plan</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "py-3 px-4 rounded-xl border-2 font-medium transition-all capitalize",
                        gender === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Height (cm)</label>
                  <Input type="number" placeholder="170" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Weight (kg)</label>
                  <Input type="number" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 safe-bottom">
        <Button
          onClick={() => {
            if (step < totalSteps) setStep(step + 1);
            else handleComplete();
          }}
          disabled={!canProceed() || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {step === totalSteps ? "Let's Go!" : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
