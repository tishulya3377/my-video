import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

import editingPlan from "./editing_plan.json";

// ---------------------------------------------------------------------------
// COLORS
// Text/cards stay gold-orange luxury. Background accent lines are thin WHITE
// (not gold, not black) — white sits far enough from the chroma green in hue
// that keyers won't touch it, and a dark backing shadow behind each line
// stops any anti-aliased edge from fringing green.
// ---------------------------------------------------------------------------

const GREEN = "#00FF00";
const GOLD = "#F5A623";
const DEEP_GOLD = "#C8860A";
const ORANGE = "#E8650A";
const WHITE = "#FFFFFF";

const FONT_STACK =
  "'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const segments: any[] = editingPlan.editing_plan ?? [];
const lastSegment = segments[segments.length - 1];

export const TOTAL_DURATION = lastSegment?.end ?? 10;

// ---------------------------------------------------------------------------
// EASING / TWEEN HELPERS
// Plain interpolate() only — no spring(), nothing that can produce a
// runtime surprise. Every helper is epsilon-guarded so a very short or
// zero-length segment (start === end, or an off-by-one from Whisper) can
// never throw remotion's "must be strictly monotonically increasing" error.
// ---------------------------------------------------------------------------

const luxEase = Easing.bezier(0.16, 1, 0.3, 1);

/** Fades 0 -> 1 -> 0 across the segment. Symmetric, the workhorse fade. */
function fadeInOut(
  time: number,
  start: number,
  end: number,
  inDur = 0.4,
  outDur = 0.4
): number {
  const duration = Math.max(end - start, 0.001);
  const safeIn = Math.min(inDur, duration / 2);
  const safeOut = Math.min(outDur, duration / 2);

  const p1 = start;
  const p2 = Math.max(start + safeIn, p1 + 0.001);
  const p3 = Math.max(end - safeOut, p2 + 0.001);
  const p4 = Math.max(end, p3 + 0.001);

  return interpolate(time, [p1, p2, p3, p4], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: luxEase,
  });
}

/** Fades 0 -> 1 only, then holds. For things that should pop in and stay. */
function fadeInOnly(time: number, start: number, end: number, dur = 0.35): number {
  const duration = Math.max(end - start, 0.001);
  const safeDur = Math.min(dur, duration);
  const p1 = start;
  const p2 = Math.max(start + safeDur, p1 + 0.001);

  return interpolate(time, [p1, p2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: luxEase,
  });
}

/** Tweens any numeric value (position, scale, whatever) from -> to, once, on entrance. */
function smoothSlide(
  time: number,
  start: number,
  end: number,
  from: number,
  to = 0,
  dur = 0.5
): number {
  const duration = Math.max(end - start, 0.001);
  const safeDur = Math.min(dur, duration);
  const p1 = start;
  const p2 = Math.max(start + safeDur, p1 + 0.001);

  return interpolate(time, [p1, p2], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: luxEase,
  });
}

// ---------------------------------------------------------------------------
// BACKGROUND — thin white drifting lines, chroma-safe
// ---------------------------------------------------------------------------

