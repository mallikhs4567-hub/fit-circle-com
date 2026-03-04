/**
 * Utility functions for calculating angles between pose landmarks.
 * Used by RepCounter and FormAnalyzer for exercise detection.
 */

export interface Point {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** Calculate angle (in degrees) between three points (a-b-c), where b is the vertex */
export function calculateAngle(a: Point, b: Point, c: Point): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/** Calculate distance between two points */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Check if a landmark is visible enough to use */
export function isVisible(point: Point, threshold = 0.5): boolean {
  return (point.visibility ?? 0) >= threshold;
}

/**
 * MediaPipe Pose landmark indices
 * @see https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 */
export const LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;
