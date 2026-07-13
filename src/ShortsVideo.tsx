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


// ==========================================
// SHORTS ENGINE
// ==========================================
// 1080x1920 upload-ready shorts
// Burned captions
// Michael Kvon style
// ==========================================


const GOLD = "#C8860A";
const ORANGE = "#E8650A";
const WHITE = "#FFFFFF";


type Caption = {
  start:number;
  end:number;
  text:string;
};


type ShortData = {
  start:number;
  end:number;
  hook?:string;
  captions?:Caption[];
};



const SHORTS:ShortData[] = [
  {
    start:0,
    end:60,
    hook:""
  }
];



// ==========================================
// WORD CAPTION
// ==========================================

const Caption = ({
  text,
  scale
}:{
  text:string;
  scale:number;
}) => {

  return (
    <div
      style={{
        fontSize:70,
        fontWeight:900,
        color:WHITE,
        textAlign:"center",
        textShadow:"0 8px 20px black",
        transform:`scale(${scale})`,
        fontFamily:"Inter, sans-serif",
        padding:"0 40px",
        lineHeight:1.1
      }}
    >
      {text}
    </div>
  );
};



// ==========================================
// MAIN COMPONENT
// ==========================================


export const ShortsVideo:React.FC = () => {


const frame = useCurrentFrame();

const {
 fps,
 durationInFrames
}=useVideoConfig();



const time = frame / fps;



const short = SHORTS[0];



const progress =
interpolate(
 frame,
 [0,durationInFrames],
 [0,100],
 {
  extrapolateRight:"clamp"
 }
);



const captions =
short.captions ?? [];



const activeCaption =
captions.find(
 c =>
 time >= c.start &&
 time <= c.end
);



const captionScale =
activeCaption
?
spring({
 frame:
 frame -
 activeCaption.start * fps,
 fps,
 config:{
  damping:12,
  stiffness:150
 }
})
:0;



const camera =
interpolate(
 frame,
 [0,durationInFrames],
 [1,1.05],
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

<AbsoluteFill
style={{
 transform:`scale(${camera})`
}}
>

<Video

src={staticFile("source.mov")}

startFrom={Math.floor(short.start * fps)}

style={{
 width:"100%",
 height:"100%",
 objectFit:"cover"
}}

/>

</AbsoluteFill>



{/* DARK GRADIENT */}

<AbsoluteFill
style={{

background:
`
linear-gradient(
180deg,
rgba(0,0,0,.45),
transparent 40%,
rgba(0,0,0,.65)
)
`

}}
/>



{/* HOOK */}

{
short.hook &&

<div
style={{

position:"absolute",

top:120,

left:50,

right:50,

fontSize:90,

fontWeight:1000,

color:WHITE,

textAlign:"center",

fontFamily:"Inter, sans-serif"

}}
>

{short.hook}

</div>

}



{/* CAPTIONS */}

{
activeCaption &&

<div
style={{

position:"absolute",

bottom:320,

left:0,

right:0,

display:"flex",

justifyContent:"center"

}}
>

<Caption

text={activeCaption.text}

scale={captionScale}

/>

</div>

}




{/* PROGRESS */}

<div
style={{

position:"absolute",

bottom:100,

left:60,

right:60,

height:12,

background:"rgba(255,255,255,.25)",

borderRadius:20,

overflow:"hidden"

}}
>


<div
style={{

height:"100%",

width:`${progress}%`,

background:
`
linear-gradient(
90deg,
${GOLD},
${ORANGE}
)
`

}}
/>


</div>




{/* BRAND */}

<div
style={{

position:"absolute",

top:50,

left:50,

fontSize:28,

fontWeight:900,

letterSpacing:"0.2em",

color:GOLD

}}
>

MICHAEL KVON

</div>



</AbsoluteFill>

);

};