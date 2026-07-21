import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

import editingPlan from "./editing_plan.json";

const GREEN = "#00FF00";

const ORANGE = "#E8650A";
const GOLD = "#F5A623";
const WHITE = "#FFFFFF";

const segments = editingPlan.segments ?? [];

const lastSegment = segments[segments.length - 1];

export const TOTAL_DURATION =
  lastSegment?.end ?? 10;

function fade(
  time:number,
  start:number,
  end:number
){
  if(end - start < 0.7){
    return 1;
  }

  return interpolate(
    time,
    [
      start,
      start + 0.3,
      end - 0.3,
      end
    ],
    [
      0,
      1,
      1,
      0
    ],
    {
      extrapolateLeft:"clamp",
      extrapolateRight:"clamp"
    }
  );
}

function getStyle(type:string){

  switch(type){

    case "full_screen_title":

      return {
        fontSize:110,
        fontWeight:900,
        textAlign:"center" as const,
        color:WHITE,
        textTransform:"uppercase" as const,
        padding:"0 120px",
        textShadow:
          "0 0 20px rgba(0,0,0,.8)"
      };

    case "chapter_title":

      return {
        fontSize:70,
        fontWeight:900,
        color:GOLD,
        textTransform:"uppercase" as const,
        textShadow:
          "0 0 20px rgba(0,0,0,.8)"
      };

    default:

      return {
        fontSize:50,
        fontWeight:800,
        color:WHITE,
        textShadow:
          "0 0 20px rgba(0,0,0,.8)"
      };
  }
}
export const AutomatedVideo: React.FC = () => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const time = frame / fps;

  const segments =
    editingPlan.segments ?? [];

  return (

    <AbsoluteFill
      style={{
        background: GREEN,
      }}
    >

      {segments.map((segment:any, i:number)=>{

        if(
          time < segment.start ||
          time > segment.end
        ){
          return null;
        }

        const opacity =
          fade(
            time,
            segment.start,
            segment.end
          );

        return (

          <React.Fragment key={i}>

            {(segment.ui ?? []).map(
              (item:any,index:number)=>{

                const style =
                  getStyle(item.type);

                let position:any={};

                switch(item.type){

                  case "full_screen_title":

                    position={
                      top:"50%",
                      left:"50%",
                      transform:
                        "translate(-50%,-50%)",
                      width:"90%"
                    };

                    break;

                  case "chapter_title":

                    position={
                      top:70,
                      right:70
                    };

                    break;

                  case "caption":

                    position={
                      bottom:120,
                      left:"50%",
                      transform:"translateX(-50%)",
                      width:"88%"
                    };

                    break;

                  case "label":

                    position={
                      top:70,
                      left:70
                    };

                    break;

                  case "quote":

                    position={
                      top:"50%",
                      left:"50%",
                      transform:
                        "translate(-50%,-50%)",
                      width:"85%"
                    };

                    break;

                  case "fact":

                    position={
                      bottom:250,
                      left:"50%",
                      transform:"translateX(-50%)",
                      width:"80%"
                    };

                    break;

                  default:

                    position={
                      top:"50%",
                      left:"50%",
                      transform:
                        "translate(-50%,-50%)"
                    };
                }

                return (

                  <div
                    key={index}
                    style={{
                      position:"absolute",
                      opacity,
                      ...position,
                      ...style
                    }}
                  >
                    {item.text}
                  </div>

                );

              }
            )}

          </React.Fragment>

        );

      })}

    </AbsoluteFill>

  );

};