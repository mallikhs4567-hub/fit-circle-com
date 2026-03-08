/**
 * Analyzes exercise form quality and returns a score 0-100.
 * Performs deep validation: back alignment, depth, symmetry,
 * body orientation, and exercise-specific posture checks.
 */

import { calculateAngle, distance, LANDMARKS, type Point } from './angleUtils';
import type { ExerciseType } from './repCounter';

export interface FormResult {
  score: number;
  mistakes: string[];
  tips: string[];
}

/** Helper: average Y of two landmarks */
function avgY(lm: Point[], a: number, b: number): number {
  return (lm[a].y + lm[b].y) / 2;
}

export function analyzeForm(
  landmarks: Point[],
  exerciseType: ExerciseType,
  angles: Record<string, number>
): FormResult {
  const mistakes: string[] = [];
  const tips: string[] = [];
  let score = 100;

  // --- Common checks ---

  // Shoulder symmetry
  const shoulderDiff = Math.abs(landmarks[LANDMARKS.LEFT_SHOULDER].y - landmarks[LANDMARKS.RIGHT_SHOULDER].y);
  if (shoulderDiff > 0.06) {
    score -= 10;
    mistakes.push('Shoulders uneven');
    tips.push('Keep both shoulders level and square');
  }

  // Hip symmetry
  const hipDiff = Math.abs(landmarks[LANDMARKS.LEFT_HIP].y - landmarks[LANDMARKS.RIGHT_HIP].y);
  if (hipDiff > 0.06) {
    score -= 8;
    mistakes.push('Hips tilted');
    tips.push('Keep your hips level throughout the movement');
  }

  // Back alignment (shoulder-hip-knee)
  const backAngle = calculateAngle(
    landmarks[LANDMARKS.LEFT_SHOULDER],
    landmarks[LANDMARKS.LEFT_HIP],
    landmarks[LANDMARKS.LEFT_KNEE]
  );

  switch (exerciseType) {
    case 'pushup': {
      // Body alignment (plank line)
      const bodyAngle = angles.body ?? calculateAngle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_ANKLE]
      );
      if (bodyAngle < 145) {
        score -= 25;
        mistakes.push('Hips sagging — core not engaged');
        tips.push('Tighten your core and glutes to maintain a straight line');
      } else if (bodyAngle > 195) {
        score -= 18;
        mistakes.push('Hips piking up');
        tips.push('Lower your hips to form a straight plank');
      }

      // Elbow depth
      if (angles.elbow !== undefined && angles.elbow > 115) {
        score -= 15;
        mistakes.push('Not going deep enough');
        tips.push('Lower your chest until elbows reach at least 90°');
      }

      // Elbow flare (elbows shouldn't splay too wide)
      const lElbowX = landmarks[LANDMARKS.LEFT_ELBOW].x;
      const lShoulderX = landmarks[LANDMARKS.LEFT_SHOULDER].x;
      const elbowFlare = Math.abs(lElbowX - lShoulderX);
      if (elbowFlare > 0.12) {
        score -= 10;
        mistakes.push('Elbows flaring out');
        tips.push('Keep elbows at about 45° to your body');
      }

      // Head position (nose shouldn't drop too far below shoulders)
      const noseY = landmarks[LANDMARKS.NOSE].y;
      const shoulderY = avgY(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER);
      if (noseY > shoulderY + 0.08) {
        score -= 8;
        mistakes.push('Head dropping');
        tips.push('Keep your head in line with your spine');
      }
      break;
    }

    case 'squat': {
      // Depth check
      if (angles.knee !== undefined && angles.knee > 120) {
        score -= 18;
        mistakes.push('Squat too shallow');
        tips.push('Go deeper — aim for thighs parallel to the ground');
      }

      // Knee tracking (shouldn't cave inward)
      const lKneeX = landmarks[LANDMARKS.LEFT_KNEE].x;
      const lAnkleX = landmarks[LANDMARKS.LEFT_ANKLE].x;
      const kneeOverToe = Math.abs(lKneeX - lAnkleX);
      if (kneeOverToe > 0.08) {
        score -= 12;
        mistakes.push('Knees caving or extending past toes');
        tips.push('Push knees outward in line with your toes');
      }

      // Torso lean
      if (backAngle < 135) {
        score -= 18;
        mistakes.push('Leaning too far forward');
        tips.push('Keep your chest up and back straight');
      }

      // Heel rise (ankle Y vs starting — approximation using ankle visibility)
      const ankleVis = landmarks[LANDMARKS.LEFT_ANKLE].visibility ?? 1;
      if (ankleVis < 0.3) {
        score -= 5;
        tips.push('Keep your heels on the ground');
      }

      // Weight distribution (shoulder X should be between ankles)
      const shoulderCenterX = (landmarks[LANDMARKS.LEFT_SHOULDER].x + landmarks[LANDMARKS.RIGHT_SHOULDER].x) / 2;
      const ankleCenterX = (landmarks[LANDMARKS.LEFT_ANKLE].x + landmarks[LANDMARKS.RIGHT_ANKLE].x) / 2;
      if (Math.abs(shoulderCenterX - ankleCenterX) > 0.1) {
        score -= 8;
        mistakes.push('Weight shifting to one side');
        tips.push('Keep weight centered over both feet');
      }
      break;
    }

    case 'lunge': {
      if (angles.knee !== undefined && angles.knee > 125) {
        score -= 18;
        mistakes.push('Front knee not bending enough');
        tips.push('Drop until your front thigh is parallel to the ground');
      }
      if (backAngle < 150) {
        score -= 12;
        mistakes.push('Torso leaning forward');
        tips.push('Keep your torso upright with core engaged');
      }
      // Check front knee over ankle
      const frontKneeX = landmarks[LANDMARKS.LEFT_KNEE].x;
      const frontAnkleX = landmarks[LANDMARKS.LEFT_ANKLE].x;
      if (Math.abs(frontKneeX - frontAnkleX) > 0.1) {
        score -= 10;
        mistakes.push('Front knee past ankle');
        tips.push('Keep your front knee directly above your ankle');
      }
      break;
    }

    case 'shoulder_press': {
      if (backAngle < 155) {
        score -= 18;
        mistakes.push('Arching your back');
        tips.push('Tighten core and avoid leaning back');
      }
      // Full extension check
      if (angles.elbow !== undefined && angles.elbow < 155 && angles.elbow > 140) {
        score -= 8;
        tips.push('Fully extend your arms overhead');
      }
      break;
    }

    case 'bicep_curl': {
      // Upper arm drift
      const shoulderX = landmarks[LANDMARKS.LEFT_SHOULDER].x;
      const elbowX = landmarks[LANDMARKS.LEFT_ELBOW].x;
      const drift = Math.abs(shoulderX - elbowX);
      if (drift > 0.08) {
        score -= 18;
        mistakes.push('Swinging arms / using momentum');
        tips.push('Pin your upper arms to your sides — isolate the bicep');
      }
      // Body sway
      const shoulderY = avgY(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER);
      const hipY = avgY(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP);
      const torsoAngle = Math.abs(shoulderY - hipY);
      if (torsoAngle < 0.08) {
        score -= 10;
        mistakes.push('Body swaying');
        tips.push('Stand tall and still — only move your forearms');
      }
      break;
    }

    case 'deadlift': {
      if (backAngle < 140) {
        score -= 22;
        mistakes.push('Back rounding');
        tips.push('Maintain a neutral spine — hinge at the hips');
      }
      // Knee bend check
      const kneeAngle = calculateAngle(
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_KNEE],
        landmarks[LANDMARKS.LEFT_ANKLE]
      );
      if (kneeAngle < 120) {
        score -= 10;
        mistakes.push('Bending knees too much');
        tips.push('Keep a slight knee bend — this is a hip hinge, not a squat');
      }
      break;
    }

    case 'tricep_dip': {
      // Depth check
      if (angles.elbow !== undefined && angles.elbow > 115) {
        score -= 15;
        mistakes.push('Not going low enough');
        tips.push('Bend elbows to at least 90°');
      }
      // Shoulder shrug
      const shoulderY = landmarks[LANDMARKS.LEFT_SHOULDER].y;
      const earApproxY = landmarks[LANDMARKS.NOSE].y - 0.05;
      if (shoulderY < earApproxY) {
        score -= 10;
        mistakes.push('Shoulders shrugging up');
        tips.push('Keep shoulders down and back');
      }
      break;
    }

    case 'plank_hold': {
      const hipAngle = angles.hip ?? calculateAngle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_ANKLE]
      );
      if (hipAngle < 155) {
        score -= 25;
        mistakes.push('Hips sagging');
        tips.push('Engage your core and lift your hips');
      } else if (hipAngle > 195) {
        score -= 18;
        mistakes.push('Hips too high');
        tips.push('Lower your hips to maintain a straight line');
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
