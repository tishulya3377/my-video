import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import editingPlan from "./editing_plan.json";

import {
  BackgroundAccents,
  FullScreenTitle,
  ChapterTitle,
  LowerThird,
  Caption,
  LabelPill,
  FactCard,
  QuoteCard,
  DefaultOverlay,
} from "./components";

const GREEN = "#00FF00";

const segments: any[] = editingPlan.editing_plan ?? [];

const lastSegment = segments[segments.length - 1];

export const TOTAL_DURATION = lastSegment?.end ?? 10;

function renderSegment(segment: any, key: number) {
  const { type, text, start, end } = segment;

  switch (type) {
    case "full_screen_title":
      return <FullScreenTitle key={key} text={text} start={start} end={end} />;
    case "chapter_title":
      return <ChapterTitle key={key} text={text} start={start} end={end} />;
    case "lower_third":
      return <LowerThird key={key} text={text} start={start} end={end} />;
    case "caption":
      return <Caption key={key} text={text} start={start} end={end} />;
    case "label":
      return <LabelPill key={key} text={text} start={start} end={end} />;
    case "fact":
      return <FactCard key={key} text={text} start={start} end={end} />;
    case "quote":
      return <QuoteCard key={key} text={text} start={start} end={end} />;
    default:
      return <DefaultOverlay key={key} text={text} start={start} end={end} />;
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
      <BackgroundAccents />

      {segments.map((segment, index) => {
        if (time < segment.start || time > segment.end) {
          return null;
        }

        return renderSegment(segment, index);
      })}
    </AbsoluteFill>
  );
};
