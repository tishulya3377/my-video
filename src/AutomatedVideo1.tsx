import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

import editingPlan from "./editing_plan.json";

const GREEN = "#00FF00";

const GOLD = "#F5A623";
const WHITE = "#FFFFFF";
const ORANGE = "#E8650A";

const segments: any[] = editingPlan.segments ?? [];

const lastSegment = segments[segments.length - 1];

export const TOTAL_DURATION =
  lastSegment?.end ?? 10;

function fade(
  time: number,
  start: number,
  end: number
) {
  if (end - start < 0.7) {
    return 1;
  }

  return interpolate(
    time,
    [
      start,
      start + 0.3,
      end - 0.3,
      end,
    ],
    [
      0,
      1,
      1,
      0,
    ],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
}

function getStyle(type: string) {
  switch (type) {
    case "full_screen_title":
      return {
        position: "absolute" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "90%",
        textAlign: "center" as const,
        fontSize: 110,
        fontWeight: 900,
        color: WHITE,
        textTransform: "uppercase" as const,
        textShadow: "0 0 20px rgba(0,0,0,.8)",
      };

    case "chapter_title":
      return {
        position: "absolute" as const,
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center" as const,
        fontSize: 72,
        fontWeight: 900,
        color: GOLD,
        textTransform: "uppercase" as const,
        textShadow: "0 0 20px rgba(0,0,0,.8)",
      };

    case "lower_third":
      return {
        position: "absolute" as const,
        bottom: 120,
        left: 80,
        right: 80,
        fontSize: 48,
        fontWeight: 800,
        color: WHITE,
        background: "rgba(0,0,0,.55)",
        padding: "18px 28px",
        borderLeft: `8px solid ${ORANGE}`,
      };

    case "caption":
      return {
        position: "absolute" as const,
        bottom: 140,
        left: "50%",
        transform: "translateX(-50%)",
        width: "88%",
        textAlign: "center" as const,
        fontSize: 52,
        fontWeight: 700,
        color: WHITE,
        textShadow: "0 0 20px rgba(0,0,0,.8)",
      };

    case "label":
      return {
        position: "absolute" as const,
        top: 60,
        left: 60,
        fontSize: 40,
        fontWeight: 800,
        color: ORANGE,
      };

    case "fact":
      return {
        position: "absolute" as const,
        bottom: 240,
        left: "50%",
        transform: "translateX(-50%)",
        width: "80%",
        textAlign: "center" as const,
        fontSize: 54,
        fontWeight: 800,
        color: GOLD,
      };

    case "quote":
      return {
        position: "absolute" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "82%",
        textAlign: "center" as const,
        fontSize: 64,
        fontWeight: 700,
        color: WHITE,
        fontStyle: "italic",
      };

    default:
      return {
        position: "absolute" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        textAlign: "center" as const,
        fontSize: 56,
        fontWeight: 800,
        color: WHITE,
      };
  }
}

export const AutomatedVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const time = frame / fps;

  return (
    <AbsoluteFill
      style={{
        background: GREEN,
      }}
    >
      {segments.map((segment, index) => {
        if (time < segment.start || time > segment.end) {
          return null;
        }

        return (
          <div
            key={index}
            style={{
              opacity: fade(
                time,
                segment.start,
                segment.end
              ),
              ...getStyle(segment.type),
            }}
          >
            {segment.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};