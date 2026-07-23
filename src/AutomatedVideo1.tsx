import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";

import editingPlan from "./editing_plan.json";

// ---------------------------------------------------------------------------
// PALETTE — 60% gold / 30% black / 10% coffee, white as the crisp accent.
// Structural frame lines stay pure white and thin: nothing here is
// full-bleed over the green, so the chroma key is never touched.
// ---------------------------------------------------------------------------

const GREEN = "#00FF00";
const GOLD = "#D4AF37";
const GOLD_BRIGHT = "#F2C14E";
const BLACK = "#0B0B0B";
const COFFEE = "#4A2E12";
const WHITE = "#FFFFFF";

// Local fonts already sitting in /public — fix the filenames/paths below to
// match what you actually have.
const FONT_STACK = "'Helvetica Local', 'Noto Local', Arial, sans-serif";

const segments: any[] = editingPlan.editing_plan ?? [];
const lastSegment = segments[segments.length - 1];

export const TOTAL_DURATION = lastSegment?.end ?? 10;

const cineEase = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// MOTION
// ---------------------------------------------------------------------------

const ENTER_SECONDS = 0.6;
const EXIT_SECONDS = 0.4;

interface Motion {
  progress: number;
  blur: number;
  depth: number;
  scale: number;
  tracking: number;
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
  const depth = interpolate(progress, [0, 1], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(progress, [0, 1], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tracking = interpolate(progress, [0, 1], [10, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return { progress, blur, depth, scale, tracking };
}

/**
 * Progress-line pop: grows 0 -> 1 over up to 3 seconds (clamped to the
 * segment length if it's shorter), holds, then fades smoothly near the end.
 * Time-based (seconds), epsilon-guarded against short/zero-length segments.
 */
function popLine(time: number, start: number, end: number, growSeconds = 3, outSeconds = 0.5): number {
  const duration = Math.max(end - start, 0.05);
  const safeGrow = Math.min(growSeconds, Math.max(duration - 0.05, 0.05));
  const safeOut = Math.min(outSeconds, Math.max(duration / 3, 0.05));

  const p1 = start;
  const p2 = Math.max(start + safeGrow, p1 + 0.05);
  const p3 = Math.max(end - safeOut, p2 + 0.05);
  const p4 = Math.max(end, p3 + 0.05);

  return interpolate(time, [p1, p2, p3, p4], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: cineEase,
  });
}

// ---------------------------------------------------------------------------
// STRUCTURAL FRAME ELEMENTS
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
        width: 42,
        height: 42,
        opacity: 0.25,
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 42,
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
          height: 42,
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
// OVERLAY RENDERERS
// ---------------------------------------------------------------------------

function renderFullScreenTitle(text: string, time: number, start: number, end: number, m: Motion) {
  const lineScale = popLine(time, start, end);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "82%",
        textAlign: "center",
        transform: `translate(-50%, calc(-50% + ${m.depth}px)) scale(${m.scale})`,
        opacity: m.progress,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 96,
          fontWeight: 800,
          color: GOLD_BRIGHT,
          letterSpacing: `${m.tracking}px`,
          lineHeight: 1.15,
          filter: `blur(${m.blur}px)`,
          textShadow:
            "0 2px 0 rgba(11,11,11,0.9), 2px 0 0 rgba(11,11,11,0.9), -2px 0 0 rgba(11,11,11,0.9), 0 14px 40px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: 220,
          height: 2,
          margin: "26px auto 0",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          transform: `scaleX(${lineScale})`,
          boxShadow: `0 0 14px rgba(212,175,55,0.6)`,
        }}
      />
    </div>
  );
}

function renderChapterTitle(text: string, time: number, start: number, end: number, m: Motion, chapterNumber: number) {
  const lineScale = popLine(time, start, end);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "70%",
        textAlign: "center",
        transform: `translate(-50%, calc(-50% + ${m.depth}px)) scale(${m.scale})`,
        opacity: m.progress,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "6px",
          color: GOLD,
          marginBottom: 16,
        }}
      >
        CHAPTER {String(chapterNumber).padStart(2, "0")}
      </div>
      <div
        style={{
          width: 120,
          height: 2,
          margin: "0 auto 22px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          transform: `scaleX(${lineScale})`,
          boxShadow: `0 0 14px rgba(212,175,55,0.6)`,
        }}
      />
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 62,
          fontWeight: 800,
          color: WHITE,
          letterSpacing: `${m.tracking * 0.4}px`,
          filter: `blur(${m.blur}px)`,
          textShadow: "0 10px 32px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// Large "full-screen" card — 88% wide / 76% tall, NOT edge-to-edge. Keeping
