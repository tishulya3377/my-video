import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT_STACK } from "./theme";
import { useSegmentTiming, SPRING_SMOOTH } from "./useSegmentTiming";

interface Props {
  text: string;
  start: number;
  end: number;
}

export const FullScreenTitle: React.FC<Props> = ({ text, start, end }) => {
  const { enter, opacity, blur } = useSegmentTiming(start, end, SPRING_SMOOTH);

  const wipe = interpolate(enter, [0, 1], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(enter, [0, 1], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tracking = interpolate(enter, [0, 1], [18, 2], {
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
        width: "90%",
        textAlign: "center",
        opacity,
      }}
    >
      <div style={{ display: "inline-block", clipPath: `inset(0 ${wipe}% 0 0)` }}>
        <span
          style={{
            display: "inline-block",
            fontFamily: FONT_STACK,
            fontSize: 110,
            fontWeight: 800,
            color: COLORS.white,
            letterSpacing: `${tracking}px`,
            textTransform: "uppercase",
            filter: `blur(${blur}px)`,
            textShadow: "0 12px 40px rgba(59, 31, 8, 0.65)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
