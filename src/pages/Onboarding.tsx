import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { Dumbbell, Target, Salad, ArrowRight, Check, Flame } from 'lucide-react';
import type { FitnessGoal } from '@/types';
import { cn } from '@/lib/utils';

const goals = [
  {
    id: 'weight-loss' as FitnessGoal,
    title: 'Weight Loss',
    description: 'Burn fat & get lean',
    icon: Target,
  },
  {
    id: 'muscle-gain' as FitnessGoal,
    title: 'Muscle Gain',
    description: 'Build strength & size',
    icon: Dumbbell,
  },
  {
    id: 'healthy-routine' as FitnessGoal,
    title: 'Healthy Routine',
    description: 'Daily wellness habits',
    icon: Salad,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUser, setIsOnboarded } = useApp();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);

  const handleComplete = () => {
    setUser({
      id: crypto.randomUUID(),
      email,
      username,
      goal: selectedGoal!,
      height: Number(height),
      weight: Number(weight),
      gender: gender!,
      streak: 0,
      totalActiveDays: 0,
      createdAt: new Date(),
    });
    setIsOnboarded(true);
    navigate('/fitness');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return email.includes('@') && username.length >= 3;
      case 2: return selectedGoal !== null;
      case 3: return height && weight && gender;
      default: return false;
    }
  };

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
        
        {/* Progress */}
        <div className="flex gap-2 mt-6">
          {[1, 2, 3].map((s) => (
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
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Welcome aboard! 👋
              </h2>
              <p className="text-muted-foreground">
                Let's set up your profile to get started
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="@yourname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  This is how friends will find you
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                What's your goal? 🎯
              </h2>
              <p className="text-muted-foreground">
                We'll personalize your daily plan based on this
              </p>
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
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? "gradient-primary" : "bg-secondary"
                      )}>
                        <Icon className={cn(
                          "w-6 h-6",
                          isSelected ? "text-primary-foreground" : "text-muted-foreground"
                        )} />
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

        {step === 3 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                About you 📊
              </h2>
              <p className="text-muted-foreground">
                This helps us create your personalized plan
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Gender
                </label>
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
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Height (cm)
                  </label>
                  <Input
                    type="number"
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Weight (kg)
                  </label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
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
            if (step < 3) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={!canProceed()}
          className="w-full"
          size="lg"
        >
          {step === 3 ? "Let's Go!" : 'Continue'}
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
