import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

import editingPlan from "./editing_plan.json";

// ---------------------------------------------------------------------------
// FONT — Montserrat, downloaded via @remotion/google-fonts (official
// Remotion package). Full Cyrillic support, minimalist/bold — the TikTok /
// motivational-video look. Loaded once at module scope; Remotion handles
// the render-blocking wait internally, no manual FontFace/delayRender code
// needed anymore.
// ---------------------------------------------------------------------------

const { fontFamily } = loadFont("normal", {
  weights: ["600", "800", "900"],
  subsets: ["cyrillic", "latin"],
});

const FONT_STACK = `${fontFamily}, 'Helvetica Neue', Arial, sans-serif`;

// ---------------------------------------------------------------------------
// PALETTE — 60% dominant neutral (white or black full-screen background),
// 30% contrasting neutral (the inverse, for text), 10% gold accent (thin
// lines, kicker, dot, corner marks). True full-screen segments are an
// opaque hard swap away from the green — not a translucent overlay — so
// there's no chroma risk: the green simply isn't on screen during those
// seconds. Every other type stays a small overlay ON the green and keeps
// the old chroma-safe treatment (thin/small elements, nothing full-bleed).
// ---------------------------------------------------------------------------

const GREEN = "#00FF00";
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const GOLD = "#D4AF37";
const GOLD_BRIGHT = "#F2C14E";
const COFFEE = "#4A2E12";
const ORANGE = "#E8650A";
const ORANGE_DEEP = "#C2440A";

// Brand kicker shown on every full_screen_title. Edit this one line only.
const KICKER_LABEL = "MICHAEL KVON";

const segments: any[] = editingPlan.editing_plan ?? [];
const lastSegment = segments[segments.length - 1];

export const TOTAL_DURATION = lastSegment?.end ?? 10;

const cineEase = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// TIME-BASED HELPERS — used by full_screen_title / chapter_title / ribbon.
// ---------------------------------------------------------------------------

function smoothSlide(time: number, t1: number, t2: number, from: number, to: number): number {
  const safeT2 = Math.max(t2, t1 + 0.001);
  return interpolate(time, [t1, safeT2], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: cineEase,
  });
}

function fadeInOnly(time: number, t1: number, dur: number): number {
  const t2 = t1 + Math.max(dur, 0.001);
  return interpolate(time, [t1, t2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: cineEase,
  });
}

function fadeInOut(time: number, t1: number, t2: number, t3: number, t4: number): number {
  const p1 = t1;
  const p2 = Math.max(t2, p1 + 0.001);
  const p3 = Math.max(t3, p2 + 0.001);
  const p4 = Math.max(t4, p3 + 0.001);
  return interpolate(time, [p1, p2, p3, p4], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: cineEase,
  });
}

// ---------------------------------------------------------------------------
// SPRING-BASED MOTION — still used by card / corner labels / fallback.
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
// AMBIENT LINES — only shown while the green is actually visible, i.e. we
// simply don't render this under a full-screen white/black segment (those
// already draw their own opaque background on top).
// ---------------------------------------------------------------------------

