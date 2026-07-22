import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT_STACK, SHADOW_GLOW_GOLD } from "./theme";
import { useSegmentTiming, SPRING_BOUNCY } from "./useSegmentTiming";

interface Props {
  text: string;
  start: number;
  end: number;
}

export const LabelPill: React.FC<Props> = ({ text, start, end }) => {
  const { enter, opacity } = useSegmentTiming(start, end, SPRING_BOUNCY);

  const scale = interpolate(enter, [0, 1], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: 64,
        opacity: Math.min(opacity, 1),
        transform: `scale(${scale})`,
        transformOrigin: "left top",
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 34,
          fontWeight: 700,
          color: COLORS.white,
          background: `linear-gradient(120deg, ${COLORS.orange}, ${COLORS.deepGold})`,
          padding: "12px 28px",
          borderRadius: 999,
          boxShadow: SHADOW_GLOW_GOLD,
          letterSpacing: "0.5px",
        }}
      >
        {text}
      </div>
    </div>
  );
};
