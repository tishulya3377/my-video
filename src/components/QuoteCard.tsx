import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT_STACK } from "./theme";
import { useSegmentTiming, SPRING_SMOOTH } from "./useSegmentTiming";

interface Props {
  text: string;
  start: number;
  end: number;
}

export const QuoteCard: React.FC<Props> = ({ text, start, end }) => {
  const { enter, opacity, blur } = useSegmentTiming(start, end, SPRING_SMOOTH);

  const scale = interpolate(enter, [0, 1], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: "80%",
        textAlign: "center",
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 96,
          color: "rgba(245,166,35,0.35)",
          lineHeight: 0.4,
          marginBottom: 24,
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 60,
          fontWeight: 500,
          fontStyle: "italic",
          color: COLORS.white,
          filter: `blur(${blur}px)`,
          textShadow: "0 14px 40px rgba(59,31,8,0.65)",
        }}
      >
        {text}
      </div>
    </div>
  );
};
