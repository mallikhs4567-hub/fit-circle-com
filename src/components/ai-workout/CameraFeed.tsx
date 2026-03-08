import { useRef, useEffect, useCallback, useState } from 'react';
import { LANDMARKS, type Point } from '@/lib/angleUtils';

interface CameraFeedProps {
  onFrame: (landmarks: Point[]) => void;
  active: boolean;
}

// MediaPipe Pose connections for skeleton drawing
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28],
];

/** Load a script from CDN and return a promise */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function CameraFeed({ onFrame, active }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, landmarks: Point[], w: number, h: number) => {
    ctx.strokeStyle = 'hsl(82, 85%, 55%)';
    ctx.lineWidth = 3;
    for (const [a, b] of POSE_CONNECTIONS) {
      if (landmarks[a] && landmarks[b]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
        ctx.stroke();
      }
    }

    for (const idx of Object.values(LANDMARKS)) {
      const pt = landmarks[idx];
      if (pt && (pt.visibility ?? 0) > 0.5) {
        ctx.fillStyle = 'hsl(25, 95%, 55%)';
        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const init = async () => {
      try {
        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 480, height: 360 },
        });
        streamRef.current = stream;

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Load MediaPipe from CDN (avoids Vite bundling issues)
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');

        if (cancelled) return;

        const win = window as any;
        if (!win.Pose) {
          throw new Error('MediaPipe Pose failed to load');
        }

        const pose = new win.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });

        pose.onResults((results: any) => {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (!canvas || !video) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw mirrored video
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          if (results.poseLandmarks) {
            const mirrored = results.poseLandmarks.map((lm: any) => ({
              ...lm,
              x: 1 - lm.x,
            }));
            drawSkeleton(ctx, mirrored, canvas.width, canvas.height);
            onFrame(results.poseLandmarks);
          }
        });

        poseRef.current = pose;

        if (videoRef.current && win.Camera) {
          const camera = new win.Camera(videoRef.current, {
            onFrame: async () => {
              if (poseRef.current && videoRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 480,
            height: 360,
          });
          cameraRef.current = camera;
          camera.start();
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Camera/MediaPipe init error:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to access camera');
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current.stop?.();
        cameraRef.current = null;
      }
      if (poseRef.current) {
        poseRef.current.close?.();
        poseRef.current = null;
      }
    };
  }, [active, onFrame, drawSkeleton]);

  if (error) {
    return (
      <div className="w-full aspect-[4/3] bg-secondary rounded-2xl flex items-center justify-center p-4">
        <p className="text-destructive text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-secondary rounded-2xl overflow-hidden">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Initializing AI...</p>
          </div>
        </div>
      )}
    </div>
  );
}
