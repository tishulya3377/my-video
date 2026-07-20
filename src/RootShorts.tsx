import React from "react";
import {Composition} from "remotion";
import {ShortsVideo} from "./ShortsVideo";

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
    shortId:1
}}
calculateMetadata={async ({props}) => {

    const shortsPlan = require("../public/shorts_plan.json");

    const short =
        shortsPlan.shorts.find(
            (s:any)=>s.id === props.shortId
        )
        ||
        shortsPlan.shorts[0];


    const duration =
        Math.ceil(
            (short.end - short.start) * FPS
        );


    return {
        durationInFrames: duration
    };

}}
/>
  );
};