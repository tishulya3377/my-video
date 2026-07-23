import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

import editingPlan from "./editing_plan.json";

// ---------------------------------------------------------------------------
// PALETTE — restrained editorial tones. One muted gold used sparingly as an
// accent (never as a loud fill or gradient bar). No orange. Structural
// hairlines/brackets stay thin white/low-opacity: safe against the chroma
// green (different hue entirely, and nothing here is full-frame, so the
// green itself is never touched).
// ---------------------------------------------------------------------------

const GREEN = "#00FF00";
const PLATINUM = "#EDECE8";
const GOLD = "#C9A24B";
const WHITE = "#FFFFFF";
const PANEL = "rgba(15,15,15,0.6)";

const FONT_STACK =
  "'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const segments: any[] = editingPlan.editing_plan ?? [];
const lastSegment = segments[segments.length - 1];

export const TOTAL_DURATION = lastSegment?.end ?? 10;

const cineEase = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// MOTION — spring()-driven entrance (critically damped, no cartoon bounce),
// interpolate() for the derived values (opacity fade-out, blur, depth,
// scale, tracking). Epsilon-guarded against zero/near-zero length segments.
// ---------------------------------------------------------------------------

const ENTER_SECONDS = 0.6;
const EXIT_SECONDS = 0.4;

interface Motion {
  progress: number; // 0 -> 1 -> 0, drives opacity
  blur: number;
  depth: number; // px to rise from (translateY)
  scale: number;
  tracking: number; // letter-spacing px, wide -> tight
}

