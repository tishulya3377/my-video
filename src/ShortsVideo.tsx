import React, {useMemo} from "react";

import {
AbsoluteFill,
Video,
staticFile,
Sequence,
useCurrentFrame,
useVideoConfig,
interpolate,
spring,
} from "remotion";

import {
loadFont as loadInter,
} from "@remotion/google-fonts/Inter";

import {
loadFont as loadNotoKR,
} from "@remotion/google-fonts/NotoSansKR";

import {
loadFont as loadEmoji,
} from "@remotion/google-fonts/NotoEmoji";

import queue from "./shorts_render_queue.json";
import cuts from "./cuts.json";



const {
fontFamily:RU_FONT
}=loadInter();


const {
fontFamily:KO_FONT
}=loadNotoKR();


const {
fontFamily:EMOJI_FONT
}=loadEmoji();





// ------------------------------------------------------------
// COLORS
// ------------------------------------------------------------

const GOLD="#F5A623";

const GOLD_DEEP="#C8860A";

const ORANGE="#E8650A";

const WHITE="#FFFFFF";

const CREAM="#FFF8EE";




// ------------------------------------------------------------
// FONT PICKER
// ------------------------------------------------------------

const hasKorean=(text:string)=>{

return /[\uAC00-\uD7A3]/.test(text);

};



const fontFor=(text:string)=>{

return hasKorean(text)

?`${KO_FONT},${EMOJI_FONT},sans-serif`

:`${RU_FONT},${EMOJI_FONT},sans-serif`;

};




// ------------------------------------------------------------
// PROPS
// ------------------------------------------------------------

type ShortsProps={

shortId:number;

};




// ------------------------------------------------------------
// CAPTION
// ------------------------------------------------------------

type Caption={

start:number;

end:number;

text:string;

};




// ------------------------------------------------------------
// SHORT
// ------------------------------------------------------------

type Short={

id:number;

title:string;

hook:string;

start:number;

end:number;

duration:number;

output:string;

};




// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const clamp=(

v:number,

min:number,

max:number

)=>{

return Math.min(

max,

Math.max(min,v)

);

};





const lerp=(

a:number,

b:number,

t:number

)=>{

return a+(b-a)*t;

};




// ------------------------------------------------------------
// ZOOM CURVE
// ------------------------------------------------------------

const sentenceZoom=(

time:number,

index:number

)=>{

const seed=(index%5);

switch(seed){

case 0:

return 1.00;

case 1:

return 1.03;

case 2:

return 1.06;

case 3:

return 1.04;

default:

return 1.08;

}

};




// ------------------------------------------------------------
// EMPHASIS
// ------------------------------------------------------------

const IMPORTANT_WORDS=[

"2022",

"2023",

"2024",

"2025",

"100",

"1000",

"$",

"₽",

"₩",

"한국",

"Россия",

"KOREA",

"RUSSIA",

"SEOUL",

"ARMY",

"UNIVERSITY"

];




const isImportant=(text:string)=>{

const upper=text.toUpperCase();

return IMPORTANT_WORDS.some(

w=>upper.includes(

w.toUpperCase()

)

);

};




// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

export const ShortsVideo:React.FC<ShortsProps>=({

shortId

})=>{


const frame=

useCurrentFrame();



const {

fps,

width,

height

}=useVideoConfig();




// ------------------------------------------------------------
// FIND SHORT
// ------------------------------------------------------------

const short=useMemo(()=>{

return queue.find(

(s:any)=>

s.id===shortId

);

},[shortId]);




if(!short){

return(

<AbsoluteFill

style={{

background:"black",

justifyContent:"center",

alignItems:"center",

color:"white",

fontSize:70,

}}

>

SHORT NOT FOUND

</AbsoluteFill>

);

}



// ------------------------------------------------------------
// FIND CAPTIONS
// ------------------------------------------------------------

const captions:Caption[]=cuts

.filter((c:any)=>

c.end>=short.start &&

c.start<=short.end

)

.map((c:any)=>({

start:

c.start-short.start,

end:

c.end-short.start,

text:

c.text,

}));




// ------------------------------------------------------------
// CURRENT TIME
// ------------------------------------------------------------

const time=

frame/fps;




const progress=

clamp(

time/

short.duration,

0,

1

);




// ------------------------------------------------------------
// CURRENT CAPTION
// ------------------------------------------------------------

const activeCaption=

captions.find(

c=>

time>=c.start &&

time<=c.end

);




// ------------------------------------------------------------
// CURRENT ZOOM
// ------------------------------------------------------------

const zoom=

sentenceZoom(

time,

captions.indexOf(

activeCaption as any

)

);

const zoom=
sentenceZoom(
time,
captions.indexOf(
activeCaption as any
)
);


// ------------------------------------------------------------
// CAMERA MOVEMENT
// ------------------------------------------------------------

const cameraScale = interpolate(
  time,
  [
    0,
    short.duration * 0.35,
    short.duration * 0.7,
    short.duration
  ],
  [
    1,
    zoom,
    zoom + 0.02,
    1.02
  ],
  {
    extrapolateRight:"clamp",
    extrapolateLeft:"clamp"
  }
);



const cameraX = interpolate(
  Math.sin(time * 0.8),
  [-1,1],
  [-12,12]
);



const cameraY = interpolate(
  Math.cos(time * 0.6),
  [-1,1],
  [-8,8]
);




// ------------------------------------------------------------
// HOOK ANIMATION
// ------------------------------------------------------------

const hookProgress = spring({

  frame,

  fps,

  config:{
    damping:12,
    stiffness:120
  }

});



const hookOpacity = interpolate(

  frame,

  [
    0,
    fps * 0.4,
    fps * 3,
    fps * 3.5
  ],

  [
    0,
    1,
    1,
    0
  ],

  {
    extrapolateRight:"clamp"
  }

);



const hookY = interpolate(

hookProgress,

[0,1],

[-60,0]

);




// ------------------------------------------------------------
// CAPTION ANIMATION
// ------------------------------------------------------------


const captionOpacity = activeCaption

? interpolate(

frame,

[
activeCaption.start * fps,
activeCaption.start * fps + 8
],

[
0,
1
],

{
extrapolateRight:"clamp"
}

)

:0;



const captionScale = activeCaption

? spring({

frame:

frame -
(activeCaption.start * fps),

fps,

config:{
damping:10,
stiffness:160
}

})

:0;




// ------------------------------------------------------------
// PROGRESS BAR
// ------------------------------------------------------------


const progressWidth =
interpolate(

progress,

[0,1],

[0,100]

);




// ------------------------------------------------------------
// VIDEO SOURCE
// ------------------------------------------------------------


const videoStart =

short.start;



// ------------------------------------------------------------
// RENDER
// ------------------------------------------------------------


return (

<AbsoluteFill

style={{

background:"#000",

overflow:"hidden"

}}

>


{/* =========================================================
    VIDEO
========================================================= */}


<div

style={{

position:"absolute",

width:"100%",

height:"100%",

transform:

`
scale(${cameraScale})
translate(${cameraX}px,${cameraY}px)
`

}}

>


<Sequence
from={0}
durationInFrames={Math.ceil(short.duration * fps)}
>

<Video

src={staticFile("source.mov")}

style={{

width:"100%",

height:"100%",

objectFit:"cover",

}}

 />

</Sequence>

width:"100%",

height:"100%",

objectFit:"cover",

}}

