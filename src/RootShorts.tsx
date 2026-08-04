import React from "react";
import { Composition } from "remotion";
import { ShortsVideo } from "./ShortsVideo";
import shortsPlan from "./shorts_plan.json";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ShortsProject"
      component={ShortsVideo}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={1800}
      defaultProps={{
        shortId: 1,
      }}
      calculateMetadata={({ props }) => {
        const short =
          shortsPlan.shorts.find(
            (s: any) => s.id === props.shortId
          ) || shortsPlan.shorts[0];

        return {
          durationInFrames: Math.ceil(
            (short.end - short.start) * FPS
          ),
        };
      }}
    />
  );
};