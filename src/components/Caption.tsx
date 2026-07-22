import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT_STACK } from "./theme";
import { useSegmentTiming, SPRING_SMOOTH } from "./useSegmentTiming";

interface Props {
  text: string;
  start: number;
  end: number;
}

export const Caption: React.FC<Props> = ({ text, start, end }) => {
  const { enter, opacity, blur } = useSegmentTiming(start, end, SPRING_SMOOTH);

  const scale = interpolate(enter, [0, 1], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(enter, [0, 1], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 150,
        left: "50%",
        width: "86%",
        textAlign: "center",
        transform: `translate(-50%, ${translateY}px) scale(${scale})`,
        opacity,
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: FONT_STACK,
          fontSize: 50,
          fontWeight: 600,
          color: COLORS.white,
          filter: `blur(${blur}px)`,
          textShadow: "0 10px 28px rgba(59,31,8,0.7)",
          padding: "8px 20px",
          background: "rgba(59,31,8,0.28)",
          borderRadius: 10,
        }}
      >
        {text}
      </span>
    </div>
  );
};
