#!/bin/bash

set -e


# ==========================================
# RENDER SHORTS ENGINE
# ==========================================


PROJECT="$(pwd)"

QUEUE="$PROJECT/src/shorts_render_queue.json"

OUTPUT="$PROJECT/shorts_output"



echo ""
echo "======================================"
echo "🔥 SHORTS RENDER ENGINE"
echo "======================================"
echo ""



# ------------------------------------------
# Enter project
# ------------------------------------------

cd "$PROJECT"



# ------------------------------------------
# Check queue
# ------------------------------------------

if [ ! -f "$QUEUE" ]; then

echo "❌ shorts_render_queue.json missing"

exit 1

fi



mkdir -p "$OUTPUT"



echo "📋 Loading shorts queue..."




COUNT=$(node -e "

const q=require('./src/shorts_render_queue.json');

console.log(q.length);

")



echo "🎬 Found $COUNT shorts"

echo ""





# ------------------------------------------
# Render loop
# ------------------------------------------


for ((i=0;i<$COUNT;i++))

do


echo ""
echo "======================================"
echo "Rendering SHORT $((i+1)) / $COUNT"
echo "======================================"



TITLE=$(node -e "

const q=require('./src/shorts_render_queue.json');

let t=q[$i].title;

console.log(

t

.replace(/[^a-zA-Z0-9 ]/g,'')

.replace(/ /g,'_')

.substring(0,50)

);

")



SHORT_ID=$(node -e "

const q=require('./src/shorts_render_queue.json');

console.log(q[$i].id);

")



OUTPUT_FILE="$OUTPUT/$((i+1))_${TITLE}.mp4"



echo ""
echo "Title:"
echo "$TITLE"

echo ""
echo "Output:"
echo "$OUTPUT_FILE"

echo ""





node node_modules/@remotion/cli/remotion-cli.js render \

ShortsProject \

"$OUTPUT_FILE" \

--props="{\"shortId\":$SHORT_ID}" \

--codec=h264 \

--crf=18 \

--concurrency=2



echo ""

echo "✅ Finished Short $((i+1))"



done





echo ""

echo "======================================"
echo "🎉 ALL SHORTS COMPLETE"
echo "======================================"

echo ""

echo "Saved to:"
echo "$OUTPUT"