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
// COLORS — text/cards stay gold-orange luxury. Structural lines/brackets are
// thin WHITE, never black, and never full-frame: white sits far enough from
// the chroma green in hue that keyers won't touch it, and nothing here
// covers the whole frame (which would shift the green itself and break
// keying), it's all small, localized, edge elements.
// ---------------------------------------------------------------------------

const GREEN = "#00FF00";
const GOLD = "#F5A623";
const ORANGE = "#E8650A";
const WHITE = "#FFFFFF";

const FONT_STACK =
  "'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const segments: any[] = editingPlan.editing_plan ?? [];
const lastSegment = segments[segments.length - 1];

export const TOTAL_DURATION = lastSegment?.end ?? 10;

// ---------------------------------------------------------------------------
// EASING / TWEEN HELPERS — plain interpolate() only, no spring(), every
// helper epsilon-guarded so a very short or zero-length segment can never
// throw remotion's "must be strictly monotonically increasing" error.
// ---------------------------------------------------------------------------

const luxEase = Easing.bezier(0.16, 1, 0.3, 1);

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
// STRUCTURAL FRAME ELEMENTS — corner brackets + drifting lines. Thin, white,
// low-opacity, static positions. This is what sells "premium package" over
// "static text on green" without touching stability.
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
        width: 46,
        height: 46,
        opacity: 0.28,
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 46,
          height: 2,
          background: WHITE,
          boxShadow: "0 0 6px 1px rgba(0,0,0,0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 2,
          height: 46,
          background: WHITE,
          boxShadow: "0 0 6px 1px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}

function BackgroundFrame({ frame }: { frame: number }) {
  const lines = [
    { top: "8%", widthPct: 20, phase: 0 },
    { top: "50%", widthPct: 10, phase: 3.1 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {lines.map((l, i) => {
        const drift = Math.sin(frame / 150 + l.phase) * 6;
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
              boxShadow: "0 0 6px 1px rgba(0,0,0,0.45)",
              background: WHITE,
              opacity: 0.14,
            }}
          />
        );
      })}

      <CornerBracket top={56} left={56} />
      <CornerBracket top={56} right={56} flipX />
      <CornerBracket bottom={56} left={56} flipY />
      <CornerBracket bottom={56} right={56} flipX flipY />
    </div>
  );
}

// ---------------------------------------------------------------------------
// OVERLAY RENDERERS — one static, fixed position per type.
// ---------------------------------------------------------------------------

function renderFullScreenTitle(text: string, time: number, start: number, end: number) {
  const op = fadeInOut(time, start, end, 0.5, 0.4);
  const y = smoothSlide(time, start, end, 26, 0, 0.5);
  const lineScale = interpolate(op, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
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
          textShadow: "0 12px 44px rgba(0,0,0,0.6), 0 2px 0 rgba(0,0,0,0.3)",
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: 180,
          height: 4,
          margin: "28px auto 0",
          background: `linear-gradient(90deg, transparent, ${GOLD}, ${ORANGE}, transparent)`,
          transform: `scaleX(${lineScale})`,
          boxShadow: "0 0 20px rgba(245,166,35,0.65)",
        }}
      />
    </div>
  );
}

function renderChapterTitle(
  text: string,
  time: number,
  start: number,
  end: number,
  chapterNumber: number
) {
  const op = fadeInOut(time, start, end, 0.45, 0.4);
  const dividerScale = interpolate(op, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const numberOpacity = interpolate(op, [0, 1], [0, 0.85], {
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
          fontFamily: FONT_STACK,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "6px",
          color: GOLD,
          opacity: numberOpacity,
          marginBottom: 10,
        }}
      >
        CHAPTER {String(chapterNumber).padStart(2, "0")}
      </div>
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

  const corners: React.CSSProperties[] = [
    { top: 18, left: 18, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
    { top: 18, right: 18, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
    { bottom: 18, left: 18, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
    { bottom: 18, right: 18, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
  ];

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
          background: "rgba(18,18,18,0.6)",
          border: "1px solid rgba(245,166,35,0.4)",
          borderRadius: 22,
          padding: "48px 60px",
          boxShadow: "0 28px 80px -20px rgba(0,0,0,0.65)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: 3,
            background: `linear-gradient(90deg, transparent, ${GOLD}, ${ORANGE}, transparent)`,
          }}
        />

        {corners.map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              opacity: 0.55,
              ...pos,
            }}
          />
        ))}

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
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: GOLD,
          boxShadow: `0 0 10px ${GOLD}`,
        }}
      />
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 30,
          fontWeight: 700,
          color: WHITE,
          background: "rgba(18,18,18,0.55)",
          border: "1px solid rgba(245,166,35,0.5)",
          padding: "10px 24px",
          borderRadius: 999,
          letterSpacing: "0.5px",
          boxShadow: "0 8px 24px -6px rgba(0,0,0,0.55)",
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
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexDirection: "row-reverse",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: ORANGE,
          boxShadow: `0 0 10px ${ORANGE}`,
        }}
      />
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 30,
          fontWeight: 700,
          color: WHITE,
          background: "rgba(18,18,18,0.55)",
          border: "1px solid rgba(232,101,10,0.5)",
          padding: "10px 24px",
          borderRadius: 999,
          letterSpacing: "0.5px",
          boxShadow: "0 8px 24px -6px rgba(0,0,0,0.55)",
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

function renderSegment(
  segment: any,
  time: number,
  key: number,
  chapterNumber: number
) {
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
      content = renderChapterTitle(text, time, start, end, chapterNumber);
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

        return renderSegment(segment, time, index, chapterCount);
      })}
    </AbsoluteFill>
  );
};