// a visible green margin around the panel is what keeps the whole segment
// keyable; a literal 0-margin black scrim would stain the chroma itself.
function renderCard(text: string, time: number, start: number, end: number, m: Motion) {
  const lineScale = popLine(time, start, end);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "88%",
        height: "76%",
        transform: `translate(-50%, -50%) scale(${m.scale})`,
        opacity: m.progress,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 18,
          background: `linear-gradient(160deg, rgba(11,11,11,0.92), rgba(74,46,18,0.85))`,
          border: `1px solid rgba(212,175,55,0.45)`,
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 90px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "20%",
            right: "20%",
            height: 3,
            background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_BRIGHT}, transparent)`,
            transform: `scaleX(${lineScale})`,
            boxShadow: `0 0 16px rgba(212,175,55,0.6)`,
          }}
        />

        {[
          { top: 26, left: 26, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
          { top: 26, right: 26, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
          { bottom: 26, left: 26, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
          { bottom: 26, right: 26, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", width: 24, height: 24, opacity: 0.6, ...pos }} />
        ))}

        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 56,
            fontWeight: 700,
            color: WHITE,
            textAlign: "center",
            lineHeight: 1.4,
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
        top: 60,
        left: 60,
        opacity: m.progress,
        transform: `translateX(${-m.depth}px)`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: GOLD, boxShadow: `0 0 10px ${GOLD}` }} />
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 28,
          fontWeight: 700,
          color: WHITE,
          background: `rgba(74,46,18,0.55)`,
          border: `1px solid rgba(212,175,55,0.5)`,
          padding: "10px 22px",
          borderRadius: 999,
          letterSpacing: "0.5px",
          boxShadow: "0 8px 22px -6px rgba(0,0,0,0.55)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderCornerRight(text: string, m: Motion) {
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 60,
        opacity: m.progress,
        transform: `translateX(${m.depth}px)`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexDirection: "row-reverse",
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: GOLD, boxShadow: `0 0 10px ${GOLD}` }} />
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 28,
          fontWeight: 700,
          color: WHITE,
          background: `rgba(74,46,18,0.55)`,
          border: `1px solid rgba(212,175,55,0.5)`,
          padding: "10px 22px",
          borderRadius: 999,
          letterSpacing: "0.5px",
          boxShadow: "0 8px 22px -6px rgba(0,0,0,0.55)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderAnimatedText(text: string, m: Motion) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 200,
        left: "50%",
        width: "78%",
        textAlign: "center",
        transform: `translate(-50%, ${m.depth}px)`,
        opacity: m.progress,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 46,
          fontWeight: 700,
          color: GOLD_BRIGHT,
          filter: `blur(${m.blur}px)`,
          textShadow: "0 8px 24px rgba(0,0,0,0.55)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderSegment(segment: any, time: number, frame: number, fps: number, key: number, chapterNumber: number) {
  const { type, text, start, end } = segment;

  if (type === "caption") {
    return null;
  }

  const m = getMotion(frame, fps, start, end);

  let content: React.ReactNode;

  switch (type) {
    case "full_screen_title":
      content = renderFullScreenTitle(text, time, start, end, m);
      break;
    case "chapter_title":
      content = renderChapterTitle(text, time, start, end, m, chapterNumber);
      break;
    case "card":
    case "fact":
    case "quote":
      content = renderCard(text, time, start, end, m);
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

  const [handle] = useState(() => delayRender("Loading fonts"));

  useEffect(() => {
    Promise.all([
      new FontFace("Helvetica Local", `url(${staticFile("Helvetica.ttf")})`, {
        weight: "700",
      }).load(),
      new FontFace("Noto Local", `url(${staticFile("NotoSansKR-Bold.otf")})`, {
        weight: "700",
      }).load(),
    ])
      .then((fonts) => {
        fonts.forEach((f) => document.fonts.add(f));
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

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

        return renderSegment(segment, time, frame, fps, index, chapterCount);
      })}
    </AbsoluteFill>
  );
};
