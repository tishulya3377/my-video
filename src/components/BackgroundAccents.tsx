import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "./theme";

/**
 * Very low-opacity drifting gold lines rendered behind every overlay.
 * Purely decorative motion so the frame never feels static, without
 * competing with the text on top of it.
 */
export const BackgroundAccents: React.FC = () => {
  const frame = useCurrentFrame();

  const lines = [0, 1, 2].map((i) => {
    const phase = frame / 90 + i * 2.1;
    const x = 50 + Math.sin(phase) * 18 + i * 22 - 22;
    const y = 22 + i * 28 + Math.cos(phase * 0.7) * 6;
    const rotate = Math.sin(phase * 0.5) * 6;
    return { x, y, rotate, key: i };
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {lines.map((l) => (
        <div
          key={l.key}
          style={{
            position: "absolute",
            top: `${l.y}%`,
            left: `${l.x}%`,
            width: 240,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            opacity: 0.12,
            transform: `translate(-50%, -50%) rotate(${l.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
};
