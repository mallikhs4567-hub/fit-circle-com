import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { Flame, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';
type ForgotStep = 'email' | 'otp' | 'password' | 'success';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, verifyOtp, updatePassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      if (forgotStep === 'email') {
        const { error } = await resetPassword(email);
        if (!error) {
          setForgotStep('otp');
        }
      } else if (forgotStep === 'otp') {
        const { error } = await verifyOtp(email, otp);
        if (!error) {
          setForgotStep('password');
        }
      } else if (forgotStep === 'password') {
        if (password !== confirmPassword) {
          setLoading(false);
          return;
        }
        const { error } = await updatePassword(password);
        if (!error) {
          setForgotStep('success');
          setTimeout(() => {
            setMode('login');
            setForgotStep('email');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setOtp('');
          }, 2000);
        }
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
      if (forgotStep === 'email') return email.includes('@');
      if (forgotStep === 'otp') return otp.length === 6;
      if (forgotStep === 'password') return password.length >= 6 && password === confirmPassword;
      return false;
    }
    if (mode === 'login') {
      return email.includes('@') && password.length >= 6;
    }
    return email.includes('@') && password.length >= 6 && username.length >= 3;
  };

  const getTitle = () => {
    if (mode === 'forgot') {
      if (forgotStep === 'email') return 'Reset Password';
      if (forgotStep === 'otp') return 'Enter OTP';
      if (forgotStep === 'password') return 'New Password';
      return 'Success!';
    }
    if (mode === 'login') return 'Welcome back!';
    return 'Start your fitness journey';
  };

  const resetForgotFlow = () => {
    setMode('login');
    setForgotStep('email');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  if (mode === 'forgot' && forgotStep === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2 text-center">
          Password Updated!
        </h1>
        <p className="text-muted-foreground text-center">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="safe-top px-6 pt-12 pb-8 text-center relative">
        {mode === 'forgot' && (
          <button
            onClick={() => {
              if (forgotStep === 'email') {
                resetForgotFlow();
              } else if (forgotStep === 'otp') {
                setForgotStep('email');
                setOtp('');
              } else if (forgotStep === 'password') {
                setForgotStep('otp');
                setPassword('');
                setConfirmPassword('');
              }
            }}
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

          {/* Email step for forgot password or login/signup */}
          {(mode !== 'forgot' || forgotStep === 'email') && (
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
                  disabled={mode === 'forgot' && forgotStep !== 'email'}
                />
              </div>
              {mode === 'forgot' && forgotStep === 'email' && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  We'll send you a 6-digit OTP to reset your password
                </p>
              )}
            </div>
          )}

          {/* OTP step */}
          {mode === 'forgot' && forgotStep === 'otp' && (
            <div className="animate-fade-up">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Enter OTP
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await resetPassword(email);
                  setLoading(false);
                }}
                className="text-sm text-primary hover:underline mt-4 block mx-auto"
              >
                Resend OTP
              </button>
            </div>
          )}

          {/* Password step */}
          {mode === 'forgot' && forgotStep === 'password' && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  New Password
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
                <p className="text-xs text-muted-foreground mt-1.5">
                  At least 6 characters
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1.5">
                    Passwords don't match
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Password field for login/signup */}
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
                {mode === 'forgot'
                  ? forgotStep === 'email'
                    ? 'Send OTP'
                    : forgotStep === 'otp'
                    ? 'Verify OTP'
                    : 'Save Password'
                  : mode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
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
