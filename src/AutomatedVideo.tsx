import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNotoKR } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadNotoEmoji } from "@remotion/google-fonts/NotoEmoji";

import editingPlan from "./editing_plan.json";

// ── Fonts ─────────────────────────────────────────────────────────
const { fontFamily: RU_FONT } = loadInter();
const { fontFamily: KO_FONT } = loadNotoKR();
const { fontFamily: EMOJI_FONT } = loadNotoEmoji();

const RU_FONT_STACK = `${RU_FONT}, ${EMOJI_FONT}, sans-serif`;
const KO_FONT_STACK = `${KO_FONT}, ${EMOJI_FONT}, sans-serif`;

const hasKorean = (text: string) =>
  /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text ?? "");
const autoFont = (text: string) =>
  hasKorean(text) ? KO_FONT_STACK : RU_FONT_STACK;

const GOLD        = "#F5A623";
const GOLD_DEEP   = "#C8860A";
const ORANGE      = "#E8650A";
const WHITE       = "#FFFFFF";
const CREAM       = "#FFF3D6";

// Pure chroma-key black — never used anywhere except the background
const CHROMA_BLACK = "#00FF00";

const lastSeg = (editingPlan as any).segments?.[(editingPlan as any).segments.length - 1];
export const TOTAL_DURATION = lastSeg?.end ?? 0;

// ── Smooth luxury easing ───────────────────────────────────────────
const luxEase = Easing.bezier(0.22, 1, 0.36, 1);

// ── BULLETPROOF fade helper ─────────────────────────────────────────
function fadeInOut(
  t: number,
  s: number,
  e: number,
  inD = 0.35,
  outD = 0.35
): number {
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) {
    return 1;
  }

  const duration = e - s;
  const EPS = 0.001;
  let safeIn = Math.max(EPS, Math.min(inD, duration / 2 - EPS / 2));
  let safeOut = Math.max(EPS, Math.min(outD, duration / 2 - EPS / 2));

  if (duration <= EPS * 4) {
    return 1;
  }

  let p1 = s;
  let p2 = s + safeIn;
  let p3 = e - safeOut;
  let p4 = e;

  if (p2 <= p1) p2 = p1 + EPS;
  if (p3 <= p2) p3 = p2 + EPS;
  if (p4 <= p3) p4 = p3 + EPS;

  const inputRange = [p1, p2, p3, p4];
  const outputRange = [0, 1, 1, 0];

  return interpolate(t, inputRange, outputRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: luxEase,
  });
}

// ── BULLETPROOF slide helper ────────────────────────────────────────
function smoothSlide(
  t: number,
  s: number,
  dur: number,
  from: number,
  to: number
): number {
  if (!Number.isFinite(s) || !Number.isFinite(dur)) {
    return to;
  }

  const EPS = 0.001;
  const safeDur = Math.max(dur, EPS);

  const p1 = s;
  const p2 = s + safeDur;

  return interpolate(t, [p1, p2], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: luxEase,
  });
}

// ── Simple one-directional fade-in helper ────────────────────────────
function fadeInOnly(
  t: number,
  s: number,
  dur: number
): number {
  if (!Number.isFinite(s) || !Number.isFinite(dur)) {
    return 1;
  }

  const EPS = 0.001;
  const safeDur = Math.max(dur, EPS);

  const p1 = s;
  const p2 = s + safeDur;

  return interpolate(t, [p1, p2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: luxEase,
  });
}