function getMotion(frame: number, fps: number, start: number, end: number): Motion {
  const startFrame = Math.round(start * fps);
  const endFrame = Math.round(end * fps);
  const localFrame = frame - startFrame;
  const framesToEnd = endFrame - frame;

  const enterDur = Math.max(Math.round(ENTER_SECONDS * fps), 1);
  const exitDur = Math.max(Math.round(EXIT_SECONDS * fps), 1);

  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, mass: 1, stiffness: 120 },
    durationInFrames: enterDur,
  });

  const exit =
    framesToEnd <= exitDur
      ? interpolate(framesToEnd, [0, exitDur], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: cineEase,
        })
      : 1;

  const progress = Math.max(0, Math.min(1, Math.min(enter, exit)));

  const blur = interpolate(progress, [0, 1], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const depth = interpolate(progress, [0, 1], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(progress, [0, 1], [0.965, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tracking = interpolate(progress, [0, 1], [9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return { progress, blur, depth, scale, tracking };
}

// ---------------------------------------------------------------------------
// STRUCTURAL FRAME ELEMENTS — thin corner brackets + drifting hairlines.
// ---------------------------------------------------------------------------

function CornerBracket({
  top,
  left,
  right,
  bottom,
  flipX,
  flipY,
}: {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  flipX?: boolean;
  flipY?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        width: 38,
        height: 38,
        opacity: 0.22,
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 38,
          height: 1,
          background: WHITE,
          boxShadow: "0 0 5px 1px rgba(0,0,0,0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1,
          height: 38,
          background: WHITE,
          boxShadow: "0 0 5px 1px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}

function BackgroundFrame({ frame }: { frame: number }) {
  const lines = [
    { top: "10%", widthPct: 16, phase: 0 },
    { top: "50%", widthPct: 8, phase: 3.1 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {lines.map((l, i) => {
        const drift = Math.sin(frame / 160 + l.phase) * 5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: l.top,
              left: `${50 + drift}%`,
              transform: "translate(-50%, -50%)",
              width: `${l.widthPct}%`,
              height: 1,
              boxShadow: "0 0 5px 1px rgba(0,0,0,0.4)",
              background: WHITE,
              opacity: 0.11,
            }}
          />
        );
      })}

      <CornerBracket top={64} left={64} />
      <CornerBracket top={64} right={64} flipX />
      <CornerBracket bottom={64} left={64} flipY />
      <CornerBracket bottom={64} right={64} flipX flipY />
    </div>
  );
}

// ---------------------------------------------------------------------------
// OVERLAY RENDERERS — off-center, editorial, restrained.
// ---------------------------------------------------------------------------

function renderFullScreenTitle(text: string, m: Motion) {
  return (
    <div
      style={{
        position: "absolute",
        left: "9%",
        bottom: "24%",
        width: "50%",
        transform: `translateY(${m.depth}px) scale(${m.scale})`,
        transformOrigin: "left bottom",
        opacity: m.progress,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 58,
          fontWeight: 600,
          color: PLATINUM,
          letterSpacing: `${m.tracking}px`,
          lineHeight: 1.2,
          filter: `blur(${m.blur}px)`,
          textShadow: "0 8px 30px rgba(0,0,0,0.55)",
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: 64,
          height: 1,
          marginTop: 22,
          background: GOLD,
          opacity: 0.7 * m.progress,
        }}
      />
    </div>
  );
}

function renderChapterTitle(text: string, m: Motion, chapterNumber: number) {
  return (
    <div
      style={{
        position: "absolute",
        left: "9%",
        top: "36%",
        width: "44%",
        transform: `translateY(${m.depth}px) scale(${m.scale})`,
        transformOrigin: "left center",
        opacity: m.progress,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: `${2 + m.tracking * 0.4}px`,
          color: GOLD,
          marginBottom: 14,
        }}
      >
        CH. {String(chapterNumber).padStart(2, "0")}
      </div>
      <div
        style={{
          width: 40,
          height: 1,
          background: GOLD,
          opacity: 0.6,
          marginBottom: 18,
        }}
      />
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 40,
          fontWeight: 600,
          color: PLATINUM,
          letterSpacing: `${m.tracking * 0.5}px`,
          lineHeight: 1.25,
          filter: `blur(${m.blur}px)`,
          textShadow: "0 6px 24px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderCard(text: string, m: Motion) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "62%",
        maxWidth: 980,
        transform: `translate(-58%, -50%) scale(${m.scale})`,
        opacity: m.progress,
      }}
    >
      <div
        style={{
          position: "relative",
          background: PANEL,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          padding: "44px 52px",
          boxShadow: "0 30px 90px -24px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "22%",
            height: 1,
            background: GOLD,
            opacity: 0.65,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            width: 20,
            height: 20,
            borderTop: `1px solid ${GOLD}`,
            borderLeft: `1px solid ${GOLD}`,
            opacity: 0.5,
          }}
        />

        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 42,
            fontWeight: 500,
            color: PLATINUM,
            textAlign: "left",
            lineHeight: 1.45,
            letterSpacing: `${m.tracking * 0.3}px`,
            filter: `blur(${m.blur}px)`,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function renderCornerLeft(text: string, m: Motion) {
  return (
    <div
      style={{
        position: "absolute",
        top: 68,
        left: 68,
        transform: `translateX(${-m.depth}px)`,
        opacity: m.progress,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 22,
          fontWeight: 600,
          color: PLATINUM,
          letterSpacing: `${1.5 + m.tracking * 0.3}px`,
          textTransform: "uppercase",
          textShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: "100%",
          height: 1,
          background: GOLD,
          opacity: 0.6,
          marginTop: 8,
        }}
      />
    </div>
  );
}

function renderCornerRight(text: string, m: Motion) {
  return (
    <div
      style={{
        position: "absolute",
        top: 68,
        right: 68,
        transform: `translateX(${m.depth}px)`,
        opacity: m.progress,
        textAlign: "right",
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 22,
          fontWeight: 600,
          color: PLATINUM,
          letterSpacing: `${1.5 + m.tracking * 0.3}px`,
          textTransform: "uppercase",
          textShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: "100%",
          height: 1,
          background: GOLD,
          opacity: 0.6,
          marginTop: 8,
        }}
      />
    </div>
  );
}

function renderAnimatedText(text: string, m: Motion) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "16%",
        left: "50%",
        width: "60%",
        textAlign: "center",
        transform: `translate(-50%, ${m.depth}px)`,
        opacity: m.progress,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 34,
          fontWeight: 500,
          color: PLATINUM,
          letterSpacing: `${m.tracking * 0.3}px`,
          filter: `blur(${m.blur}px)`,
          textShadow: "0 6px 20px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderSegment(
  segment: any,
  frame: number,
  fps: number,
  key: number,
  chapterNumber: number
) {
  const { type, text, start, end } = segment;

  // Captions are handled by a separate pipeline step — never render them here.
  if (type === "caption") {
    return null;
  }

  const m = getMotion(frame, fps, start, end);

  let content: React.ReactNode;

  switch (type) {
    case "full_screen_title":
      content = renderFullScreenTitle(text, m);
      break;
    case "chapter_title":
      content = renderChapterTitle(text, m, chapterNumber);
      break;
    case "card":
    case "fact":
    case "quote":
      content = renderCard(text, m);
      break;
    case "corner_left":
    case "label":
      content = renderCornerLeft(text, m);
      break;
    case "corner_right":
      content = renderCornerRight(text, m);
      break;
    default:
      content = renderAnimatedText(text, m);
      break;
  }

  return <React.Fragment key={key}>{content}</React.Fragment>;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

export const AutomatedVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const time = frame / fps;

  let chapterCount = 0;

  return (
    <AbsoluteFill style={{ background: GREEN }}>
      <BackgroundFrame frame={frame} />

      {segments.map((segment, index) => {
        if (segment.type === "chapter_title") {
          chapterCount += 1;
        }

        if (time < segment.start || time > segment.end) {
          return null;
        }

        return renderSegment(segment, frame, fps, index, chapterCount);
      })}
    </AbsoluteFill>
  );
};
