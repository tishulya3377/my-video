import React from "react";
import { COLORS } from "./theme";

interface Props {
  progress: number; // 0 -> 1
  width?: number;
}

export const GoldDivider: React.FC<Props> = ({ progress, width = 140 }) => {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div
      style={{
        width,
        height: 3,
        margin: "0 auto",
        background: `linear-gradient(90deg, transparent, ${COLORS.gold}, ${COLORS.orange}, transparent)`,
        transform: `scaleX(${clamped})`,
        transformOrigin: "center",
        boxShadow: "0 0 16px rgba(245, 166, 35, 0.6)",
      }}
    />
  );
};