export const AutomatedVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;


  const activeSegment: any = (editingPlan as any).segments?.find(
    (s: any) => time >= s.start && time <= s.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: CHROMA_BLACK }}>

      {/* ── SEGMENT UI ───────────────────────────────────────────── */}
      {activeSegment?.ui?.map((item: any, index: number) => {
        const s = activeSegment.start;
        const e = activeSegment.end;
        const cappedEnd = item.type === "full_screen_title" ? Math.min(e, s + 4) : e;
const op = fadeInOut(time, s, cappedEnd, 0.4, 0.4);
        const localTime = time - s;
        const cappedLocalTime = item.type === "full_screen_title" ? Math.min(localTime, 4) : localTime;

        // ── FULL SCREEN TITLE ─────────────────────────────────────
        if (item.type === "full_screen_title") {
  const lineW = smoothSlide(cappedLocalTime, 0.15, 0.6, 0, 260);
  const titleScale = smoothSlide(cappedLocalTime, 0, 0.55, 0.92, 1);
  const titleY = smoothSlide(cappedLocalTime, 0, 0.55, 18, 0);
  const subtextOp = fadeInOnly(cappedLocalTime, 0.45, 0.35);
  const kickerOp = fadeInOnly(cappedLocalTime, 0.1, 0.35);

          return (
            <AbsoluteFill
              key={index}
              style={{
                backgroundColor: CHROMA_BLACK,
                justifyContent: "center",
                alignItems: "center",
                opacity: op,
                zIndex: 20,
              }}
            >
              <div style={{
                textAlign: "center",
                padding: "0 100px",
                transform: `scale(${titleScale}) translateY(${titleY}px)`,
              }}>

                {/* Top line */}
                <div style={{
                  width: lineW,
                  height: 3,
                  background: `linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD}, ${ORANGE}, ${GOLD}, ${GOLD_DEEP})`,
                  margin: "0 auto 30px",
                  borderRadius: 2,
                }} />

                {/* Kicker */}
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: GOLD,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                  opacity: kickerOp,
                  fontFamily: autoFont(item.kicker ?? ""),
                  textShadow: `
  0 0 2px rgba(90,54,12,0.85),
  0 2px 8px rgba(120,70,10,0.60)
`,
                }}>
                  {item.kicker ?? "● MICHAEL KVON"}
                </div>

                {/* Main title */}
                <div style={{
                  fontSize: 100,
                  fontWeight: 900,
                  color: WHITE,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  lineHeight: 1.0,
                  fontFamily: autoFont(item.text),
                  textShadow: `
  0 0 3px rgba(90,54,12,0.90),
  0 0 8px rgba(200,134,10,0.35),
  0 4px 0 ${GOLD_DEEP},
  0 8px 28px rgba(120,70,10,0.55)
`,
                }}>
                  {item.text}
                </div>

                {/* Subtext */}
                {item.subtext && (
                  <div style={{
                    marginTop: 24,
                    fontSize: 34,
                    fontWeight: 500,
                    color: GOLD,
                    letterSpacing: "0.06em",
                    opacity: subtextOp,
                    fontFamily: autoFont(item.subtext),
                    textShadow: `
  0 0 2px rgba(90,54,12,0.85),
  0 2px 10px rgba(120,70,10,0.60)
`,
                  }}>
                    {item.subtext}
                  </div>
                )}

                {/* Bottom line */}
                <div style={{
                  width: lineW,
                  height: 3,
                  background: `linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD}, ${ORANGE}, ${GOLD}, ${GOLD_DEEP})`,
                  margin: "30px auto 0",
                  borderRadius: 2,
                }} />
              </div>
            </AbsoluteFill>
          );
        }

        // ── CAPTION — top left ────────────────────────────────────
        if (item.type === "caption") {
          const slideY = smoothSlide(localTime, 0, 0.5, -16, 0);
          const scaleIn = smoothSlide(localTime, 0, 0.5, 0.9, 1.0);

          return (
            <div key={index} style={{
              position: "absolute",
              top: 70,
              left: 70,
              opacity: op,
              transform: `translateY(${slideY}px) scale(${scaleIn})`,
              transformOrigin: "left top",
              zIndex: 20,
            }}>
              <div style={{
                background: `linear-gradient(135deg, ${GOLD}, ${ORANGE})`,
                clipPath: "polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)",
                padding: "14px 40px",
                filter: `drop-shadow(0 4px 16px rgba(232,101,10,0.5))`,
              }}>
                <span style={{
                  color: "#2B1400",
                  fontSize: 28,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                  fontFamily: autoFont(item.text),
                }}>
                  {item.text}
                </span>
              </div>
            </div>
          );
        }

        // ── CHAPTER TITLE — top right ─────────────────────────────
        if (item.type === "chapter_title") {
          const slideX = smoothSlide(localTime, 0, 0.5, 32, 0);

          return (
            <div key={index} style={{
              position: "absolute",
              top: 70,
              right: 70,
              opacity: op,
              transform: `translateX(${slideX}px)`,
              zIndex: 20,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                filter: `drop-shadow(0 4px 16px rgba(200,134,10,0.45))`,
              }}>
                <div style={{
                  background: ORANGE,
                  padding: "14px 18px",
                  borderRadius: "10px 0 0 10px",
                }}>
                  <span style={{
                    color: WHITE,
                    fontSize: 24,
                    fontWeight: 900,
                    fontFamily: EMOJI_FONT,
                  }}>№</span>
                </div>
                <div style={{
                  background: `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`,
                  padding: "14px 22px",
                  borderRadius: "0 10px 10px 0",
                }}>
                  <span style={{
                    color: "#2B1400",
                    fontSize: 24,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                    fontFamily: autoFont(item.text),
                  }}>
                    {item.text}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}

    </AbsoluteFill>
  );
};