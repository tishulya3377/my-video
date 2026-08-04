import React from "react";
import {
  AbsoluteFill,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

import shortsPlan from "./shorts_plan.json";


type Props = {
  shortId: number;
};


const WHITE = "#FFFFFF";
const BLACK = "#000000";
const GOLD = "#F5A623";


const FONT =
  "Inter, Helvetica Neue, Arial, sans-serif";


export const ShortsVideo: React.FC<Props> = ({
  shortId,
}) => {

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const time = frame / fps;


  const short =
    shortsPlan.shorts.find(
      (s:any)=>s.id===shortId
    ) || shortsPlan.shorts[0];


  const localTime =
    time + short.start;


  const caption =
    short.captions?.find(
      (c:any)=>
        localTime >= c.start &&
        localTime <= c.end
    );


  const effects =
    short.effects || [];


  const activeEffect =
    (type:string)=>{

      const e =
        effects
        .filter(
          (x:any)=>x.type===type
        )
        .reverse()
        .find(
          (x:any)=>
          localTime>=x.time &&
          localTime<=x.time+4
        );

      return e;
    };


  const hook =
    activeEffect("hook_zoom");

  const chapter =
    activeEffect("chapter");

  const highlight =
    activeEffect("highlight");

  const quote =
    activeEffect("quote");

  const finalPunch =
    activeEffect("final_punch");



  // cinematic motion

  const zoom =
    hook
    ?
    spring({
      frame,
      fps,
      config:{
        damping:20,
        stiffness:80
      }
    })
    :
    0;


  const scale =
    1 + zoom*0.03;



  const fade =
    interpolate(
      frame,
      [0,20],
      [0,1],
      {
        extrapolateRight:"clamp"
      }
    );



return (

<AbsoluteFill
style={{
background:BLACK,
overflow:"hidden"
}}
>


{/* VIDEO */}

<AbsoluteFill
style={{
transform:`scale(${scale})`
}}
>

<Video

src={staticFile("video.mp4")}

style={{
width:"100%",
height:"100%",
objectFit:"cover"
}}

/>

</AbsoluteFill>



{/* CINEMA COLOR */}

<AbsoluteFill

style={{

background:
"linear-gradient(180deg,rgba(0,0,0,.65),transparent 35%,rgba(0,0,0,.75))"

}}

/>



{/* HOOK CARD */}

<div

style={{

position:"absolute",

top:120,

left:60,

right:60,

textAlign:"center",

opacity:fade,

fontFamily:FONT,

fontSize:64,

fontWeight:700,

color:WHITE,

lineHeight:1.15,

textShadow:
"0 10px 40px black"

}}

>

{short.hook}

</div>





{/* CHAPTER CARD */}

{chapter &&

<div

style={{

position:"absolute",

top:"35%",

left:0,

right:0,

textAlign:"center",

fontFamily:FONT,

color:GOLD,

fontSize:30,

letterSpacing:8,

fontWeight:600

}}

>

<div>

{chapter.text}

</div>


<div

style={{

width:180,

height:2,

background:GOLD,

margin:"20px auto"

}}

/>


</div>

}





{/* HIGHLIGHT */}

{highlight &&

<div

style={{

position:"absolute",

top:"45%",

left:40,

right:40,

textAlign:"center",

fontFamily:FONT,

fontSize:90,

fontWeight:900,

color:GOLD,

textShadow:
"0 10px 40px black"

}}

>

{highlight.text}

</div>

}





{/* QUOTE CARD */}

{quote &&

<AbsoluteFill

style={{

justifyContent:"center",

alignItems:"center",

padding:80,

}}

>


<div

style={{

fontFamily:"Georgia,serif",

fontSize:48,

fontStyle:"italic",

color:WHITE,

textAlign:"center",

lineHeight:1.3,

textShadow:
"0 8px 30px black"

}}

>

“{quote.text}”

</div>


</AbsoluteFill>

}





{/* SUBTITLES */}

{caption && !quote &&

<div

style={{

position:"absolute",

bottom:260,

left:50,

right:50,

textAlign:"center",

fontFamily:FONT,

fontSize:58,

fontWeight:700,

color:WHITE,

lineHeight:1.25,

whiteSpace:"pre-line",

textShadow:
"0 8px 30px black"

}}

>

{caption.text}

</div>

}





{/* FINAL MOMENT */}

{finalPunch &&

<div

style={{

position:"absolute",

inset:0,

background:
"radial-gradient(circle,rgba(245,166,35,.35),transparent 60%)"

}}

/>

}





{/* BRAND */}

<div

style={{

position:"absolute",

top:50,

left:50,

fontFamily:FONT,

fontSize:26,

fontWeight:600,

letterSpacing:5,

color:GOLD

}}

>

MICHAEL KVON

</div>


</AbsoluteFill>

);

};