function BackgroundLines({ frame }: { frame: number }) {
  const lines = [
    { top: "8%", widthPct: 22, phase: 0 },
    { top: "92%", widthPct: 16, phase: 2.4 },
    { top: "50%", widthPct: 10, phase: 4.8 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {lines.map((l, i) => {
        const drift = Math.sin(frame / 140 + l.phase) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: l.top,
              left: `${50 + drift}%`,
              transform: "translate(-50%, -50%)",
              width: `${l.widthPct}%`,
              height: 3,
              // dark backing shadow first, prevents any green fringe on the
              // anti-aliased edge of the thin line above it
              boxShadow: "0 0 6px 1px rgba(0,0,0,0.45)",
              background: WHITE,
              opacity: 0.16,
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OVERLAY RENDERERS — one static, fixed position per type. No dynamic
// measuring, no clip-path masking, nothing that behaves differently
// depending on render environment.
// ---------------------------------------------------------------------------

function renderFullScreenTitle(text: string, time: number, start: number, end: number) {
  const op = fadeInOut(time, start, end, 0.5, 0.4);
  const y = smoothSlide(time, start, end, 26, 0, 0.5);
  const blur = interpolate(op, [0, 1], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "88%",
        textAlign: "center",
        transform: `translate(-50%, calc(-50% + ${y}px))`,
        opacity: op,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 108,
          fontWeight: 800,
          color: WHITE,
          textTransform: "uppercase",
          letterSpacing: "1px",
          filter: `blur(${blur}px)`,
          textShadow: "0 12px 40px rgba(0,0,0,0.55)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderChapterTitle(text: string, time: number, start: number, end: number) {
  const op = fadeInOut(time, start, end, 0.45, 0.4);
  const dividerScale = interpolate(op, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 90,
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        opacity: op,
      }}
    >
      <div
        style={{
          width: 100,
          height: 3,
          margin: "0 auto 20px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, ${ORANGE}, transparent)`,
          transform: `scaleX(${dividerScale})`,
          boxShadow: "0 0 16px rgba(245,166,35,0.6)",
        }}
      />
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 66,
          fontWeight: 800,
          color: GOLD,
          textTransform: "uppercase",
          letterSpacing: "2px",
          textShadow: "0 8px 28px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderCard(text: string, time: number, start: number, end: number) {
  const op = fadeInOut(time, start, end, 0.4, 0.35);
  const scale = smoothSlide(time, start, end, 0.92, 1, 0.45);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "72%",
        maxWidth: 1100,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: op,
      }}
    >
      <div
        style={{
          position: "relative",
          background: "rgba(20,20,20,0.55)",
          border: `1px solid rgba(245,166,35,0.45)`,
          borderRadius: 20,
          padding: "44px 56px",
          boxShadow: "0 24px 70px -20px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 28,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${GOLD}, ${ORANGE})`,
          }}
        />
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 50,
            fontWeight: 700,
            color: WHITE,
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function renderCornerLeft(text: string, time: number, start: number, end: number) {
  const op = fadeInOnly(time, start, end, 0.35);
  const x = smoothSlide(time, start, end, -40, 0, 0.4);

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 60,
        opacity: op,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 32,
          fontWeight: 700,
          color: WHITE,
          background: `linear-gradient(120deg, ${ORANGE}, ${DEEP_GOLD})`,
          padding: "10px 26px",
          borderRadius: 999,
          letterSpacing: "0.5px",
          boxShadow: "0 8px 24px -6px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderCornerRight(text: string, time: number, start: number, end: number) {
  const op = fadeInOnly(time, start, end, 0.35);
  const x = smoothSlide(time, start, end, 40, 0, 0.4);

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 60,
        opacity: op,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 32,
          fontWeight: 700,
          color: WHITE,
          background: `linear-gradient(120deg, ${DEEP_GOLD}, ${ORANGE})`,
          padding: "10px 26px",
          borderRadius: 999,
          letterSpacing: "0.5px",
          boxShadow: "0 8px 24px -6px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderAnimatedText(text: string, time: number, start: number, end: number) {
  const op = fadeInOut(time, start, end, 0.4, 0.35);
  const y = smoothSlide(time, start, end, 18, 0, 0.4);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 220,
        left: "50%",
        width: "80%",
        textAlign: "center",
        transform: `translate(-50%, ${y}px)`,
        opacity: op,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 48,
          fontWeight: 700,
          color: GOLD,
          textShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function renderSegment(segment: any, time: number, key: number) {
  const { type, text, start, end } = segment;

  // Captions are handled by a separate pipeline step — never render them here.
  if (type === "caption") {
    return null;
  }

  let content: React.ReactNode;

  switch (type) {
    case "full_screen_title":
      content = renderFullScreenTitle(text, time, start, end);
      break;
    case "chapter_title":
      content = renderChapterTitle(text, time, start, end);
      break;
    case "card":
    case "fact":
    case "quote":
      content = renderCard(text, time, start, end);
      break;
    case "corner_left":
    case "label":
      content = renderCornerLeft(text, time, start, end);
      break;
    case "corner_right":
      content = renderCornerRight(text, time, start, end);
      break;
    default:
      content = renderAnimatedText(text, time, start, end);
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

  return (
    <AbsoluteFill style={{ background: GREEN }}>
      <BackgroundLines frame={frame} />

      {segments.map((segment, index) => {
        if (time < segment.start || time > segment.end) {
          return null;
        }
        return renderSegment(segment, time, index);
      })}
    </AbsoluteFill>
  );
};
