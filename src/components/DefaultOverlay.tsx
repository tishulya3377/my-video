import React from "react";
import { COLORS, FONT_STACK } from "./theme";
import { useSegmentTiming, SPRING_SMOOTH } from "./useSegmentTiming";

interface Props {
  text: string;
  start: number;
  end: number;
}

export const DefaultOverlay: React.FC<Props> = ({ text, start, end }) => {
  const { opacity, blur } = useSegmentTiming(start, end, SPRING_SMOOTH);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.white,
          filter: `blur(${blur}px)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
