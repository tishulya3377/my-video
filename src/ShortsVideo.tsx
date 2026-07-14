import React from "react";
import {
  AbsoluteFill,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

import shortsPlan from "./shorts_plan.json";
import cuts from "./cuts.json";

type Props = {
  shortId: number;
};

type Cut = {
  start:number;
  end:number;
  duration:number;
  text:string;
};

type Short = {
  id:number;
  start:number;
  end:number;
  hook:string;
  title:string;
};


const GOLD = "#F5A623";
const WHITE = "#FFFFFF";


export const ShortsVideo:React.FC<Props> = ({
  shortId
}) => {


const frame = useCurrentFrame();
const {fps}=useVideoConfig();

const time = frame / fps;



const shorts:any[] = (shortsPlan as any).shorts;


const short =
shorts.find(
(s)=>s.id===shortId
) || shorts[0];



const localTime =
time + short.start;



const activeCaption =
(cuts as Cut[]).find(
(c)=>
localTime >= c.start &&
localTime <= c.end
);



const captionScale =
spring({
 frame,
 fps,
 config:{
  damping:12,
  stiffness:150
 }
});



const hookOpacity =
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
 background:"#000",
 overflow:"hidden"
}}
>


{/* VIDEO */}

<AbsoluteFill>

<Video

src={staticFile("video.mp4")}

startFrom={
 Math.floor(short.start * fps)
}

endAt={
 Math.floor(short.end * fps)
}

style={{
 width:"100%",
 height:"100%",
 objectFit:"cover"
}}

/>

</AbsoluteFill>



{/* DARK OVERLAY */}

<AbsoluteFill
style={{
background:
"linear-gradient(180deg,rgba(0,0,0,.55),transparent 40%,rgba(0,0,0,.7))"
}}
/>



{/* HOOK */}

<div
style={{
position:"absolute",
top:120,
left:50,
right:50,

opacity:hookOpacity,

fontSize:70,
fontWeight:900,

fontFamily:"Inter, sans-serif",

textAlign:"center",

color:WHITE,

textShadow:"0 5px 20px black"
}}
>

{short.hook}

</div>




{/* CAPTION */}

{
activeCaption &&

<div
style={{
position:"absolute",

bottom:300,

left:40,
right:40,

display:"flex",
justifyContent:"center",

transform:
`scale(${captionScale})`
}}
>

<div

style={{

fontSize:65,

fontWeight:900,

color:WHITE,

fontFamily:"Inter, sans-serif",

textAlign:"center",

textShadow:
"0 5px 15px black"

}}

>

{activeCaption.text}

</div>


</div>

}




{/* BRAND */}

<div

style={{

position:"absolute",

top:50,

left:50,

fontSize:30,

fontWeight:900,

letterSpacing:5,

color:GOLD

}}

>

MICHAEL KVON

</div>



</AbsoluteFill>

);

};