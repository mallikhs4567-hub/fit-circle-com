/**
 * Analyzes exercise form quality and returns a score 0-100.
 * Checks back alignment, depth, symmetry, and stability.
 */

import { calculateAngle, distance, LANDMARKS, type Point } from './angleUtils';
import type { ExerciseType } from './repCounter';

export interface FormResult {
  score: number;
  mistakes: string[];
  tips: string[];
}

export function analyzeForm(
  landmarks: Point[],
  exerciseType: ExerciseType,
  angles: Record<string, number>
): FormResult {
  const mistakes: string[] = [];
  const tips: string[] = [];
  let score = 100;

  // Common: check back alignment (shoulder-hip line)
  const backAngle = calculateAngle(
    landmarks[LANDMARKS.LEFT_SHOULDER],
    landmarks[LANDMARKS.LEFT_HIP],
    landmarks[LANDMARKS.LEFT_KNEE]
  );

  // Symmetry check
  const leftShoulderY = landmarks[LANDMARKS.LEFT_SHOULDER].y;
  const rightShoulderY = landmarks[LANDMARKS.RIGHT_SHOULDER].y;
  const shoulderDiff = Math.abs(leftShoulderY - rightShoulderY);
  
  if (shoulderDiff > 0.05) {
    score -= 10;
    mistakes.push('Shoulders uneven');
    tips.push('Keep both shoulders level');
  }

  switch (exerciseType) {
    case 'pushup': {
      // Back should be straight (hip angle ~170-180)
      if (backAngle < 150) {
        score -= 20;
        mistakes.push('Hips sagging');
        tips.push('Engage your core, keep body straight');
      } else if (backAngle > 190) {
        score -= 15;
        mistakes.push('Hips too high');
        tips.push('Lower your hips to form a straight line');
      }
      // Depth check
      if (angles.elbow && angles.elbow > 110) {
        score -= 15;
        mistakes.push('Not going low enough');
        tips.push('Bend elbows to at least 90°');
      }
      break;
    }

    case 'squat': {
      // Knee should not pass too far over toes
      const kneeX = landmarks[LANDMARKS.LEFT_KNEE].x;
      const ankleX = landmarks[LANDMARKS.LEFT_ANKLE].x;
      if (Math.abs(kneeX - ankleX) > 0.1) {
        score -= 10;
        mistakes.push('Knees extending past toes');
        tips.push('Push hips back, keep knees behind toes');
      }
      // Depth
      if (angles.knee && angles.knee > 120) {
        score -= 15;
        mistakes.push('Squat too shallow');
        tips.push('Go deeper — aim for parallel');
      }
      // Back upright
      if (backAngle < 140) {
        score -= 15;
        mistakes.push('Leaning too far forward');
        tips.push('Keep chest up and back straight');
      }
      break;
    }

    case 'lunge': {
      if (angles.knee && angles.knee > 120) {
        score -= 15;
        mistakes.push('Front knee not bending enough');
        tips.push('Drop down until thigh is parallel to ground');
      }
      if (backAngle < 155) {
        score -= 10;
        mistakes.push('Torso leaning forward');
        tips.push('Keep your torso upright');
      }
      break;
    }

    case 'shoulder_press': {
      // Wrist should be above elbow at top
      if (backAngle < 160) {
        score -= 15;
        mistakes.push('Core not engaged');
        tips.push('Tighten core, avoid arching back');
      }
      break;
    }

    case 'bicep_curl': {
      // Upper arm should stay still
      const shoulderX = landmarks[LANDMARKS.LEFT_SHOULDER].x;
      const elbowX = landmarks[LANDMARKS.LEFT_ELBOW].x;
      if (Math.abs(shoulderX - elbowX) > 0.08) {
        score -= 15;
        mistakes.push('Swinging arms');
        tips.push('Keep upper arms pinned to your sides');
      }
      break;
    }
  }

  return { score: Math.max(0, score), mistakes, tips };
}

/** Get XP multiplier based on form score */
export function getXPMultiplier(formScore: number): number {
  if (formScore >= 90) return 1.2;
  if (formScore >= 75) return 1.0;
  return 0.7;
}
