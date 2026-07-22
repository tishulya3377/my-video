import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";

// Expo-out style curve used for any manual (non-spring) interpolations.
export const EASE_LUXURY = Easing.bezier(0.16, 1, 0.3, 1);

// Critically damped: no bounce. Used for titles / quotes / lower thirds
// where we want elegant, confident motion.
export const SPRING_SMOOTH = { damping: 200, mass: 0.9, stiffness: 120 };

// Slight overshoot. Used for pills / labels / fact cards where a touch
// of "pop" reads as premium rather than sluggish.
export const SPRING_BOUNCY = { damping: 12, mass: 0.6, stiffness: 110 };

export interface SegmentTiming {
  frame: number;
  fps: number;
  localFrame: number;
  /** 0 -> 1 (may overshoot slightly with SPRING_BOUNCY) entrance progress */
  enter: number;
  /** 0 -> 1, clamped, combined enter+exit opacity value */
  opacity: number;
  /** px of blur to apply, driven by opacity (reveal/dismiss blur) */
  blur: number;
}

const ENTER_SECONDS = 0.55;
const EXIT_SECONDS = 0.38;

/**
 * Computes entrance/exit animation progress for a segment defined by
 * `start`/`end` (in seconds, exactly as they appear in editing_plan.json).
 * Every overlay component calls this with its own spring config so the
 * whole system stays declarative and duplication-free.
 */
export function useSegmentTiming(
  start: number,
  end: number,
  springConfig: { damping: number; mass: number; stiffness: number } = SPRING_SMOOTH
): SegmentTiming {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = Math.round(start * fps);
  const endFrame = Math.round(end * fps);
  const localFrame = frame - startFrame;
  const framesToEnd = endFrame - frame;

  const enterDurationFrames = Math.max(Math.round(ENTER_SECONDS * fps), 1);
  const exitDurationFrames = Math.max(Math.round(EXIT_SECONDS * fps), 1);

  const enter = spring({
    frame: localFrame,
    fps,
    config: springConfig,
    durationInFrames: enterDurationFrames,
  });

  const exit =
    framesToEnd <= exitDurationFrames
      ? interpolate(framesToEnd, [0, exitDurationFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  const opacity = Math.max(0, Math.min(1, Math.min(enter, exit)));
  const blur = interpolate(opacity, [0, 1], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return { frame, fps, localFrame, enter, opacity, blur };
}