function AmbientLines({ frame }: { frame: number }) {
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// FULL SCREEN TITLE — true edge-to-edge white/black card (alternates per
// occurrence), big bold Russian title, 60/30/10: 60% background, 30% text,
// 10% gold accents (line, kicker, dot, optional subtitle).
// ---------------------------------------------------------------------------

function renderFullScreenTitle(text: string, time: number, start: number, end: number, variantIndex: number) {
  const localTime = time - start;
  const duration = Math.max(end - start, 0.3);
  const k = Math.min(1, duration / 4);

  const topLineWidth = smoothSlide(localTime, 0.15 * k, 0.6 * k, 0, 220);
  const kickerOpacity = fadeInOnly(localTime, 0.2 * k, 0.25 * k);
  const titleScale = smoothSlide(localTime, 0, 0.55 * k, 0.92, 1);
  const titleY = smoothSlide(localTime, 0, 0.55 * k, 18, 0);
  const subtitleOpacity = fadeInOnly(localTime, 0.6 * k, 0.35 * k);
  const bottomLineWidth = smoothSlide(localTime, 0.8 * k, 1.2 * k, 0, 220);

  const outStart = Math.max(duration - Math.min(0.6, duration * 0.2), 0.9 * k);
  const cardOpacity = fadeInOut(localTime, 0, 0.05, outStart, duration);

  const isWhite = variantIndex % 2 === 0;
  const bg = isWhite ? WHITE : BLACK;
  const fg = isWhite ? BLACK : WHITE;

  const parts = text.split("|").map((s) => s.trim());
  const titleLine = parts[0];
  const subtitleLine = parts[1];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        opacity: cardOpacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "78%", textAlign: "center" }}>
        <div
          style={{
            width: topLineWidth,
            height: 3,
            margin: "0 auto 30px",
            background: GOLD,
            boxShadow: `0 0 10px ${GOLD}`,
          }}
        />

        <div
          style={{
            opacity: kickerOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 26,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: GOLD,
              boxShadow: `0 0 10px ${GOLD}`,
            }}
          />
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "5px",
              color: GOLD,
              textTransform: "uppercase",
            }}
          >
            {KICKER_LABEL}
          </div>
        </div>

        <div style={{ transform: `scale(${titleScale}) translateY(${titleY}px)` }}>
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 148,
              fontWeight: 900,
              color: fg,
              letterSpacing: "-2px",
              lineHeight: 1.05,
              textTransform: "uppercase",
            }}
          >
            {titleLine}
          </div>
        </div>

        {subtitleLine && (
          <div style={{ opacity: subtitleOpacity, marginTop: 28 }}>
            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 34,
                fontWeight: 600,
                color: GOLD,
                letterSpacing: "0.5px",
              }}
            >
              {subtitleLine}
            </div>
          </div>
        )}

        <div
          style={{
            width: bottomLineWidth,
            height: 3,
            margin: "30px auto 0",
            background: GOLD,
            boxShadow: `0 0 10px ${GOLD}`,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CORNER CHAPTER — small overlay ON the green (unchanged position/timing),
// labels translated to Russian.
// ---------------------------------------------------------------------------

function renderChapterTitle(text: string, time: number, start: number, end: number, chapterNumber: number) {
  const localTime = time - start;
  const duration = Math.max(end - start, 0.3);

  const chapterX = smoothSlide(localTime, 0, 0.4, 30, 0);
  const lineScale = smoothSlide(localTime, 0.1, 0.5, 0, 1);
  const opacity = fadeInOut(localTime, 0, 0.35, Math.max(duration - 0.4, 0.36), duration);

  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: 64,
        right: 64,
        opacity,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "5px",
            color: WHITE,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          ВИДЕО
        </div>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "3px",
            color: GOLD,
            textTransform: "uppercase",
            transform: `translateX(${chapterX}px)`,
          }}
        >
          ГЛАВА {String(chapterNumber).padStart(2, "0")}
        </div>
      </div>
      <div
        style={{
          height: 1,
          background: WHITE,
          marginTop: 14,
          opacity: 0.5,
          transform: `scaleX(${lineScale})`,
          transformOrigin: "left",
        }}
      />
      {text ? (
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 15,
            color: WHITE,
            opacity: 0.55,
            marginTop: 10,
          }}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CAPTION RIBBON — small overlay ON the green (unchanged).
// ---------------------------------------------------------------------------

function renderRibbon(text: string, time: number, start: number, end: number) {
  const localTime = time - start;
  const duration = Math.max(end - start, 0.3);

  const pop = smoothSlide(localTime, 0, 0.3, 0.8, 1);
  const opacity = fadeInOut(localTime, 0, 0.2, Math.max(duration - 0.3, 0.21), duration);

  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: 64,
        opacity,
        transform: `scale(${pop})`,
        transformOrigin: "left top",
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 28,
          fontWeight: 800,
          color: WHITE,
          background: `linear-gradient(120deg, ${ORANGE}, ${ORANGE_DEEP})`,
          padding: "14px 30px",
          borderRadius: 10,
          boxShadow: "0 12px 30px -8px rgba(0,0,0,0.6)",
          letterSpacing: "0.5px",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CARD — now also a true full-screen white/black swap (alternates
// independently from full_screen_title), for motivational-quote / fact
// statements. 60/30/10 applied the same way.
// ---------------------------------------------------------------------------

function renderCard(text: string, time: number, start: number, end: number, m: Motion, variantIndex: number) {
  const lineScale = popLine(time, start, end);

  const isWhite = variantIndex % 2 === 0;
  const bg = isWhite ? WHITE : BLACK;
  const fg = isWhite ? BLACK : WHITE;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        opacity: m.progress,
        transform: `scale(${m.scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", width: "76%" }}>
        <div
          style={{
            width: "40%",
            height: 3,
            margin: "0 auto 34px",
            background: GOLD,
            transform: `scaleX(${lineScale})`,
            boxShadow: `0 0 12px ${GOLD}`,
          }}
        />

        {[
          { top: -46, left: -30, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
          { top: -46, right: -30, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
          { bottom: -46, left: -30, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
          { bottom: -46, right: -30, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", width: 26, height: 26, opacity: 0.55, ...pos }} />
        ))}

        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 68,
            fontWeight: 800,
            color: fg,
            textAlign: "center",
            lineHeight: 1.3,
            letterSpacing: "-0.5px",
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

function renderSegment(
  segment: any,
  time: number,
  frame: number,
  fps: number,
  key: number,
  chapterNumber: number,
  fullScreenVariant: number,
  cardVariant: number
) {
  const { type, text, start, end } = segment;

  if (type === "caption") {
    return null;
  }

  let content: React.ReactNode;

  switch (type) {
    case "full_screen_title":
      content = renderFullScreenTitle(text, time, start, end, fullScreenVariant);
      break;
    case "chapter_title":
      content = renderChapterTitle(text, time, start, end, chapterNumber);
      break;
    case "ribbon":
      content = renderRibbon(text, time, start, end);
      break;
    case "card":
    case "fact":
    case "quote": {
      const m = getMotion(frame, fps, start, end);
      content = renderCard(text, time, start, end, m, cardVariant);
      break;
    }
    case "corner_left":
    case "label": {
      const m = getMotion(frame, fps, start, end);
      content = renderCornerLeft(text, m);
      break;
    }
    case "corner_right": {
      const m = getMotion(frame, fps, start, end);
      content = renderCornerRight(text, m);
      break;
    }
    default: {
      const m = getMotion(frame, fps, start, end);
      content = renderAnimatedText(text, m);
      break;
    }
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
  let fullScreenCount = 0;
  let cardCount = 0;

  // Is a true full-screen segment (full_screen_title or card/fact/quote)
  // active right now? If so, skip the ambient green-screen lines — they'd
  // just be invisible under the opaque white/black anyway, no need to
  // render them.
  const fullScreenActive = segments.some(
    (s) =>
      (s.type === "full_screen_title" || s.type === "card" || s.type === "fact" || s.type === "quote") &&
      time >= s.start &&
      time <= s.end
  );

  return (
    <AbsoluteFill style={{ background: GREEN }}>
      {!fullScreenActive && <AmbientLines frame={frame} />}

      {segments.map((segment, index) => {
        if (segment.type === "chapter_title") {
          chapterCount += 1;
        }
        if (segment.type === "full_screen_title") {
          fullScreenCount += 1;
        }
        if (segment.type === "card" || segment.type === "fact" || segment.type === "quote") {
          cardCount += 1;
        }

        if (time < segment.start || time > segment.end) {
          return null;
        }

        return renderSegment(
          segment,
          time,
          frame,
          fps,
          index,
          chapterCount,
          fullScreenCount - 1,
          cardCount - 1
        );
      })}
    </AbsoluteFill>
  );
};
