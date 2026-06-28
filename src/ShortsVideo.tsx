import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Video,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

import cuts from "./cuts.json";
import shorts from "./shorts.json";

const NEON = "#D8FF3E";

export const ShortsVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shortClips = shorts as any[];
  const subtitles = cuts as any[];

  const shortTime = frame / fps;

  let accumulated = 0;
  let originalVideoTime = 0;
  let activeClip: any = null;

  for (const clip of shortClips) {
    const clipDuration = clip.end - clip.start;

    if (
      shortTime >= accumulated &&
      shortTime < accumulated + clipDuration
    ) {
      activeClip = clip;

      originalVideoTime =
        clip.start +
        (shortTime - accumulated);

      break;
    }

    accumulated += clipDuration;
  }

  const currentSubtitle = subtitles.find(
    (s) =>
      originalVideoTime >= s.start &&
      originalVideoTime < s.end
  );

  const subtitleProgress =
    currentSubtitle
      ? (originalVideoTime -
          currentSubtitle.start) /
        (currentSubtitle.end -
          currentSubtitle.start)
      : 0;

  const underlineWidth =
    80 + subtitleProgress * 350;

  const hookZoom = interpolate(
    frame,
    [0, 25],
    [1.25, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  let sequenceStart = 0;

  return (
    <AbsoluteFill>

      <Audio
        src={staticFile("sfx/boom.mp3")}
        volume={0.9}
      />

      {shortClips.map((clip, index) => {
        const durationFrames = Math.floor(
          (clip.end - clip.start) * fps
        );

        const sequence = (
          <Sequence
            key={index}
            from={sequenceStart}
            durationInFrames={durationFrames}
          >
            <Video
              src={staticFile("source.mp4")}
              startFrom={Math.floor(
                clip.start * fps
              )}
              endAt={Math.floor(
                clip.end * fps
              )}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${hookZoom})`,
                transformOrigin:
                  "center center",
              }}
            />
          </Sequence>
        );

        sequenceStart += durationFrames;

        return sequence;
      })}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,.25), rgba(0,0,0,.02), rgba(0,0,0,.08))",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 18px",
            border:
              "1px solid rgba(216,255,62,.4)",
            borderRadius: 999,
            backdropFilter: "blur(12px)",
            background:
              "rgba(0,0,0,.15)",
            color: NEON,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 3,
          }}
        >
          РУССКИЙ В КОРЕЕ
        </div>
      </div>

      {currentSubtitle && (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            bottom: 300,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: 760,
              padding: "24px 30px",
              borderRadius: 28,
              backdropFilter:
                "blur(16px)",
              background:
                "rgba(0,0,0,.12)",
              border:
                "1px solid rgba(255,255,255,.06)",
            }}
          >
            <div
              style={{
                width: underlineWidth,
                height: 3,
                background: NEON,
                margin:
                  "0 auto 18px auto",
                borderRadius: 999,
                boxShadow:
                  "0 0 20px rgba(216,255,62,.5)",
              }}
            />

            <div
              style={{
                textAlign: "center",
                fontSize: 54,
                lineHeight: 1.2,
                fontWeight: 900,
                color: "white",
                textTransform:
                  "uppercase",
                textShadow:
                  "0 6px 24px rgba(0,0,0,.95)",
                fontFamily:
                  "Helvetica, Arial, sans-serif",
                whiteSpace: "normal",
                wordBreak: "normal",
                overflowWrap:
                  "normal",
              }}
            >
              {currentSubtitle.text}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};