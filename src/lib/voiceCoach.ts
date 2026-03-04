/**
 * AI Voice Coach using Web Speech API.
 * Provides real-time verbal cues during workouts.
 * Throttled to avoid spam.
 */

let lastSpoken = 0;
const THROTTLE_MS = 4000;
let enabled = true;

export function setVoiceEnabled(value: boolean) {
  enabled = value;
}

export function isVoiceEnabled(): boolean {
  return enabled;
}

function speak(text: string) {
  if (!enabled || !('speechSynthesis' in window)) return;
  
  const now = Date.now();
  if (now - lastSpoken < THROTTLE_MS) return;
  lastSpoken = now;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;
  window.speechSynthesis.speak(utterance);
}

export function announceRepComplete(count: number, target: number) {
  if (count === target) {
    speak("Set complete! Great work!");
  } else if (count === target - 1) {
    speak("Final rep, push it!");
  } else if (count === Math.floor(target / 2)) {
    speak("Halfway there, keep going!");
  } else {
    speak(`${count}`);
  }
}

export function announceFormFeedback(mistakes: string[]) {
  if (mistakes.length === 0) {
    speak("Perfect form!");
    return;
  }
  speak(mistakes[0]);
}

export function announceWorkoutStart(exerciseName: string) {
  speak(`Starting ${exerciseName}. Get ready!`);
}

export function announceWorkoutEnd() {
  speak("Workout complete! Amazing effort!");
}

export function cleanup() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
