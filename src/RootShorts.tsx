import React from "react";
import {Composition} from "remotion";
import {ShortsVideo} from "./ShortsVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ShortsProject"
      component={ShortsVideo}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={30000}
      defaultProps={{
        shortId: 1
      }}
    />
  );
};