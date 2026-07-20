import React from "react";
import { Composition } from "remotion";
import { AutomatedVideo, TOTAL_DURATION } from "./AutomatedVideo";
import { ShortsVideo } from "./ShortsVideo";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AutoCutProject"
        component={AutomatedVideo}
        durationInFrames={Math.ceil(TOTAL_DURATION * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};