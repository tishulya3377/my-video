#!/bin/bash

REPO="https://github.com/tishulya3377/my-video.git"
PROJECT="/content/my-video"
VIDEO_TEMP="/content/drive/MyDrive/Video_Temp"

echo "=============================="
echo "🔧 SETUP"
echo "=============================="

# Pull latest TSX files from GitHub
if [ ! -d "$PROJECT/.git" ]; then
  echo "📦 Cloning from GitHub..."
  git clone "$REPO" "$PROJECT"
else
  echo "🔁 Pulling latest from GitHub..."
  cd "$PROJECT" && git pull
fi

cd "$PROJECT"

# Install node_modules
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Ensure browser
echo "🌐 Ensuring browser..."
npx remotion browser ensure

# Link data files from Drive into src/
echo "🔗 Linking data files from Video_Temp..."
mkdir -p "$PROJECT/public"

for FILE in cuts.json editing_plan.json shorts.json; do
  SRC="$VIDEO_TEMP/$FILE"
  DEST="$PROJECT/src/$FILE"
  if [ -f "$SRC" ]; then
    cp "$SRC" "$DEST"
    echo "  ✅ $FILE"
  else
    echo "  ⚠️  $FILE not found in Video_Temp (will be generated)"
  fi
done

for FILE in subtitles_russian.srt subtitles_korean.srt; do
  SRC="$VIDEO_TEMP/$FILE"
  DEST="$PROJECT/public/$FILE"
  if [ -f "$SRC" ]; then
    cp "$SRC" "$DEST"
    echo "  ✅ $FILE"
  else
    echo "  ⚠️  $FILE not found in Video_Temp (will be generated)"
  fi
done

echo "✅ Setup complete"