/>


</div>


{/* =========================================================
    HOOK
========================================================= */}


<div

style={{

position:"absolute",

top:90,

left:40,

right:40,

opacity:hookOpacity,

transform:

`translateY(${hookY}px)`,

textAlign:"center",

zIndex:20,

fontFamily:fontFor(short.hook),

}}

>


<div

style={{

fontSize:46,

fontWeight:900,

letterSpacing:"0.05em",

textTransform:"uppercase",

color:WHITE,

textShadow:

`
0 4px 20px rgba(0,0,0,.8)
`

}}

>

{short.hook}

</div>


<div

style={{

width:220,

height:5,

margin:"22px auto",

background:

`
linear-gradient(
90deg,
${GOLD_DEEP},
${GOLD},
${ORANGE}
)
`,

borderRadius:10

}}

/>


</div>


{/* =========================================================
    DARK CINEMATIC GRADIENT
========================================================= */}


<div

style={{

position:"absolute",

inset:0,

background:

`
linear-gradient(
180deg,
rgba(0,0,0,.35),
transparent 35%,
rgba(0,0,0,.55)
)
`

}}

/>


// =========================================================
// CAPTION ENGINE
// =========================================================


const renderCaptionWords = () => {

if (!activeCaption) return null;


const words =
activeCaption.text.split(" ");



return (

<div

style={{

display:"flex",

flexWrap:"wrap",

justifyContent:"center",

gap:"12px",

fontFamily:
fontFor(activeCaption.text),

}}

>


{
words.map((word,index)=>{


const important =
isImportant(word);



const wordDelay =
index * 3;



const wordScale =
spring({

frame:
frame -
(activeCaption.start * fps) -
wordDelay,

fps,

config:{
damping:8,
stiffness:200
},

});


return (

<span

key={index}

style={{

display:"inline-block",

transform:

`
scale(
${Math.max(
0.85,
wordScale
)}
)
`,

color:

important

?

GOLD

:

WHITE,


fontSize:

important

?

76

:

68,


fontWeight:

900,


letterSpacing:"0.02em",


textTransform:"uppercase",


textShadow:

important

?

`
0 0 20px rgba(245,166,35,.8),
0 5px 20px rgba(0,0,0,.8)
`

:

`
0 5px 25px rgba(0,0,0,.9)
`

}}

>

{word}

</span>

)

})

}


</div>

)

};





// =========================================================
// CAPTION BOX POSITION
// =========================================================


const captionY = interpolate(

frame,

[

activeCaption

?

activeCaption.start * fps

:

0,


activeCaption

?

activeCaption.start * fps + 12

:

20

],

[

40,

0

],

{

extrapolateRight:"clamp"

}

);





// =========================================================
// BOTTOM CAPTIONS
// =========================================================


<div

style={{

position:"absolute",

left:35,

right:35,

bottom:260,


opacity:captionOpacity,


transform:

`
translateY(${captionY}px)
scale(${Math.max(
0.8,
captionScale
)})
`,


zIndex:30,


textAlign:"center",

}}

>


{renderCaptionWords()}


</div>





// =========================================================
// PROGRESS BAR
// =========================================================


<div

style={{

position:"absolute",

left:50,

right:50,

bottom:80,


height:10,


background:

"rgba(255,255,255,.25)",


borderRadius:20,


overflow:"hidden",


zIndex:30

}}

>


<div

style={{

height:"100%",


width:

`${progressWidth}%`,


background:

`
linear-gradient(
90deg,
${GOLD_DEEP},
${GOLD},
${ORANGE}
)
`,


borderRadius:20

}}

/>


</div>





// =========================================================
// SMALL BRAND MARK
// =========================================================


<div

style={{

position:"absolute",

top:40,

left:40,


fontSize:22,

fontWeight:800,


letterSpacing:"0.25em",


color:GOLD,


opacity:.9,


fontFamily:RU_FONT,


zIndex:30

}}

>

MICHAEL KVON

</div>





</AbsoluteFill>

);


};
// =========================================================
// END
// =========================================================


</AbsoluteFill>

);

};