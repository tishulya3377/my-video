import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT_STACK } from "./theme";
import { useSegmentTiming, SPRING_SMOOTH } from "./useSegmentTiming";
import { GoldDivider } from "./GoldDivider";

interface Props {
  text: string;
  start: number;
  end: number;
}

export const ChapterTitle: React.FC<Props> = ({ text, start, end }) => {
  const { enter, opacity, blur } = useSegmentTiming(start, end, SPRING_SMOOTH);

  const translateY = interpolate(enter, [0, 1], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelReveal = interpolate(enter, [0, 1], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        opacity,
      }}
    >
      <div style={{ position: "relative", padding: "20px 52px", display: "inline-block" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            background: "linear-gradient(180deg, rgba(59,31,8,0.55), rgba(59,31,8,0.15))",
            clipPath: `inset(0 ${panelReveal}% 0 0)`,
          }}
        />
        <div style={{ position: "relative", transform: `translateY(${translateY}px)` }}>
          <GoldDivider progress={enter} width={90} />
          <div
            style={{
              margin: "18px 0",
              fontFamily: FONT_STACK,
              fontSize: 72,
              fontWeight: 800,
              color: COLORS.gold,
              textTransform: "uppercase",
              letterSpacing: "2px",
              filter: `blur(${blur}px)`,
              textShadow: "0 8px 30px rgba(59,31,8,0.6)",
            }}
          >
            {text}
          </div>
          <GoldDivider progress={enter} width={90} />
        </div>
      </div>
    </div>
  );
};
