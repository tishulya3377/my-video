import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

export const Composition = () => {
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile("source.mov")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </AbsoluteFill>
  );
};