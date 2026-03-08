/**
 * State-machine rep counter with strict validation.
 * Uses peak/valley detection + ROM checks + visibility gating
 * to prevent false positives from random movements.
 */

import { calculateAngle, isVisible, LANDMARKS, type Point } from './angleUtils';

export type ExerciseType = 'pushup' | 'squat' | 'lunge' | 'shoulder_press' | 'bicep_curl' | 'jumping_jack' | 'high_knee' | 'deadlift' | 'plank_hold' | 'tricep_dip';

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

interface RepState {
  phase: 'up' | 'down' | 'idle';
  count: number;
  lastTransition: number;
  /** Track the extreme angle reached in current phase for ROM validation */
  peakAngle: number;
  valleyAngle: number;
  /** Rolling history of primary angle (last N frames) for smoothing */
  angleHistory: number[];
  /** Consecutive frames the user has been in a valid exercise posture */
  validPostureFrames: number;
  /** Flags if user left valid posture mid-rep (invalidates the rep) */
  postureBreak: boolean;
}

const DEBOUNCE_MS = 500; // increased from 300
const ANGLE_HISTORY_SIZE = 5;
const MIN_VALID_POSTURE_FRAMES = 3; // must maintain posture for 3+ frames

export function createRepState(): RepState {
  return {
    phase: 'idle',
    count: 0,
    lastTransition: 0,
    peakAngle: 0,
    valleyAngle: 180,
    angleHistory: [],
    validPostureFrames: 0,
    postureBreak: false,
  };
}

/** Smooth an angle by averaging with recent history */
function smoothAngle(angle: number, history: number[]): { smoothed: number; newHistory: number[] } {
  const newHistory = [...history, angle].slice(-ANGLE_HISTORY_SIZE);
  const smoothed = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
  return { smoothed, newHistory };
}

/** Check if required landmarks are visible for a given exercise */
function checkVisibility(landmarks: Point[], exerciseType: ExerciseType): boolean {
  const threshold = 0.4;
  switch (exerciseType) {
    case 'pushup':
    case 'tricep_dip':
      return (
        isVisible(landmarks[LANDMARKS.LEFT_SHOULDER], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_ELBOW], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_WRIST], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_HIP], threshold)
      );
    case 'squat':
    case 'lunge':
    case 'deadlift':
      return (
        isVisible(landmarks[LANDMARKS.LEFT_HIP], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_KNEE], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_ANKLE], threshold) &&
        isVisible(landmarks[LANDMARKS.RIGHT_HIP], threshold) &&
        isVisible(landmarks[LANDMARKS.RIGHT_KNEE], threshold)
      );
    case 'shoulder_press':
    case 'bicep_curl':
      return (
        isVisible(landmarks[LANDMARKS.LEFT_SHOULDER], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_ELBOW], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_WRIST], threshold)
      );
    case 'jumping_jack':
      return (
        isVisible(landmarks[LANDMARKS.LEFT_SHOULDER], threshold) &&
        isVisible(landmarks[LANDMARKS.RIGHT_SHOULDER], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_WRIST], threshold) &&
        isVisible(landmarks[LANDMARKS.RIGHT_WRIST], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_ANKLE], threshold) &&
        isVisible(landmarks[LANDMARKS.RIGHT_ANKLE], threshold)
      );
    case 'high_knee':
      return (
        isVisible(landmarks[LANDMARKS.LEFT_HIP], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_KNEE], threshold) &&
        isVisible(landmarks[LANDMARKS.RIGHT_HIP], threshold) &&
        isVisible(landmarks[LANDMARKS.RIGHT_KNEE], threshold)
      );
    case 'plank_hold':
      return (
        isVisible(landmarks[LANDMARKS.LEFT_SHOULDER], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_HIP], threshold) &&
        isVisible(landmarks[LANDMARKS.LEFT_ANKLE], threshold)
      );
    default:
      return true;
  }
}

