import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT_STACK, SHADOW_SOFT } from "./theme";
import { useSegmentTiming, SPRING_SMOOTH } from "./useSegmentTiming";

interface Props {
  text: string;
  start: number;
  end: number;
}

export const LowerThird: React.FC<Props> = ({ text, start, end }) => {
  const { enter, opacity, blur } = useSegmentTiming(start, end, SPRING_SMOOTH);

  const translateX = interpolate(enter, [0, 1], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const widthPct = interpolate(enter, [0, 1], [40, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const underlineWidth = interpolate(enter, [0, 1], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 130,
        left: 80,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 1100,
          width: `${widthPct}%`,
          minWidth: 320,
          background: "rgba(59, 31, 8, 0.38)",
          backdropFilter: "blur(18px)",
          borderRadius: 14,
          padding: "22px 36px 22px 28px",
          borderLeft: `6px solid ${COLORS.orange}`,
          boxShadow: SHADOW_SOFT,
          filter: `blur(${blur}px)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 46,
            fontWeight: 700,
            color: COLORS.white,
            lineHeight: 1.25,
          }}
        >
          {text}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 2,
            width: `${underlineWidth}%`,
            background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.orange})`,
          }}
        />
      </div>
    </div>
  );
};
