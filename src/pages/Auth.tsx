import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Flame, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      if (!error) {
        setResetSent(true);
      }
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (!error) {
        navigate('/fitness');
      }
    } else {
      if (username.length < 3) {
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username);
      if (!error) {
        navigate('/onboarding');
      }
    }

    setLoading(false);
  };

  const canSubmit = () => {
    if (mode === 'forgot') {
      return email.includes('@');
    }
    if (mode === 'login') {
      return email.includes('@') && password.length >= 6;
    }
    return email.includes('@') && password.length >= 6 && username.length >= 3;
  };

  const getTitle = () => {
    if (mode === 'forgot') return 'Reset Password';
    if (mode === 'login') return 'Welcome back!';
    return 'Start your fitness journey';
  };

  if (resetSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2 text-center">
          Check your email
        </h1>
        <p className="text-muted-foreground text-center mb-8 max-w-xs">
          We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setResetSent(false);
            setMode('login');
            setEmail('');
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="safe-top px-6 pt-12 pb-8 text-center">
        {mode === 'forgot' && (
          <button
            onClick={() => setMode('login')}
            className="absolute left-4 top-12 p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Flame className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">FitCircle</h1>
        <p className="text-muted-foreground">{getTitle()}</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="animate-fade-up">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                This is how friends will find you
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
            {mode === 'forgot' && (
              <p className="text-xs text-muted-foreground mt-1.5">
                We'll send you a link to reset your password
              </p>
            )}
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  At least 6 characters
                </p>
              )}
            </div>
          )}

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          )}

          <Button
            type="submit"
            disabled={!canSubmit() || loading}
            className="w-full mt-6"
            size="lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === 'forgot' ? 'Send Reset Link' : mode === 'login' ? 'Log In' : 'Create Account'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        {mode !== 'forgot' && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary font-semibold hover:underline mt-1"
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-8 safe-bottom text-center">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
