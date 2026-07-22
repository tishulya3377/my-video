import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT_STACK, SHADOW_SOFT } from "./theme";
import { useSegmentTiming, SPRING_BOUNCY } from "./useSegmentTiming";

interface Props {
  text: string;
  start: number;
  end: number;
}

export const FactCard: React.FC<Props> = ({ text, start, end }) => {
  const { enter, opacity, blur } = useSegmentTiming(start, end, SPRING_BOUNCY);

  const scale = interpolate(enter, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 260,
        left: "50%",
        transform: `translateX(-50%) scale(${scale})`,
        opacity: Math.min(opacity, 1),
        width: "78%",
        maxWidth: 1000,
      }}
    >
      <div
        style={{
          position: "relative",
          background: "rgba(59,31,8,0.32)",
          border: "1px solid rgba(245,166,35,0.4)",
          borderRadius: 18,
          padding: "28px 40px",
          boxShadow: SHADOW_SOFT,
          filter: `blur(${blur}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 24,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.orange})`,
          }}
        />
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.gold,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
