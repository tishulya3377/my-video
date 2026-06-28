import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  useVideoConfig as _,
} from "remotion";
import { loadFont as loadNotoKR } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNotoEmoji } from "@remotion/google-fonts/NotoEmoji";

import editingPlan from "./editing_plan.json";

// ── Fonts (kept — used in UI cards and titles) ────────────────────
const { fontFamily: RU_FONT } = loadInter();
const { fontFamily: KO_FONT } = loadNotoKR();
const { fontFamily: EMOJI_FONT } = loadNotoEmoji();

const RU_FONT_STACK = `${RU_FONT}, ${EMOJI_FONT}, sans-serif`;
const KO_FONT_STACK = `${KO_FONT}, ${EMOJI_FONT}, sans-serif`;

const hasKorean = (text: string) =>
  /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text ?? "");
const autoFont = (text: string) =>
  hasKorean(text) ? KO_FONT_STACK : RU_FONT_STACK;

// ── Palette ───────────────────────────────────────────────────────
const BLACK       = "#080501";
const AMBER_DEEP  = "#2A1A00";
const GOLD        = "#C8860A";
const GOLD_BRIGHT = "#F5A623";
const ORANGE      = "#E8650A";
const WHITE       = "#FFFFFF";
const GLOW_GOLD   = "rgba(200,134,10,0.5)";
const GLOW_ORANGE = "rgba(232,101,10,0.45)";

// ── Timing helper ─────────────────────────────────────────────────
const band = (t: number, s: number, e: number, inD = 0.3, outD = 0.35) => {
  const op = interpolate(t, [s, s + inD, e - outD, e], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { op };
};

// ── CARD DURATION — every card is exactly 5 seconds ──────────────
const CARD_DURATION = 5;

// ── Flatten all UI items into a sequential timeline ───────────────
// Each card gets 5 seconds regardless of original video timestamp.
// No subtitles included — only full_screen_title, caption, chapter_title.
const ALLOWED_TYPES = ["full_screen_title", "caption", "chapter_title"];

const allCards: { item: any; start: number; end: number }[] = [];

let cursor = 0;
(editingPlan as any).segments?.forEach((seg: any) => {
  seg.ui?.forEach((item: any) => {
    if (!ALLOWED_TYPES.includes(item.type)) return;
    allCards.push({
      item,
      start: cursor,
      end: cursor + CARD_DURATION,
    });
    cursor += CARD_DURATION;
  });
});

// Total duration = number of cards × 5 seconds
export const CARDS_DURATION = cursor;

export const AutomatedVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>

      {allCards.map(({ item, start, end }, index) => {
        // Only mount cards close to current time
        if (time < start - 0.5 || time > end + 0.5) return null;

        const s = start;
        const e = end;

        // ── FULL SCREEN TITLE ─────────────────────────────────────
        if (item.type === "full_screen_title") {
          const slab      = band(time, s, e, 0.28, 0.32).op;
          const contentOp = band(time, s, e, 0.3, 0.3).op;
          const kickerOp  = band(time, s + 0.1, e, 0.28, 0.3).op;
          const titleScale = interpolate(time, [s, s + 0.4], [0.93, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const ulW = interpolate(time, [s + 0.18, s + 0.9], [0, 220], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });

          return (
            <AbsoluteFill
              key={index}
              style={{
                background: `linear-gradient(180deg,
                  rgba(8,5,1,0.88) 0%,
                  rgba(42,26,0,0.88) 100%)`,
                justifyContent: "center",
                alignItems: "center",
                opacity: slab,
              }}
            >
              <div style={{
                opacity: contentOp,
                textAlign: "center",
                padding: "0 120px",
                transform: `scale(${titleScale})`,
              }}>

                {/* Kicker */}
                <div style={{
                  color: GOLD_BRIGHT,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 8,
                  marginBottom: 22,
                  opacity: kickerOp,
                  textTransform: "uppercase",
                  textShadow: `0 0 20px ${GLOW_GOLD}`,
                  fontFamily: autoFont(item.kicker ?? ""),
                }}>
                  {item.kicker ?? "● MICHAEL KVON"}
                </div>

                {/* Main title */}
                <div style={{
                  color: WHITE,
                  fontSize: 96,
                  fontWeight: 900,
                  lineHeight: 1.04,
                  textTransform: "uppercase",
                  textShadow: `0 4px 40px rgba(0,0,0,0.8), 0 0 80px rgba(200,134,10,0.15)`,
                  fontFamily: autoFont(item.text),
                }}>
                  {item.text}
                </div>

                {/* Subtext */}
                {item.subtext && (
                  <div style={{
                    marginTop: 18,
                    color: WHITE,
                    opacity: 0.6,
                    fontSize: 38,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    fontFamily: autoFont(item.subtext),
                  }}>
                    {item.subtext}
                  </div>
                )}

                {/* Gold underline sweep */}
                <div style={{
                  marginTop: 28,
                  height: 3,
                  width: ulW,
                  marginLeft: "auto",
                  marginRight: "auto",
                  background: `linear-gradient(90deg, ${GOLD}, ${ORANGE})`,
                  boxShadow: `0 0 16px ${GLOW_ORANGE}`,
                }} />

              </div>
            </AbsoluteFill>
          );
        }

        // ── CAPTION ───────────────────────────────────────────────
        if (item.type === "caption") {
          const op  = band(time, s, e, 0.25, 0.28).op;
          const pop = interpolate(
            time, [s, s + 0.14, s + 0.32], [0.8, 1.06, 1.0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const ty = interpolate(time, [s, s + 0.32], [14, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });

          return (
            <AbsoluteFill key={index} style={{ backgroundColor: "transparent" }}>
              <div style={{
                position: "absolute", top: 70, left: 70,
                opacity: op,
                transform: `translateY(${ty}px) scale(${pop})`,
                transformOrigin: "left top",
              }}>
                <div style={{
                  background: `rgba(42,26,0,0.88)`,
                  border: `2px solid ${GOLD}`,
                  borderRadius: 14,
                  padding: "14px 26px",
                  color: GOLD_BRIGHT,
                  fontSize: 28,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontFamily: autoFont(item.text),
                  boxShadow: `0 10px 40px rgba(0,0,0,0.55), 0 0 20px ${GLOW_GOLD}`,
                }}>
                  {item.text}
                </div>
              </div>
            </AbsoluteFill>
          );
        }

        // ── CHAPTER TITLE ─────────────────────────────────────────
        if (item.type === "chapter_title") {
          const op = band(time, s, e, 0.28, 0.32).op;
          const tx = interpolate(time, [s, s + 0.38], [44, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });

          return (
            <AbsoluteFill key={index} style={{ backgroundColor: "transparent" }}>
              <div style={{
                position: "absolute", top: 70, right: 70,
                opacity: op,
                transform: `translateX(${tx}px)`,
              }}>
                <div style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${ORANGE})`,
                  color: BLACK,
                  padding: "14px 28px",
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: 28,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontFamily: autoFont(item.text),
                  boxShadow: `0 10px 40px rgba(0,0,0,0.45), 0 0 24px ${GLOW_ORANGE}`,
                }}>
                  {item.text}
                </div>
              </div>
            </AbsoluteFill>
          );
        }

        return null;
      })}

    </AbsoluteFill>
  );
};