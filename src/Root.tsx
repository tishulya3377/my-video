import React from "react";
import { Composition } from "remotion";
import { ShortsVideo } from "./ShortsVideo";
import editingPlan from "./editing_plan.json";
import { AutomatedVideo, CARDS_DURATION } from "./AutomatedVideo";

const FPS = 30;

// safe segment extraction
const segments = editingPlan?.segments ?? [];

// compute total duration safely
const totalDuration =
  segments.length > 0 ? segments[segments.length - 1].end : 60;

const totalFrames = Math.ceil(totalDuration * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* =========================
          LONG FORM VIDEO (16:9)
         ========================= */}
      <Composition
  id="AutoCutProject"
  component={AutomatedVideo}
  durationInFrames={Math.ceil(CARDS_DURATION * FPS)}
  fps={FPS}
  width={1920}
  height={1080}
  defaultProps={{}}
/>

      {/* =========================
          SHORTS VIDEO (9:16)
         ========================= */}
      <Composition
        id="ShortsProject"
        component={ShortsVideo}
        durationInFrames={60 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  );
};
