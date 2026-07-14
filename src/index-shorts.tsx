import { registerRoot } from "remotion";
import { ShortsVideo } from "./ShortsVideo";

import { Composition } from "remotion";

const Root = () => {
  return (
    <>
      <Composition
        id="ShortsProject"
        component={ShortsVideo}
        durationInFrames={60 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          shortId: 1,
        }}
      />
    </>
  );
};

registerRoot(Root);