// --- Exercise-specific thresholds with hysteresis ---
// [downThreshold, upThreshold, minROM]
// downThreshold: angle must go BELOW this to enter 'down'
// upThreshold: angle must go ABOVE this to complete rep (enter 'up')
// minROM: minimum range of motion (peak - valley) required to count rep

interface ExerciseThresholds {
  downThreshold: number;
  upThreshold: number;
  minROM: number;
}

const THRESHOLDS: Partial<Record<ExerciseType, ExerciseThresholds>> = {
  pushup:         { downThreshold: 100, upThreshold: 150, minROM: 40 },
  squat:          { downThreshold: 100, upThreshold: 150, minROM: 40 },
  lunge:          { downThreshold: 110, upThreshold: 145, minROM: 30 },
  shoulder_press: { downThreshold: 95,  upThreshold: 150, minROM: 45 },
  bicep_curl:     { downThreshold: 60,  upThreshold: 140, minROM: 60 },
  deadlift:       { downThreshold: 110, upThreshold: 155, minROM: 35 },
  tricep_dip:     { downThreshold: 100, upThreshold: 140, minROM: 30 },
};

/**
 * Process a frame and update rep state.
 * Returns updated state and current angles for form analysis.
 */
export function processFrame(
  landmarks: Point[],
  exerciseType: ExerciseType,
  state: RepState
): { state: RepState; angles: Record<string, number> } {
  const now = Date.now();
  const angles: Record<string, number> = {};

  // Gate: check landmark visibility first
  if (!checkVisibility(landmarks, exerciseType)) {
    return {
      state: { ...state, validPostureFrames: 0, postureBreak: true },
      angles,
    };
  }

  switch (exerciseType) {
    case 'pushup': {
      const lElbow = calculateAngle(landmarks[LANDMARKS.LEFT_SHOULDER], landmarks[LANDMARKS.LEFT_ELBOW], landmarks[LANDMARKS.LEFT_WRIST]);
      const rElbow = calculateAngle(landmarks[LANDMARKS.RIGHT_SHOULDER], landmarks[LANDMARKS.RIGHT_ELBOW], landmarks[LANDMARKS.RIGHT_WRIST]);
      const rawAngle = (lElbow + rElbow) / 2;

      const bodyAngle = calculateAngle(landmarks[LANDMARKS.LEFT_SHOULDER], landmarks[LANDMARKS.LEFT_HIP], landmarks[LANDMARKS.LEFT_ANKLE]);
      angles.body = bodyAngle;
      const bodyStraight = bodyAngle > 140;

      // Must maintain plank posture
      if (!bodyStraight) {
        return { state: { ...state, validPostureFrames: 0, postureBreak: true }, angles };
      }

      const { smoothed, newHistory } = smoothAngle(rawAngle, state.angleHistory);
      angles.elbow = smoothed;

      state = processAngleBasedRep(state, smoothed, newHistory, now, exerciseType);
      break;
    }

    case 'squat': {
      const lKnee = calculateAngle(landmarks[LANDMARKS.LEFT_HIP], landmarks[LANDMARKS.LEFT_KNEE], landmarks[LANDMARKS.LEFT_ANKLE]);
      const rKnee = calculateAngle(landmarks[LANDMARKS.RIGHT_HIP], landmarks[LANDMARKS.RIGHT_KNEE], landmarks[LANDMARKS.RIGHT_ANKLE]);
      const rawAngle = (lKnee + rKnee) / 2;

      // Must be upright (shoulders above hips)
      const hipY = (landmarks[LANDMARKS.LEFT_HIP].y + landmarks[LANDMARKS.RIGHT_HIP].y) / 2;
      const shoulderY = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
      if (shoulderY >= hipY) {
        return { state: { ...state, validPostureFrames: 0, postureBreak: true }, angles };
      }

      const { smoothed, newHistory } = smoothAngle(rawAngle, state.angleHistory);
      angles.knee = smoothed;

      state = processAngleBasedRep(state, smoothed, newHistory, now, exerciseType);
      break;
    }

    case 'lunge': {
      const frontKnee = calculateAngle(landmarks[LANDMARKS.LEFT_HIP], landmarks[LANDMARKS.LEFT_KNEE], landmarks[LANDMARKS.LEFT_ANKLE]);
      const backKnee = calculateAngle(landmarks[LANDMARKS.RIGHT_HIP], landmarks[LANDMARKS.RIGHT_KNEE], landmarks[LANDMARKS.RIGHT_ANKLE]);

      // Validate staggered stance
      const ankleSpread = Math.abs(landmarks[LANDMARKS.LEFT_ANKLE].x - landmarks[LANDMARKS.RIGHT_ANKLE].x);
      if (ankleSpread < 0.05) {
        return { state: { ...state, validPostureFrames: 0, postureBreak: true }, angles };
      }

      const rawAngle = frontKnee;
      angles.knee = frontKnee;
      angles.backKnee = backKnee;

      const { smoothed, newHistory } = smoothAngle(rawAngle, state.angleHistory);
      state = processAngleBasedRep(state, smoothed, newHistory, now, exerciseType);
      break;
    }

    case 'shoulder_press': {
      const lElbow = calculateAngle(landmarks[LANDMARKS.LEFT_SHOULDER], landmarks[LANDMARKS.LEFT_ELBOW], landmarks[LANDMARKS.LEFT_WRIST]);
      const rElbow = calculateAngle(landmarks[LANDMARKS.RIGHT_SHOULDER], landmarks[LANDMARKS.RIGHT_ELBOW], landmarks[LANDMARKS.RIGHT_WRIST]);
      const rawAngle = (lElbow + rElbow) / 2;

      // Wrists must be above shoulders at top
      const wristAbove = landmarks[LANDMARKS.LEFT_WRIST].y < landmarks[LANDMARKS.LEFT_SHOULDER].y;

      const { smoothed, newHistory } = smoothAngle(rawAngle, state.angleHistory);
      angles.elbow = smoothed;

      // Only count if arms actually go overhead
      if (smoothed > 150 && !wristAbove) {
        return { state: { ...state, angleHistory: newHistory, validPostureFrames: state.validPostureFrames + 1, postureBreak: false }, angles };
      }

      state = processAngleBasedRep(state, smoothed, newHistory, now, exerciseType);
      break;
    }

    case 'bicep_curl': {
      const lElbow = calculateAngle(landmarks[LANDMARKS.LEFT_SHOULDER], landmarks[LANDMARKS.LEFT_ELBOW], landmarks[LANDMARKS.LEFT_WRIST]);
      const rElbow = calculateAngle(landmarks[LANDMARKS.RIGHT_SHOULDER], landmarks[LANDMARKS.RIGHT_ELBOW], landmarks[LANDMARKS.RIGHT_WRIST]);
      const rawAngle = (lElbow + rElbow) / 2;

      // Upper arm must stay relatively still (elbow near body)
      const elbowDrift = Math.abs(landmarks[LANDMARKS.LEFT_SHOULDER].x - landmarks[LANDMARKS.LEFT_ELBOW].x);
      if (elbowDrift > 0.12) {
        return { state: { ...state, validPostureFrames: 0, postureBreak: true }, angles };
      }

      const { smoothed, newHistory } = smoothAngle(rawAngle, state.angleHistory);
      angles.elbow = smoothed;

      // Bicep curl is inverted: down is high angle, up (curled) is low angle
      state = processAngleBasedRep(state, smoothed, newHistory, now, exerciseType);
      break;
    }

    case 'jumping_jack': {
      const lWrist = landmarks[LANDMARKS.LEFT_WRIST];
      const rWrist = landmarks[LANDMARKS.RIGHT_WRIST];
      const lShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
      const rShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
      const lAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
      const rAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

      const armsUp = lWrist.y < lShoulder.y - 0.05 && rWrist.y < rShoulder.y - 0.05;
      const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);
      const footWidth = Math.abs(lAnkle.x - rAnkle.x);
      const feetWide = footWidth > shoulderWidth * 1.3;

      // Must be upright
      const hipY = (landmarks[LANDMARKS.LEFT_HIP].y + landmarks[LANDMARKS.RIGHT_HIP].y) / 2;
      const shoulderY = (lShoulder.y + rShoulder.y) / 2;
      if (shoulderY >= hipY) {
        return { state: { ...state, validPostureFrames: 0, postureBreak: true }, angles };
      }

      angles.armSpread = armsUp ? 1 : 0;
      angles.feetSpread = feetWide ? 1 : 0;

      // Both conditions must be met simultaneously for "up" phase
      const isOpen = armsUp && feetWide;
      const isClosed = !armsUp && !feetWide;

      if (isOpen && state.phase !== 'up' && now - state.lastTransition > DEBOUNCE_MS) {
        state = { ...state, phase: 'up', lastTransition: now, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
      } else if (isClosed && state.phase === 'up' && now - state.lastTransition > DEBOUNCE_MS) {
        // Only count on full close after full open
        state = { ...state, phase: 'down', count: state.count + 1, lastTransition: now, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
      } else {
        state = { ...state, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
      }
      break;
    }

    case 'high_knee': {
      const lKnee = landmarks[LANDMARKS.LEFT_KNEE];
      const rKnee = landmarks[LANDMARKS.RIGHT_KNEE];
      const lHip = landmarks[LANDMARKS.LEFT_HIP];
      const rHip = landmarks[LANDMARKS.RIGHT_HIP];

      // Knee must be significantly above hip (not just slightly)
      const lKneeUp = lKnee.y < lHip.y - 0.03;
      const rKneeUp = rKnee.y < rHip.y - 0.03;
      const kneeUp = lKneeUp || rKneeUp;
      angles.kneeHeight = kneeUp ? 1 : 0;

      // Must be upright
      const shoulderY = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
      const hipY = (lHip.y + rHip.y) / 2;
      if (shoulderY >= hipY) {
        return { state: { ...state, validPostureFrames: 0, postureBreak: true }, angles };
      }

      if (kneeUp && state.phase !== 'up' && now - state.lastTransition > 350) {
        state = { ...state, phase: 'up', lastTransition: now, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
      } else if (!kneeUp && state.phase === 'up' && now - state.lastTransition > 200) {
        state = { ...state, phase: 'down', count: state.count + 1, lastTransition: now, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
      } else {
        state = { ...state, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
      }
      break;
    }

    case 'deadlift': {
      const hipAngle = calculateAngle(landmarks[LANDMARKS.LEFT_SHOULDER], landmarks[LANDMARKS.LEFT_HIP], landmarks[LANDMARKS.LEFT_KNEE]);
      const rawAngle = hipAngle;
      angles.hip = rawAngle;

      // Back must stay relatively straight
      const backAngle = calculateAngle(landmarks[LANDMARKS.LEFT_SHOULDER], landmarks[LANDMARKS.LEFT_HIP], landmarks[LANDMARKS.LEFT_ANKLE]);
      if (backAngle < 90) {
        return { state: { ...state, validPostureFrames: 0, postureBreak: true }, angles };
      }

      const { smoothed, newHistory } = smoothAngle(rawAngle, state.angleHistory);
      state = processAngleBasedRep(state, smoothed, newHistory, now, exerciseType);
      break;
    }

    case 'plank_hold': {
      const hipAngle = calculateAngle(landmarks[LANDMARKS.LEFT_SHOULDER], landmarks[LANDMARKS.LEFT_HIP], landmarks[LANDMARKS.LEFT_ANKLE]);
      angles.hip = hipAngle;
      const isHolding = hipAngle > 150 && hipAngle < 195;

      if (isHolding && now - state.lastTransition > 1000) {
        state = { ...state, phase: 'up', count: state.count + 1, lastTransition: now, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
      } else if (isHolding) {
        state = { ...state, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
      } else {
        state = { ...state, validPostureFrames: 0, postureBreak: true };
      }
      break;
    }

    case 'tricep_dip': {
      const lElbow = calculateAngle(landmarks[LANDMARKS.LEFT_SHOULDER], landmarks[LANDMARKS.LEFT_ELBOW], landmarks[LANDMARKS.LEFT_WRIST]);
      const rElbow = calculateAngle(landmarks[LANDMARKS.RIGHT_SHOULDER], landmarks[LANDMARKS.RIGHT_ELBOW], landmarks[LANDMARKS.RIGHT_WRIST]);
      const rawAngle = (lElbow + rElbow) / 2;
      angles.elbow = rawAngle;

      const { smoothed, newHistory } = smoothAngle(rawAngle, state.angleHistory);
      state = processAngleBasedRep(state, smoothed, newHistory, now, exerciseType);
      break;
    }
  }

  return { state, angles };
}

/**
 * Core rep detection using angle thresholds + ROM validation + hysteresis.
 * Works for exercises that follow a down→up angle pattern.
 */
function processAngleBasedRep(
  state: RepState,
  angle: number,
  angleHistory: number[],
  now: number,
  exerciseType: ExerciseType
): RepState {
  const t = THRESHOLDS[exerciseType];
  if (!t) return { ...state, angleHistory };

  // Track peak (highest angle in 'up' phase) and valley (lowest in 'down' phase)
  const peakAngle = Math.max(state.peakAngle, angle);
  const valleyAngle = Math.min(state.valleyAngle, angle);

  // Idle → detect first direction
  if (state.phase === 'idle') {
    if (angle < t.downThreshold) {
      return { ...state, phase: 'down', lastTransition: now, valleyAngle: angle, peakAngle: 0, angleHistory, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
    }
    if (angle > t.upThreshold) {
      return { ...state, phase: 'up', lastTransition: now, peakAngle: angle, valleyAngle: 180, angleHistory, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
    }
    return { ...state, angleHistory, validPostureFrames: state.validPostureFrames + 1, postureBreak: false };
  }

  // Up → Down transition
  if (state.phase === 'up' && angle < t.downThreshold && now - state.lastTransition > DEBOUNCE_MS) {
    return {
      ...state,
      phase: 'down',
      lastTransition: now,
      valleyAngle: angle,
      peakAngle,
      angleHistory,
      validPostureFrames: state.validPostureFrames + 1,
      postureBreak: false,
    };
  }

  // Down → Up transition (this is where we COUNT the rep)
  if (state.phase === 'down' && angle > t.upThreshold && now - state.lastTransition > DEBOUNCE_MS) {
    const rom = peakAngle > 0 ? (peakAngle - valleyAngle) : (angle - valleyAngle);
    const romValid = rom >= t.minROM;
    const postureValid = !state.postureBreak && state.validPostureFrames >= MIN_VALID_POSTURE_FRAMES;

    if (romValid && postureValid) {
      return {
        ...state,
        phase: 'up',
        count: state.count + 1,
        lastTransition: now,
        peakAngle: angle,
        valleyAngle: 180,
        angleHistory,
        validPostureFrames: state.validPostureFrames + 1,
        postureBreak: false,
      };
    }
    // ROM not sufficient or posture broke — reset phase but don't count
    return {
      ...state,
      phase: 'up',
      lastTransition: now,
      peakAngle: angle,
      valleyAngle: 180,
      angleHistory,
      validPostureFrames: state.validPostureFrames + 1,
      postureBreak: false,
    };
  }

  // Track extremes within current phase
  return {
    ...state,
    peakAngle,
    valleyAngle,
    angleHistory,
    validPostureFrames: state.validPostureFrames + 1,
    postureBreak: false,
  };
}
