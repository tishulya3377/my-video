#!/bin/bash

echo "=============================="
echo "🎬 REMOTION OVERLAY RENDER"
echo "=============================="

PROJECT="/content/drive/MyDrive/my-video"
VIDEO_TEMP="/content/drive/MyDrive/Video_Temp"
VIDEO_OUTPUT="/content/drive/MyDrive/Video_Output"

CHUNK=3000

mkdir -p "$VIDEO_OUTPUT"

cd "$PROJECT" || exit 1


echo "🔗 Copying overlay files..."


# --------------------------
# Copy editing plan
# --------------------------

if [ -f "$VIDEO_TEMP/editing_plan.json" ]; then
    cp "$VIDEO_TEMP/editing_plan.json" "$PROJECT/src/editing_plan.json"
    echo "✅ editing_plan.json"
else
    echo "❌ editing_plan.json missing"
    exit 1
fi


# --------------------------
# Copy subtitles
# --------------------------

mkdir -p "$PROJECT/public"


for FILE in subtitles_russian.srt subtitles_korean.srt
do
    if [ -f "$VIDEO_TEMP/$FILE" ]; then
        cp "$VIDEO_TEMP/$FILE" "$PROJECT/public/$FILE"
        echo "✅ $FILE"
    else
        echo "⚠️ $FILE missing"
    fi
done


echo ""
echo "📐 Reading compositions..."

npx remotion compositions src/index.tsx


echo ""
echo "🎴 Rendering overlay..."


OVERLAY_FILE="$VIDEO_OUTPUT/cards_overlay.mp4"


npx remotion render src/index.tsx AutoCutProject \
"$OVERLAY_FILE" \
--codec=h264 \
--pixel-format=yuv420p \
--concurrency=2


if [ $? -ne 0 ]; then
    echo "❌ Overlay render failed"
    exit 1
fi


echo "✅ Overlay finished"


echo ""
echo "💬 Rendering subtitles overlay..."


SUB_FILE="$VIDEO_OUTPUT/subtitles_overlay.mp4"


npx remotion render src/index.tsx SubtitlesProject \
"$SUB_FILE" \
--codec=h264 \
--pixel-format=yuv420p \
--concurrency=1


if [ $? -ne 0 ]; then
    echo "❌ Subtitle render failed"
    exit 1
fi


echo "✅ Subtitles finished"


echo ""
echo "=============================="
echo "🏁 DONE"
echo "=============================="

echo "$VIDEO_OUTPUT"
