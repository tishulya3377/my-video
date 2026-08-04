import React from "react";
import {
  AbsoluteFill,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

import { useEffect, useState } from "react";

type Props = {
  shortId: number;
};

const GOLD = "#F5A623";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

// how long (in seconds) an effect stays "active" after its trigger time
const EFFECT_WINDOW: Record<string, number> = {
  hook_zoom: 0.9,
  impact_flash: 0.35,
  highlight: 1.6,
  chapter: 1.8,
  pause: 1.4,
  quote: 3.0,
  dramatic_hold: 2.2,
  final_punch: 1.6,
};

export const ShortsVideo: React.FC<Props> = ({ shortId }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const [shortsPlan, setShortsPlan] = useState<any>(null);

  useEffect(() => {
    fetch(staticFile("shorts_plan.json"))
      .then((res) => res.json())
      .then((plan) => {
        setShortsPlan(plan);
      });
  }, []);

  if (!shortsPlan) {
    return null;
  }

  const shorts: any[] = shortsPlan.shorts;
  const short = shorts.find((s: any) => s.id === shortId) || shorts[0];

  const localTime = time + short.start;

  const activeCaption = short.captions?.find(
    (c: any) => localTime >= c.start && localTime <= c.end
  );

  const effects: any[] = short.effects || [];

  // Returns the most recently triggered effect of a given type
  // that is still within its active window, plus normalized progress (0-1)
  const getActiveEffect = (type: string) => {
    const window = EFFECT_WINDOW[type] ?? 1.0;
    const candidates = effects.filter((e) => e.type === type);
    let best: any = null;
    for (const e of candidates) {
      const elapsed = localTime - e.time;
      if (elapsed >= 0 && elapsed <= window) {
        if (!best || e.time > best.time) best = e;
      }
    }
    if (!best) return null;
    const elapsedFrames = (localTime - best.time) * fps;
    return { effect: best, elapsedFrames, window };
  };

  // ---------- HOOK ----------

  const hookOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const hookZoom = getActiveEffect("hook_zoom");
  const hookZoomScale = hookZoom
  ? interpolate(
      spring({
        frame: hookZoom.elapsedFrames,
        fps,
        config: {
          damping: 18,
          stiffness: 120,
          mass: 0.6,
        },
      }),
      [0, 1],
      [1.18, 1]
    )
  : 1;
  const hookZoomBlur = hookZoom
    ? interpolate(
        hookZoom.elapsedFrames,
        [0, 6],
        [6, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  // ---------- IMPACT FLASH ----------

  const impactFlash = getActiveEffect("impact_flash");
  const impactFlashOpacity = impactFlash
    ? interpolate(
        impactFlash.elapsedFrames,
        [0, 2, 10],
        [0, 0.85, 0],
        { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
      )
    : 0;

  // ---------- HIGHLIGHT ----------

  const highlight = getActiveEffect("highlight");
  const highlightProgress = highlight
    ? spring({
        frame: highlight.elapsedFrames,
        fps,
        config: { damping: 14, stiffness: 140 },
      })
    : 0;
  const highlightFadeOut = highlight
    ? interpolate(
        highlight.elapsedFrames,
        [highlight.window * fps - 12, highlight.window * fps],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;
  const highlightOpacity = highlight
    ? Math.min(highlightProgress, highlightFadeOut)
    : 0;
  const highlightScale = highlight
    ? interpolate(highlightProgress, [0, 1], [0.85, 1])
    : 1;

  // ---------- CHAPTER ----------

  const chapter = getActiveEffect("chapter");
  const chapterProgress = chapter
    ? spring({
        frame: chapter.elapsedFrames,
        fps,
        config: { damping: 20, stiffness: 100 },
      })
    : 0;
  const chapterLineWidth = chapter
    ? interpolate(chapterProgress, [0, 1], [0, 140], {
        extrapolateRight: "clamp",
      })
    : 0;
  const chapterOpacity = chapter
    ? interpolate(
        chapter.elapsedFrames,
        [0, 8, chapter.window * fps - 10, chapter.window * fps],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  // ---------- PAUSE (breath / dramatic beat) ----------

  const pause = getActiveEffect("pause");
  const pauseDarken = pause
    ? interpolate(
        pause.elapsedFrames,
        [0, pause.window * fps * 0.5, pause.window * fps],
        [0, 0.35, 0],
        { extrapolateRight: "clamp" }
      )
    : 0;
  const pauseZoom = pause
    ? interpolate(
        pause.elapsedFrames,
        [0, pause.window * fps],
        [1, 1.03],
        { extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
      )
    : 1;

  // ---------- QUOTE ----------

  const quote = getActiveEffect("quote");
  const quoteOpacity = quote
    ? interpolate(
        quote.elapsedFrames,
        [0, 10, quote.window * fps - 12, quote.window * fps],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;
  const quoteRise = quote
    ? interpolate(quote.elapsedFrames, [0, 14], [24, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 0;

  // ---------- DRAMATIC HOLD ----------

  const dramaticHold = getActiveEffect("dramatic_hold");
  const dramaticZoom = dramaticHold
    ? interpolate(
        dramaticHold.elapsedFrames,
        [0, dramaticHold.window * fps],
        [1, 1.06],
        { extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
      )
    : 1;
  const dramaticDesaturate = dramaticHold
    ? interpolate(
        dramaticHold.elapsedFrames,
        [0, dramaticHold.window * fps * 0.4],
        [0, 0.5],
        { extrapolateRight: "clamp" }
      )
    : 0;
  const dramaticVignette = dramaticHold
    ? interpolate(
        dramaticHold.elapsedFrames,
        [0, dramaticHold.window * fps * 0.4],
        [0, 0.45],
        { extrapolateRight: "clamp" }
      )
    : 0;

  // ---------- FINAL PUNCH ----------

  const finalPunch = getActiveEffect("final_punch");
  const finalPunchScale = finalPunch
  ? interpolate(
      spring({
        frame: finalPunch.elapsedFrames,
        fps,
        config: {
          damping: 10,
          stiffness: 160,
          mass: 0.7,
        },
      }),
      [0, 1],
      [0.7, 1]
    )
  : 1;
  const finalPunchOpacity = finalPunch
    ? interpolate(finalPunch.elapsedFrames, [0, 10], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 0;
  const finalPunchFlash = finalPunch
    ? interpolate(finalPunch.elapsedFrames, [0, 2, 14], [0, 0.6, 0], {
        extrapolateRight: "clamp",
      })
    : 0;

  // ---------- Combined video transform ----------

  const combinedScale = hookZoomScale * pauseZoom * dramaticZoom;
  const combinedFilter = [
    hookZoomBlur > 0.3 ? `blur(${hookZoomBlur * 0.4}px)` : "",
    dramaticDesaturate > 0 ? `saturate(${1 - dramaticDesaturate * 0.5})` : "",
    dramaticDesaturate > 0 ? `brightness(${1 - dramaticDesaturate * 0.15})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const captionScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  return (
    <AbsoluteFill style={{ background: BLACK, overflow: "hidden" }}>
      {/* VIDEO */}
      <AbsoluteFill
        style={{
          transform: `scale(${combinedScale})`,
          filter: combinedFilter || undefined,
        }}
      >
        <Video
          src={staticFile("video.mp4")}
          startFrom={Math.floor(short.start * fps)}
          endAt={Math.floor(short.end * fps)}
          pauseWhenBuffering={false}
          delayRenderRetries={0}
          delayRenderTimeoutInMilliseconds={120000}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* DARK CINEMATIC OVERLAY */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg,rgba(0,0,0,.55),transparent 40%,rgba(0,0,0,.7))",
        }}
      />

      {/* DRAMATIC HOLD VIGNETTE */}
      {dramaticHold && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${dramaticVignette}) 100%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* PAUSE BEAT DARKEN */}
      {pause && (
        <AbsoluteFill
          style={{
            background: `rgba(0,0,0,${pauseDarken})`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* IMPACT FLASH */}
      {impactFlash && (
        <AbsoluteFill
          style={{
            background: WHITE,
            opacity: impactFlashOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* FINAL PUNCH FLASH */}
      {finalPunch && (
        <AbsoluteFill
          style={{
            background: GOLD,
            opacity: finalPunchFlash * 0.25,
            pointerEvents: "none",
          }}
        />
      )}

      {/* HOOK */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 50,
          right: 50,
          opacity: hookOpacity,
          fontSize: 70,
          fontWeight: 900,
          fontFamily: "Inter, sans-serif",
          textAlign: "center",
          color: WHITE,
          textShadow: "0 5px 20px black",
          letterSpacing: 1,
        }}
      >
        {short.hook}
      </div>

      {/* CHAPTER MARKER */}
      {chapter && (
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: chapterOpacity,
          }}
        >
          <div
            style={{
              width: chapterLineWidth,
              height: 2,
              background: GOLD,
              marginBottom: 14,
            }}
          />
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              color: GOLD,
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
            }}
          >
            {chapter.effect.text || ""}
          </div>
        </div>
      )}

      {/* HIGHLIGHT WORD */}
      {highlight && (
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: 40,
            right: 40,
            display: "flex",
            justifyContent: "center",
            opacity: highlightOpacity,
            transform: `scale(${highlightScale})`,
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontWeight: 900,
              color: GOLD,
              fontFamily: "Inter, sans-serif",
              textAlign: "center",
              textShadow: "0 6px 24px rgba(0,0,0,0.8)",
              letterSpacing: 1,
            }}
          >
            {highlight.effect.text}
          </div>
        </div>
      )}

      {/* QUOTE */}
      {quote && (
        <div
          style={{
            position: "absolute",
            bottom: 460,
            left: 60,
            right: 60,
            opacity: quoteOpacity,
            transform: `translateY(${quoteRise}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 50,
              fontWeight: 600,
              fontStyle: "italic",
              color: WHITE,
              fontFamily: "Georgia, serif",
              lineHeight: 1.3,
              textShadow: "0 4px 16px black",
            }}
          >
            <span style={{ color: GOLD }}>&ldquo;</span>
            {quote.effect.text || activeCaption?.text}
            <span style={{ color: GOLD }}>&rdquo;</span>
          </div>
        </div>
      )}

      {/* CAPTION */}
      {activeCaption && !quote && (
        <div
          style={{
            position: "absolute",
            bottom: 300,
            left: 40,
            right: 40,
            display: "flex",
            justifyContent: "center",
            transform: `scale(${finalPunch ? finalPunchScale : captionScale})`,
            opacity: finalPunch ? finalPunchOpacity : 1,
          }}
        >
          <div
            style={{
              fontSize: finalPunch ? 74 : 65,
              fontWeight: 900,
              color: finalPunch ? GOLD : WHITE,
              fontFamily: "Inter, sans-serif",
              textAlign: "center",
              whiteSpace: "pre-line",
              lineHeight: 1.25,
              textShadow: "0 5px 15px black",
            }}
          >
            {activeCaption.text}
          </div>
        </div>
      )}

      {/* BRAND */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 50,
          fontSize: 30,
          fontWeight: 900,
          letterSpacing: 5,
          color: GOLD,
        }}
      >
        MICHAEL KVON
      </div>
    </AbsoluteFill>
  );
};