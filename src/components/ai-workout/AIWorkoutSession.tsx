import { useState, useCallback, useRef, useEffect } from 'react';
import { CameraFeed } from './CameraFeed';
import { WorkoutComplete } from './WorkoutComplete';
import { createRepState, processFrame, type ExerciseConfig } from '@/lib/repCounter';
import { analyzeForm, getXPMultiplier, type FormResult } from '@/lib/formAnalyzer';
import { createRecognitionState, recognizeExercise, type RecognitionResult } from '@/lib/exerciseRecognition';
import * as voiceCoach from '@/lib/voiceCoach';
import { type Point } from '@/lib/angleUtils';
import { useAuth } from '@/hooks/useAuth';
import { useXP } from '@/hooks/useXP';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { X, Volume2, VolumeX, Camera, AlertTriangle } from 'lucide-react';

interface AIWorkoutSessionProps {
  exercise: ExerciseConfig;
  onClose: () => void;
}

export function AIWorkoutSession({ exercise, onClose }: AIWorkoutSessionProps) {
  const { user } = useAuth();
  const { awardXP } = useXP();
  const [started, setStarted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [reps, setReps] = useState(0);
  const [formResult, setFormResult] = useState<FormResult>({ score: 100, mistakes: [], tips: [] });
  const [completed, setCompleted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [recognized, setRecognized] = useState(false);
  const [recognitionMsg, setRecognitionMsg] = useState('Getting into position...');
  const [recognitionConfidence, setRecognitionConfidence] = useState(0);
  const recognizedRef = useRef(false);

  const repStateRef = useRef(createRepState());
  const recognitionStateRef = useRef(createRecognitionState());
  const formScoresRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const frameCountRef = useRef(0);

  useEffect(() => {
    voiceCoach.setVoiceEnabled(voiceOn);
  }, [voiceOn]);

  // Timer
  useEffect(() => {
    if (started && !completed) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, completed]);

  const handleFrame = useCallback((landmarks: Point[]) => {
    frameCountRef.current++;
    if (frameCountRef.current % 2 !== 0) return;

    // Step 1: Exercise recognition — must pass before rep counting
    const { state: newRecState, result: recResult } = recognizeExercise(
      landmarks, exercise.type, recognitionStateRef.current
    );
    recognitionStateRef.current = newRecState;
    setRecognitionMsg(recResult.message);
    setRecognitionConfidence(recResult.confidence);

    if (!recResult.recognized) {
      setRecognized(false);
      recognizedRef.current = false;
      return;
    }

    if (!recognizedRef.current) {
      setRecognized(true);
      recognizedRef.current = true;
      voiceCoach.announceWorkoutStart(exercise.name);
    }

    // Step 2: Rep counting (only after recognition)
    const { state: newState, angles } = processFrame(landmarks, exercise.type, repStateRef.current);
    
    if (newState.count > repStateRef.current.count) {
      setReps(newState.count);
      voiceCoach.announceRepComplete(newState.count, exercise.targetReps);

      const result = analyzeForm(landmarks, exercise.type, angles);
      setFormResult(result);
      formScoresRef.current.push(result.score);

      if (result.score < 75 && result.mistakes.length > 0) {
        setTimeout(() => voiceCoach.announceFormFeedback(result.mistakes), 1500);
      }

      if (newState.count >= exercise.targetReps) {
        handleWorkoutComplete(newState.count);
      }
    }

    repStateRef.current = newState;
  }, [exercise]);

  const handleWorkoutComplete = async (totalReps: number) => {
    setCompleted(true);
    voiceCoach.announceWorkoutEnd();
    if (timerRef.current) clearInterval(timerRef.current);

    const avgScore = formScoresRef.current.length > 0
      ? formScoresRef.current.reduce((a, b) => a + b, 0) / formScoresRef.current.length
      : 0;
    const multiplier = getXPMultiplier(avgScore);
    const baseXP = 20;
    const totalXP = Math.round(baseXP * multiplier);
    const calories = Math.round(totalReps * exercise.caloriesPerRep);

    setXpEarned(totalXP);

    // Award XP
    await awardXP('workout_completed');

    // Save to DB
    if (user) {
      await supabase.from('workout_results').insert({
        user_id: user.id,
        exercise_name: exercise.name,
        reps_completed: totalReps,
        avg_form_score: Math.round(avgScore * 100) / 100,
        duration_seconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        xp_earned: totalXP,
        calories_burned: calories,
      });
    }
  };

  const handleStart = () => {
    setShowPrivacy(false);
    setStarted(true);
  };

  const handleCloseComplete = () => {
    voiceCoach.cleanup();
    onClose();
  };

  const progress = exercise.targetReps > 0 ? (reps / exercise.targetReps) * 100 : 0;
  const formColor = formResult.score >= 90 ? 'text-primary' : formResult.score >= 75 ? 'text-accent' : 'text-destructive';

  if (completed) {
    return (
      <WorkoutComplete
        exerciseName={exercise.name}
        reps={reps}
        targetReps={exercise.targetReps}
        avgFormScore={formScoresRef.current.length > 0
          ? Math.round(formScoresRef.current.reduce((a, b) => a + b, 0) / formScoresRef.current.length)
          : 0}
        duration={duration}
        xpEarned={xpEarned}
        calories={Math.round(reps * exercise.caloriesPerRep)}
        onClose={handleCloseComplete}
      />
    );
  }

  // Privacy notice
  if (showPrivacy) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
        <div className="card-elevated p-6 max-w-sm space-y-5 text-center">
          <div className="w-14 h-14 rounded-xl gradient-primary glow-primary mx-auto flex items-center justify-center">
            <Camera className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-display uppercase tracking-wide text-foreground">AI Workout</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Camera feed is processed <strong className="text-foreground">on your device only</strong>. 
            No video is stored or sent anywhere.
          </p>
          <div className="space-y-2">
            <button
              onClick={handleStart}
              className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-bold text-sm uppercase tracking-wider press-effect"
            >
              Start {exercise.name}
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-muted-foreground press-effect"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 safe-top">
        <button onClick={onClose} className="p-2 rounded-lg bg-secondary press-effect">
          <X className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-display uppercase tracking-wider text-foreground">{exercise.name}</span>
        <button onClick={() => setVoiceOn(!voiceOn)} className="p-2 rounded-lg bg-secondary press-effect">
          {voiceOn ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
        </button>
      </div>

      {/* Camera */}
      <div className="flex-1 px-3">
        <CameraFeed onFrame={handleFrame} active={started} />
      </div>

      {/* HUD */}
      <div className="p-4 space-y-3 safe-bottom">
        {/* Recognition */}
        {!recognized && (
          <div className="card-elevated p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-streak shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">{recognitionMsg}</p>
              <div className="w-full h-1.5 bg-secondary rounded mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded bg-streak transition-all duration-300"
                  style={{ width: `${recognitionConfidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main rep counter - prominent */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1.5 uppercase tracking-wider">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-bold">{reps}/{exercise.targetReps}</span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded overflow-hidden">
              <div
                className="h-full rounded gradient-primary transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          <div className="text-center px-2">
            <p className="stat-value text-4xl text-primary animate-count-up" key={reps}>{reps}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Reps</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2">
          <div className="flex-1 card-elevated p-3 text-center">
            <p className={cn("stat-value text-2xl", formColor)}>
              {recognized ? `${formResult.score}%` : '—'}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Form</p>
          </div>
          <div className="flex-1 card-elevated p-3 text-center">
            <p className="stat-value text-2xl text-foreground">
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Time</p>
          </div>
        </div>

        {/* Form feedback */}
        {recognized && formResult.tips.length > 0 && (
          <div className="card-elevated p-3 border-l-2 border-l-primary">
            <p className="text-xs text-foreground">{formResult.tips[0]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
