/**
 * Exercise recognition layer — detects which exercise posture the user
 * is in before rep counting begins. Uses angle/position rules per exercise.
 */

import { calculateAngle, distance, isVisible, LANDMARKS, type Point } from './angleUtils';
import type { ExerciseType } from './repCounter';

export interface RecognitionResult {
  recognized: boolean;
  exercise: ExerciseType | null;
  confidence: number; // 0-1
  message: string;
}

/** Number of consecutive matching frames needed to confirm recognition */
const CONFIRM_FRAMES = 12;

interface RecognitionState {
  matchCount: number;
  lastMatch: ExerciseType | null;
  confirmed: boolean;
  confirmedExercise: ExerciseType | null;
}

export function createRecognitionState(): RecognitionState {
  return { matchCount: 0, lastMatch: null, confirmed: false, confirmedExercise: null };
}

/** Check if landmarks look like a squat starting position (standing upright) */
function detectSquat(lm: Point[]): { match: boolean; confidence: number } {
  if (!isVisible(lm[LANDMARKS.LEFT_HIP]) || !isVisible(lm[LANDMARKS.LEFT_KNEE]) || !isVisible(lm[LANDMARKS.LEFT_ANKLE]) || !isVisible(lm[LANDMARKS.RIGHT_KNEE])) {
    return { match: false, confidence: 0 };
  }

  const lKnee = calculateAngle(lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.LEFT_KNEE], lm[LANDMARKS.LEFT_ANKLE]);
  const rKnee = calculateAngle(lm[LANDMARKS.RIGHT_HIP], lm[LANDMARKS.RIGHT_KNEE], lm[LANDMARKS.RIGHT_ANKLE]);
  const avgKnee = (lKnee + rKnee) / 2;

  const hipY = (lm[LANDMARKS.LEFT_HIP].y + lm[LANDMARKS.RIGHT_HIP].y) / 2;
  const shoulderY = (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const upright = shoulderY < hipY - 0.03;

  // Feet roughly shoulder width apart
  const shoulderWidth = Math.abs(lm[LANDMARKS.LEFT_SHOULDER].x - lm[LANDMARKS.RIGHT_SHOULDER].x);
  const footWidth = Math.abs(lm[LANDMARKS.LEFT_ANKLE].x - lm[LANDMARKS.RIGHT_ANKLE].x);
  const feetReasonable = footWidth > shoulderWidth * 0.5 && footWidth < shoulderWidth * 2.5;

  const legsReady = avgKnee > 140; // must be standing relatively straight
  const match = upright && legsReady && feetReasonable;

  return { match, confidence: match ? Math.min(1, avgKnee / 180) : 0 };
}

/** Check if landmarks look like a pushup position (plank-like, horizontal) */
function detectPushup(lm: Point[]): { match: boolean; confidence: number } {
  if (!isVisible(lm[LANDMARKS.LEFT_SHOULDER]) || !isVisible(lm[LANDMARKS.LEFT_HIP]) || !isVisible(lm[LANDMARKS.LEFT_ANKLE]) || !isVisible(lm[LANDMARKS.LEFT_WRIST])) {
    return { match: false, confidence: 0 };
  }

  // Body roughly horizontal — shoulder, hip, ankle at similar Y
  const shoulderY = (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const ankleY = (lm[LANDMARKS.LEFT_ANKLE].y + lm[LANDMARKS.RIGHT_ANKLE].y) / 2;
  const bodySpread = Math.abs(shoulderY - ankleY);
  const isHorizontal = bodySpread < 0.25;

  // Shoulder-hip-ankle alignment (must be straight)
  const bodyAngle = calculateAngle(lm[LANDMARKS.LEFT_SHOULDER], lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.LEFT_ANKLE]);
  const straight = bodyAngle > 145;

  // Wrists near or below shoulders (supporting body)
  const wristY = (lm[LANDMARKS.LEFT_WRIST].y + lm[LANDMARKS.RIGHT_WRIST].y) / 2;
  const handsDown = wristY > shoulderY - 0.08;

  // Arms must be extended (not just lying down)
  const elbowAngle = calculateAngle(lm[LANDMARKS.LEFT_SHOULDER], lm[LANDMARKS.LEFT_ELBOW], lm[LANDMARKS.LEFT_WRIST]);
  const armsExtended = elbowAngle > 120;

  const match = (isHorizontal || straight) && handsDown && armsExtended;
  return { match, confidence: match ? 0.85 : 0 };
}

