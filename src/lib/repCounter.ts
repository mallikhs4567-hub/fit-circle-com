/**
 * State-machine based rep counter for various exercises.
 * Counts full cycles (down→up) with debounce protection.
 */

import { calculateAngle, LANDMARKS, type Point } from './angleUtils';

export type ExerciseType = 'pushup' | 'squat' | 'lunge' | 'shoulder_press' | 'bicep_curl' | 'jumping_jack' | 'high_knee' | 'deadlift' | 'plank_hold' | 'tricep_dip';

interface RepState {
  phase: 'up' | 'down' | 'idle';
  count: number;
  lastTransition: number;
}

const DEBOUNCE_MS = 300;

export interface ExerciseConfig {
  name: string;
  type: ExerciseType;
  targetReps: number;
  caloriesPerRep: number;
  category: 'upper' | 'lower' | 'full' | 'cardio';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
}

export const EXERCISE_LIBRARY: ExerciseConfig[] = [
  { name: 'Push-ups', type: 'pushup', targetReps: 10, caloriesPerRep: 0.5, category: 'upper', difficulty: 'beginner', icon: '💪' },
  { name: 'Squats', type: 'squat', targetReps: 15, caloriesPerRep: 0.4, category: 'lower', difficulty: 'beginner', icon: '🦵' },
  { name: 'Lunges', type: 'lunge', targetReps: 12, caloriesPerRep: 0.4, category: 'lower', difficulty: 'intermediate', icon: '🏃' },
  { name: 'Shoulder Press', type: 'shoulder_press', targetReps: 10, caloriesPerRep: 0.3, category: 'upper', difficulty: 'intermediate', icon: '🏋️' },
  { name: 'Bicep Curls', type: 'bicep_curl', targetReps: 12, caloriesPerRep: 0.25, category: 'upper', difficulty: 'beginner', icon: '💪' },
  { name: 'Jumping Jacks', type: 'jumping_jack', targetReps: 20, caloriesPerRep: 0.3, category: 'cardio', difficulty: 'beginner', icon: '⭐' },
  { name: 'High Knees', type: 'high_knee', targetReps: 20, caloriesPerRep: 0.35, category: 'cardio', difficulty: 'beginner', icon: '🔥' },
  { name: 'Deadlift', type: 'deadlift', targetReps: 10, caloriesPerRep: 0.6, category: 'full', difficulty: 'advanced', icon: '🏋️' },
  { name: 'Plank Hold', type: 'plank_hold', targetReps: 10, caloriesPerRep: 0.2, category: 'full', difficulty: 'intermediate', icon: '🧘' },
  { name: 'Tricep Dips', type: 'tricep_dip', targetReps: 12, caloriesPerRep: 0.35, category: 'upper', difficulty: 'intermediate', icon: '💎' },
];

export function createRepState(): RepState {
  return { phase: 'idle', count: 0, lastTransition: 0 };
}

/**
 * Process a frame of landmarks and update rep state.
 * Returns the updated state and current angles for form analysis.
 */
export function processFrame(
  landmarks: Point[],
  exerciseType: ExerciseType,
  state: RepState
): { state: RepState; angles: Record<string, number> } {
  const now = Date.now();
  const angles: Record<string, number> = {};

  switch (exerciseType) {
    case 'pushup': {
      const lElbow = calculateAngle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_ELBOW],
        landmarks[LANDMARKS.LEFT_WRIST]
      );
      const rElbow = calculateAngle(
        landmarks[LANDMARKS.RIGHT_SHOULDER],
        landmarks[LANDMARKS.RIGHT_ELBOW],
        landmarks[LANDMARKS.RIGHT_WRIST]
      );
      const elbowAngle = (lElbow + rElbow) / 2;
      angles.elbow = elbowAngle;

      if (elbowAngle < 90 && state.phase !== 'down' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'down', lastTransition: now };
      } else if (elbowAngle > 160 && state.phase === 'down' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'up', count: state.count + 1, lastTransition: now };
      }
      break;
    }

    case 'squat': {
      const lKnee = calculateAngle(
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_KNEE],
        landmarks[LANDMARKS.LEFT_ANKLE]
      );
      const rKnee = calculateAngle(
        landmarks[LANDMARKS.RIGHT_HIP],
        landmarks[LANDMARKS.RIGHT_KNEE],
        landmarks[LANDMARKS.RIGHT_ANKLE]
      );
      const kneeAngle = (lKnee + rKnee) / 2;
      angles.knee = kneeAngle;

      if (kneeAngle < 100 && state.phase !== 'down' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'down', lastTransition: now };
      } else if (kneeAngle > 160 && state.phase === 'down' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'up', count: state.count + 1, lastTransition: now };
      }
      break;
    }

    case 'lunge': {
      const frontKnee = calculateAngle(
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_KNEE],
        landmarks[LANDMARKS.LEFT_ANKLE]
      );
      angles.knee = frontKnee;

      if (frontKnee < 100 && state.phase !== 'down' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'down', lastTransition: now };
      } else if (frontKnee > 155 && state.phase === 'down' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'up', count: state.count + 1, lastTransition: now };
      }
      break;
    }

    case 'shoulder_press': {
      const lElbow = calculateAngle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_ELBOW],
        landmarks[LANDMARKS.LEFT_WRIST]
      );
      angles.elbow = lElbow;

      if (lElbow < 90 && state.phase !== 'down' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'down', lastTransition: now };
      } else if (lElbow > 160 && state.phase === 'down' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'up', count: state.count + 1, lastTransition: now };
      }
      break;
    }

    case 'bicep_curl': {
      const lElbow = calculateAngle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_ELBOW],
        landmarks[LANDMARKS.LEFT_WRIST]
      );
      angles.elbow = lElbow;

      if (lElbow < 50 && state.phase !== 'up' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'up', count: state.count + 1, lastTransition: now };
      } else if (lElbow > 150 && state.phase === 'up' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'down', lastTransition: now };
      }
      break;
    }
  }

  return { state, angles };
}
