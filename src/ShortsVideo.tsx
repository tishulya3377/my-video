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

import shortsPlan from "./shorts_plan.json";

type Props = {
  shortId: number;
};

const GOLD = "#F5A623";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

// A premium serif/sans mix reads far less "template" than
// maxing every element to font-weight 900.
const SANS = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Georgia', 'Times New Roman', serif";

// How long (in seconds) an effect stays "active" after its trigger time.
// These were too short before -> felt abrupt. Widened + effects now
// crossfade in AND out instead of clamping hard.
const EFFECT_WINDOW: Record<string, number> = {
  hook_zoom: 1.6,
  impact_flash: 0.6,
  highlight: 2.6,
  chapter: 3.2,
  pause: 2.4,
  quote: 4.5,
  dramatic_hold: 3.5,
  final_punch: 3.0,
};

export const ShortsVideo: React.FC<Props> = ({ shortId }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

 const short =
  shortsPlan.shorts.find(
    (s: any) => s.id === shortId
  ) || shortsPlan.shorts[0];

  
  const localTime = time;

  const activeCard = short.cards?.find(
  (c:any)=> localTime >= c.start && localTime <= c.end
);

  const effects: any[] = short.effects || [];

  // Returns the most recently triggered effect of a given type,
  // still inside its (now longer) active window, plus elapsed frames
  // so we can build smooth in -> hold -> out curves instead of a
  // single hard on/off toggle.
  const getActiveEffect = (type: string) => {
    const window = EFFECT_WINDOW[type] ?? 1.5;
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
    const windowFrames = window * fps;
    return { effect: best, elapsedFrames, windowFrames, window };
  };

  // Smooth crossfade helper: fades in over `inFrames`, holds, fades
  // out over the final `outFrames` of the window. Replaces the old
  // hard clamp which is what made effects feel like they "snapped".
  const fadeInOut = (
    elapsedFrames: number,
    windowFrames: number,
    inFrames = 12,
    outFrames = 18
  ) =>
    interpolate(
      elapsedFrames,
      [0, inFrames, windowFrames - outFrames, windowFrames],
      [0, 1, 1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      }
    );

  // ---------- HOOK ----------

  const hookOpacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const hookRise = interpolate(frame, [0, 24], [14, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const hookZoom = getActiveEffect("hook_zoom");
  const hookZoomScale = hookZoom
    ? spring({
        frame: hookZoom.elapsedFrames,
        fps,
        config: { damping: 26, stiffness: 60, mass: 1 },
        from: 1.12,
        to: 1,
      })
    : 1;
  const hookZoomBlur = hookZoom
    ? interpolate(hookZoom.elapsedFrames, [0, 14], [4, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.ease),
      })
    : 0;

  // ---------- IMPACT FLASH ----------

  const impactFlash = getActiveEffect("impact_flash");
  const impactFlashOpacity = impactFlash
    ? interpolate(
        impactFlash.elapsedFrames,
        [0, 3, impactFlash.windowFrames],
        [0, 0.55, 0],
        {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        }
      )
    : 0;

  // ---------- HIGHLIGHT ----------

  const highlight = getActiveEffect("highlight");
  const highlightFade = highlight
    ? fadeInOut(highlight.elapsedFrames, highlight.windowFrames, 10, 20)
    : 0;
  const highlightScale = highlight
    ? interpolate(highlight.elapsedFrames, [0, 16], [0.92, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.back(1.3)),
      })
    : 1;

  // ---------- CHAPTER ----------

  const chapter = getActiveEffect("chapter");
  const chapterFade = chapter
    ? fadeInOut(chapter.elapsedFrames, chapter.windowFrames, 14, 24)
    : 0;
  const chapterLineWidth = chapter
    ? interpolate(chapter.elapsedFrames, [0, 26], [0, 120], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 0;

  // ---------- PAUSE (breath / dramatic beat) ----------

  const pause = getActiveEffect("pause");
  const pauseDarken = pause
    ? interpolate(
        pause.elapsedFrames,
        [0, pause.windowFrames * 0.5, pause.windowFrames],
        [0, 0.28, 0],
        { extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
      )
    : 0;
  const pauseZoom = pause
    ? interpolate(pause.elapsedFrames, [0, pause.windowFrames], [1, 1.025], {
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.ease),
      })
    : 1;

  // ---------- QUOTE ----------

  const quote = getActiveEffect("quote");
  const quoteFade = quote
    ? fadeInOut(quote.elapsedFrames, quote.windowFrames, 18, 26)
    : 0;
  const quoteRise = quote
    ? interpolate(quote.elapsedFrames, [0, 22], [18, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 0;

  // ---------- DRAMATIC HOLD ----------

  const dramaticHold = getActiveEffect("dramatic_hold");
  const dramaticZoom = dramaticHold
    ? interpolate(
        dramaticHold.elapsedFrames,
        [0, dramaticHold.windowFrames],
        [1, 1.045],
        { extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
      )
    : 1;
  const dramaticDesaturate = dramaticHold
    ? interpolate(
        dramaticHold.elapsedFrames,
        [0, dramaticHold.windowFrames * 0.5],
        [0, 0.4],
        { extrapolateRight: "clamp", easing: Easing.out(Easing.ease) }
      )
    : 0;
  const dramaticVignette = dramaticHold
    ? interpolate(
        dramaticHold.elapsedFrames,
        [0, dramaticHold.windowFrames * 0.5],
        [0, 0.4],
        { extrapolateRight: "clamp", easing: Easing.out(Easing.ease) }
      )
    : 0;

  // ---------- FINAL PUNCH ----------

  const finalPunch = getActiveEffect("final_punch");
  const finalPunchScale = finalPunch
    ? spring({
        frame: finalPunch.elapsedFrames,
        fps,
        config: { damping: 18, stiffness: 90, mass: 0.9 },
        from: 0.9,
        to: 1,
      })
    : 1;
  const finalPunchFade = finalPunch
    ? fadeInOut(finalPunch.elapsedFrames, finalPunch.windowFrames, 16, 24)
    : 0;
  const finalPunchGlow = finalPunch
    ? interpolate(finalPunch.elapsedFrames, [0, 4, 30], [0, 0.35, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.ease),
      })
    : 0;

  // ---------- Combined video transform ----------

  const combinedScale = hookZoomScale * pauseZoom * dramaticZoom;
  const combinedFilter = [
    hookZoomBlur > 0.3 ? `blur(${hookZoomBlur * 0.35}px)` : "",
    dramaticDesaturate > 0 ? `saturate(${1 - dramaticDesaturate * 0.5})` : "",
    dramaticDesaturate > 0
      ? `brightness(${1 - dramaticDesaturate * 0.12})`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Caption enter animation — softened spring, no overshoot snap.

  return (
    <AbsoluteFill style={{ background: BLACK, overflow: "hidden" }}>
      {/* VIDEO — plays the already-cut clip in full, no re-trimming */}
      <AbsoluteFill
        style={{
          transform: `scale(${combinedScale})`,
          filter: combinedFilter || undefined,
        }}
      >
        <Video
          src={staticFile("video.mp4")}
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
            "linear-gradient(180deg,rgba(0,0,0,.5),transparent 38%,rgba(0,0,0,.62))",
        }}
      />

      {/* DRAMATIC HOLD VIGNETTE */}
      {dramaticHold && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,${dramaticVignette}) 100%)`,
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

      {/* FINAL PUNCH GLOW */}
      {finalPunch && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, ${GOLD}, transparent 70%)`,
            opacity: finalPunchGlow,
            pointerEvents: "none",
          }}
        />
      )}

      {/* HOOK — lighter weight, tighter tracking, subtle rise-in */}
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 60,
          right: 60,
          opacity: hookOpacity,
          transform: `translateY(${hookRise}px)`,
          fontSize: 58,
          fontWeight: 700,
          fontFamily: SANS,
          textAlign: "center",
          color: WHITE,
          letterSpacing: 0.5,
          lineHeight: 1.15,
          textShadow: "0 4px 24px rgba(0,0,0,0.75)",
        }}
      >
        {short.hook}
      </div>

      {/* CHAPTER MARKER — small caps label, thin gold rule */}
      {chapter && (
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: chapterFade,
          }}
        >
          <div
            style={{
              width: chapterLineWidth,
              height: 1,
              background: GOLD,
              marginBottom: 16,
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 7,
              color: GOLD,
              fontFamily: SANS,
              textTransform: "uppercase",
            }}
          >
            {chapter.effect.text || "CHAPTER"}
          </div>
        </div>
      )}

      {/* HIGHLIGHT WORD — serif accent instead of maxed bold sans */}
      {highlight && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: 40,
            right: 40,
            display: "flex",
            justifyContent: "center",
            opacity: highlightFade,
            transform: `scale(${highlightScale})`,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: GOLD,
              fontFamily: SANS,
              textAlign: "center",
              letterSpacing: 0.5,
              textShadow: "0 6px 30px rgba(0,0,0,0.6)",
            }}
          >
            {highlight.effect.text}
          </div>
        </div>
      )}

      {/* QUOTE — italic serif, elegant not shouty */}
      {quote && (
        <div
          style={{
            position: "absolute",
            bottom: 440,
            left: 70,
            right: 70,
            opacity: quoteFade,
            transform: `translateY(${quoteRise}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 400,
              fontStyle: "italic",
              color: WHITE,
              fontFamily: SERIF,
              lineHeight: 1.35,
              textShadow: "0 3px 18px rgba(0,0,0,0.7)",
            }}
          >
            <span style={{ color: GOLD }}>&ldquo;</span>
            {quote.effect.text || ""}
            <span style={{ color: GOLD }}>&rdquo;</span>
          </div>
        </div>
      )}

     {/* LUXURY TITLE CARD */}
{activeCaption && !quote && (
  <AbsoluteFill
    style={{
      background:
        frame % 180 < 90
          ? BLACK
          : WHITE,
      justifyContent: "center",
      alignItems: "center",
      padding: 80,
    }}
  >

    <div
      style={{
        position: "absolute",
        top: 80,
        left: 80,
        width: 260,
        height: 4,
        background: GOLD,
        transformOrigin: "left",
        transform: `scaleX(${interpolate(
          frame % 90,
          [0,90],
          [0,1]
        )})`,
      }}
    />

    <div
      style={{
        color:
          frame % 180 < 90
            ? WHITE
            : BLACK,
        fontFamily: SANS,
        fontSize: 70,
        fontWeight: 500,
        letterSpacing: 1,
        textAlign: "center",
        lineHeight: 1.2,
        maxWidth: 850,
      }}
    >
      {activeCard?.text}
    </div>

  </AbsoluteFill>
)}

      {/* BRAND */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 50,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 5,
          color: GOLD,
          fontFamily: SANS,
        }}
      >
        MICHAEL KVON
      </div>
    </AbsoluteFill>
  );
};
