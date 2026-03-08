/**
 * Exercise recognition layer — detects which exercise posture the user
 * is in before rep counting begins. Uses angle/position rules per exercise.
 */

import { calculateAngle, distance, LANDMARKS, type Point } from './angleUtils';
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
  const lKnee = calculateAngle(lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.LEFT_KNEE], lm[LANDMARKS.LEFT_ANKLE]);
  const rKnee = calculateAngle(lm[LANDMARKS.RIGHT_HIP], lm[LANDMARKS.RIGHT_KNEE], lm[LANDMARKS.RIGHT_ANKLE]);
  const avgKnee = (lKnee + rKnee) / 2;

  // Standing with visible legs, facing camera
  const hipY = (lm[LANDMARKS.LEFT_HIP].y + lm[LANDMARKS.RIGHT_HIP].y) / 2;
  const shoulderY = (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const upright = shoulderY < hipY; // shoulders above hips

  // Legs roughly straight (standing) or already bending (mid-squat)
  const legsVisible = avgKnee > 120 || avgKnee < 110; // standing or squatting
  const match = upright && legsVisible && avgKnee > 60;

  return { match, confidence: match ? Math.min(1, avgKnee / 180) : 0 };
}

/** Check if landmarks look like a pushup position (plank-like, horizontal) */
function detectPushup(lm: Point[]): { match: boolean; confidence: number } {
  const shoulderY = (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY = (lm[LANDMARKS.LEFT_HIP].y + lm[LANDMARKS.RIGHT_HIP].y) / 2;
  const ankleY = (lm[LANDMARKS.LEFT_ANKLE].y + lm[LANDMARKS.RIGHT_ANKLE].y) / 2;

  // Body roughly horizontal — shoulder, hip, ankle at similar Y
  const bodySpread = Math.abs(shoulderY - ankleY);
  const isHorizontal = bodySpread < 0.3;
  
  // Shoulder-hip-ankle alignment
  const bodyAngle = calculateAngle(
    lm[LANDMARKS.LEFT_SHOULDER],
    lm[LANDMARKS.LEFT_HIP],
    lm[LANDMARKS.LEFT_ANKLE]
  );
  const straight = bodyAngle > 140;

  // Wrists near ground level (below shoulders)
  const wristY = (lm[LANDMARKS.LEFT_WRIST].y + lm[LANDMARKS.RIGHT_WRIST].y) / 2;
  const handsDown = wristY > shoulderY - 0.1;

  const match = (isHorizontal || straight) && handsDown;
  return { match, confidence: match ? 0.8 : 0 };
}

/** Check for jumping jack position */
function detectJumpingJack(lm: Point[]): { match: boolean; confidence: number } {
  const shoulderY = (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY = (lm[LANDMARKS.LEFT_HIP].y + lm[LANDMARKS.RIGHT_HIP].y) / 2;
  const upright = shoulderY < hipY;

  // Check foot spread vs shoulder width
  const shoulderWidth = distance(lm[LANDMARKS.LEFT_SHOULDER], lm[LANDMARKS.RIGHT_SHOULDER]);
  const footWidth = distance(lm[LANDMARKS.LEFT_ANKLE], lm[LANDMARKS.RIGHT_ANKLE]);

  // Arms up or at sides — either position is valid as starting
  const lWrist = lm[LANDMARKS.LEFT_WRIST];
  const rWrist = lm[LANDMARKS.RIGHT_WRIST];
  const lShoulder = lm[LANDMARKS.LEFT_SHOULDER];
  const rShoulder = lm[LANDMARKS.RIGHT_SHOULDER];
  const armsUp = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;
  const feetWide = footWidth > shoulderWidth * 1.2;

  // Match if upright and either arms up OR feet spread (or both)
  const match = upright && (armsUp || feetWide);
  return { match, confidence: match ? 0.85 : 0 };
}

/** Check for lunge position */
function detectLunge(lm: Point[]): { match: boolean; confidence: number } {
  const shoulderY = (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY = (lm[LANDMARKS.LEFT_HIP].y + lm[LANDMARKS.RIGHT_HIP].y) / 2;
  const upright = shoulderY < hipY;

  // One foot forward, one back — check ankle X spread
  const ankleSpread = Math.abs(lm[LANDMARKS.LEFT_ANKLE].x - lm[LANDMARKS.RIGHT_ANKLE].x);
  const staggered = ankleSpread > 0.1;

  // Or just standing (ready to lunge)
  const lKnee = calculateAngle(lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.LEFT_KNEE], lm[LANDMARKS.LEFT_ANKLE]);

  const match = upright && (staggered || lKnee > 140);
  return { match, confidence: match ? 0.75 : 0 };
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