/** Check for jumping jack starting position */
function detectJumpingJack(lm: Point[]): { match: boolean; confidence: number } {
  if (!isVisible(lm[LANDMARKS.LEFT_SHOULDER]) || !isVisible(lm[LANDMARKS.RIGHT_SHOULDER]) || !isVisible(lm[LANDMARKS.LEFT_ANKLE]) || !isVisible(lm[LANDMARKS.RIGHT_ANKLE])) {
    return { match: false, confidence: 0 };
  }

  const shoulderY = (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY = (lm[LANDMARKS.LEFT_HIP].y + lm[LANDMARKS.RIGHT_HIP].y) / 2;
  const upright = shoulderY < hipY - 0.03;

  // Must see full body standing
  const ankleY = (lm[LANDMARKS.LEFT_ANKLE].y + lm[LANDMARKS.RIGHT_ANKLE].y) / 2;
  const fullBodyVisible = ankleY > hipY;

  // Arms at sides (starting position) — wrists near hips
  const lWristNearHip = Math.abs(lm[LANDMARKS.LEFT_WRIST].y - lm[LANDMARKS.LEFT_HIP].y) < 0.15;
  const rWristNearHip = Math.abs(lm[LANDMARKS.RIGHT_WRIST].y - lm[LANDMARKS.RIGHT_HIP].y) < 0.15;
  const armsAtSides = lWristNearHip && rWristNearHip;

  // Feet together (starting) OR already in jack position
  const shoulderWidth = Math.abs(lm[LANDMARKS.LEFT_SHOULDER].x - lm[LANDMARKS.RIGHT_SHOULDER].x);
  const footWidth = Math.abs(lm[LANDMARKS.LEFT_ANKLE].x - lm[LANDMARKS.RIGHT_ANKLE].x);
  const feetTogether = footWidth < shoulderWidth * 1.1;

  const armsUp = lm[LANDMARKS.LEFT_WRIST].y < lm[LANDMARKS.LEFT_SHOULDER].y - 0.05 && lm[LANDMARKS.RIGHT_WRIST].y < lm[LANDMARKS.RIGHT_SHOULDER].y - 0.05;
  const feetWide = footWidth > shoulderWidth * 1.3;

  // Match: upright with full body AND (standing ready OR in jack position)
  const match = upright && fullBodyVisible && ((armsAtSides && feetTogether) || (armsUp && feetWide));
  return { match, confidence: match ? 0.85 : 0 };
}

/** Check for lunge starting position */
function detectLunge(lm: Point[]): { match: boolean; confidence: number } {
  if (!isVisible(lm[LANDMARKS.LEFT_HIP]) || !isVisible(lm[LANDMARKS.LEFT_KNEE]) || !isVisible(lm[LANDMARKS.LEFT_ANKLE])) {
    return { match: false, confidence: 0 };
  }

  const shoulderY = (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY = (lm[LANDMARKS.LEFT_HIP].y + lm[LANDMARKS.RIGHT_HIP].y) / 2;
  const upright = shoulderY < hipY - 0.03;

  // Standing with legs straight (ready to lunge)
  const lKnee = calculateAngle(lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.LEFT_KNEE], lm[LANDMARKS.LEFT_ANKLE]);
  const rKnee = calculateAngle(lm[LANDMARKS.RIGHT_HIP], lm[LANDMARKS.RIGHT_KNEE], lm[LANDMARKS.RIGHT_ANKLE]);
  const legsReady = lKnee > 145 && rKnee > 145;

  // Or already in staggered stance
  const ankleSpread = Math.abs(lm[LANDMARKS.LEFT_ANKLE].x - lm[LANDMARKS.RIGHT_ANKLE].x);
  const staggered = ankleSpread > 0.12;

  const match = upright && (legsReady || staggered);
  return { match, confidence: match ? 0.8 : 0 };
}

const DETECTORS: Record<string, (lm: Point[]) => { match: boolean; confidence: number }> = {
  squat: detectSquat,
  pushup: detectPushup,
  jumping_jack: detectJumpingJack,
  lunge: detectLunge,
};

/**
 * Process a frame for exercise recognition. Call this BEFORE rep counting.
 * Once confirmed, stays confirmed until reset.
 */
export function recognizeExercise(
  landmarks: Point[],
  targetExercise: ExerciseType,
  state: RecognitionState
): { state: RecognitionState; result: RecognitionResult } {
  // Already confirmed
  if (state.confirmed) {
    return {
      state,
      result: {
        recognized: true,
        exercise: state.confirmedExercise,
        confidence: 1,
        message: `${state.confirmedExercise} detected — counting reps`,
      },
    };
  }

  const detector = DETECTORS[targetExercise];
  
  // For exercises without a detector, auto-confirm
  if (!detector) {
    const confirmed: RecognitionState = {
      matchCount: CONFIRM_FRAMES,
      lastMatch: targetExercise,
      confirmed: true,
      confirmedExercise: targetExercise,
    };
    return {
      state: confirmed,
      result: { recognized: true, exercise: targetExercise, confidence: 1, message: 'Ready' },
    };
  }

  const { match, confidence } = detector(landmarks);

  if (match) {
    const newCount = state.lastMatch === targetExercise ? state.matchCount + 1 : 1;
    
    if (newCount >= CONFIRM_FRAMES) {
      return {
        state: { matchCount: newCount, lastMatch: targetExercise, confirmed: true, confirmedExercise: targetExercise },
        result: { recognized: true, exercise: targetExercise, confidence, message: 'Exercise recognized — start!' },
      };
    }

    return {
      state: { ...state, matchCount: newCount, lastMatch: targetExercise },
      result: {
        recognized: false,
        exercise: null,
        confidence: newCount / CONFIRM_FRAMES,
        message: `Getting into position... (${Math.round((newCount / CONFIRM_FRAMES) * 100)}%)`,
      },
    };
  }

  return {
    state: { ...state, matchCount: Math.max(0, state.matchCount - 1), lastMatch: null },
    result: { recognized: false, exercise: null, confidence: 0, message: 'Exercise not recognized' },
  };
}
