"""
ai_engine.py
Michael Kvon — AI Video Pipeline Engine
Handles: video discovery, audio extraction, Whisper transcription, cuts.json generation
"""

# ═══════════════════════════════════════════════════════════════════
# IMPORTS
# ═══════════════════════════════════════════════════════════════════

import os
import json
import logging
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

CONFIG = {
    # Google Drive paths
    "drive_input":  "/content/drive/MyDrive/Video_Input",
    "drive_temp":   "/content/drive/MyDrive/Video_Temp",
    "drive_output": "/content/drive/MyDrive/Video_Output",

    # Local project path
    "project":      "/content/my-video",
    "src":          "/content/my-video/src",

    # Whisper settings
    "whisper_model":   "medium",
    "whisper_language": "ru",

    # Audio settings
    "audio_sample_rate": 16000,
    "audio_channels":    1,       # mono

    # Subtitle settings
    "max_chars_ru": 65,
    "max_chars_ko": 35,

    # cuts.json settings
    "min_segment_duration": 0.5,  # seconds
}

# ═══════════════════════════════════════════════════════════════════
# LOGGER
# ═══════════════════════════════════════════════════════════════════

def setup_logger(name: str = "ai_engine") -> logging.Logger:
    """Set up a clean logger with timestamp prefix."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s  %(levelname)s  %(message)s",
            datefmt="%H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger

log = setup_logger()

# ═══════════════════════════════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════════════════════════════

def ensure_dirs() -> None:
    """Create all required directories if they don't exist."""
    for key in ["drive_input", "drive_temp", "drive_output", "src"]:
        path = CONFIG[key]
        Path(path).mkdir(parents=True, exist_ok=True)
        log.info(f"Directory ready: {path}")


def save_json(data: dict | list, path: str) -> None:
    """Save data as formatted JSON file."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    log.info(f"Saved JSON: {path}")


def load_json(path: str) -> dict | list:
    """Load JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def copy_to_src(filename: str) -> None:
    """Copy a file from Video_Temp into the Remotion src/ folder."""
    src_path  = os.path.join(CONFIG["drive_temp"], filename)
    dest_path = os.path.join(CONFIG["src"], filename)

    if not os.path.exists(src_path):
        raise FileNotFoundError(f"File not found in Video_Temp: {src_path}")

    import shutil
    shutil.copy2(src_path, dest_path)
    log.info(f"Copied to src/: {filename}")


# ═══════════════════════════════════════════════════════════════════
# VIDEO DISCOVERY
# ═══════════════════════════════════════════════════════════════════

VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}

def find_newest_video(folder: Optional[str] = None) -> str:
    """
    Find the most recently modified video file in the input folder.
    Returns the full path to the video file.
    """
    folder = folder or CONFIG["drive_input"]
    folder_path = Path(folder)

    if not folder_path.exists():
        raise FileNotFoundError(f"Input folder not found: {folder}")

    videos = [
        f for f in folder_path.iterdir()
        if f.is_file() and f.suffix.lower() in VIDEO_EXTENSIONS
    ]

    if not videos:
        raise FileNotFoundError(f"No video files found in: {folder}")

    newest = max(videos, key=lambda f: f.stat().st_mtime)
    log.info(f"Found newest video: {newest.name}")
    return str(newest)


# ═══════════════════════════════════════════════════════════════════
# AUDIO EXTRACTION
# ═══════════════════════════════════════════════════════════════════

def extract_audio(video_path: str, output_path: Optional[str] = None) -> str:
    """
    Extract audio from video file using ffmpeg.
    Output: mono 16kHz WAV — optimal for Whisper.
    Returns path to the extracted audio file.
    """
    if output_path is None:
        output_path = os.path.join(CONFIG["drive_temp"], "audio.wav")

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",                                          # no video
        "-acodec", "pcm_s16le",                        # 16-bit PCM
        "-ar", str(CONFIG["audio_sample_rate"]),       # 16kHz
        "-ac", str(CONFIG["audio_channels"]),          # mono
        output_path
    ]

    log.info(f"Extracting audio from: {os.path.basename(video_path)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed:\n{result.stderr}")

    log.info(f"Audio extracted: {output_path}")
    return output_path


# ═══════════════════════════════════════════════════════════════════
# WHISPER
# ═══════════════════════════════════════════════════════════════════

def load_whisper_model(model_size: Optional[str] = None):
    """
    Load Whisper model with GPU if available, else CPU.
    Automatically uses FP16 on GPU for speed.
    """
    import torch
    import whisper

    model_size = model_size or CONFIG["whisper_model"]

    device = "cuda" if torch.cuda.is_available() else "cpu"
    fp16   = device == "cuda"

    log.info(f"Loading Whisper model: {model_size} on {device} (fp16={fp16})")
    model = whisper.load_model(model_size, device=device)
    log.info("Whisper model loaded")

    return model, fp16


def transcribe_audio(audio_path: str, model=None, fp16: bool = False) -> dict:
    """
    Transcribe audio using Whisper.
    Returns raw Whisper result dict with segments.
    """
    import whisper

    if model is None:
        model, fp16 = load_whisper_model()

    log.info(f"Transcribing: {os.path.basename(audio_path)}")

    result = model.transcribe(
        audio_path,
        language=CONFIG["whisper_language"],
        fp16=fp16,
        verbose=False,
    )

    log.info(f"Transcription done — {len(result['segments'])} segments")
    return result


# ═══════════════════════════════════════════════════════════════════
# CUTS.JSON GENERATION
# ═══════════════════════════════════════════════════════════════════

def clean_text(text: str) -> str:
    """Clean transcript text for subtitle use."""
    text = text.strip()
    # Remove repeated spaces
    while "  " in text:
        text = text.replace("  ", " ")
    # Capitalize first letter
    if text:
        text = text[0].upper() + text[1:]
    return text


def split_long_segment(text: str, start: float, end: float,
                        max_chars: int) -> list[dict]:
    """
    Split a long subtitle segment into multiple cues
    so each fits within max_chars.
    Splits at natural break points: . , — ; ?  !
    Preserves timing proportionally.
    """
    if len(text) <= max_chars:
        return [{
            "start":    round(start, 3),
            "end":      round(end, 3),
            "duration": round(end - start, 3),
            "text":     text,
        }]

    duration = end - start

    # Find best split point at or before max_chars
    split_chars = ".،,—;?!"
    split_index = max_chars

    # Search backwards from max_chars for a natural break
    for i in range(max_chars, max(0, max_chars - 30), -1):
        if i < len(text) and (text[i] in split_chars or text[i] == " "):
            split_index = i + 1
            break

    part1 = text[:split_index].strip()
    part2 = text[split_index:].strip()

    if not part2:
        return [{
            "start":    round(start, 3),
            "end":      round(end, 3),
            "duration": round(end - start, 3),
            "text":     text[:max_chars].strip(),
        }]

    # Split timing proportionally by character count
    ratio  = len(part1) / len(text)
    midpoint = start + duration * ratio

    cues = []
    cues.extend(split_long_segment(part1, start, midpoint, max_chars))
    cues.extend(split_long_segment(part2, midpoint, end, max_chars))
    return cues


def generate_cuts(whisper_result: dict,
                  output_path: Optional[str] = None) -> list[dict]:
    """
    Convert Whisper segments into cuts.json format.
    - Cleans text
    - Splits long segments to fit subtitle boxes
    - Filters out very short segments
    - Saves to Video_Temp and copies to src/
    """
    output_path = output_path or os.path.join(
        CONFIG["drive_temp"], "cuts.json"
    )

    max_chars = CONFIG["max_chars_ru"]
    min_dur   = CONFIG["min_segment_duration"]

    cuts = []
    for seg in whisper_result["segments"]:
        text  = clean_text(seg["text"])
        start = seg["start"]
        end   = seg["end"]
        dur   = end - start

        if dur < min_dur or not text:
            continue

        # Split if too long for subtitle box
        cues = split_long_segment(text, start, end, max_chars)
        cuts.extend(cues)

    # Re-index and ensure no overlaps
    for i, cut in enumerate(cuts):
        if i > 0 and cut["start"] < cuts[i-1]["end"]:
            cut["start"] = cuts[i-1]["end"]
        cut["duration"] = round(cut["end"] - cut["start"], 3)

    log.info(f"Generated {len(cuts)} subtitle cues")

    save_json(cuts, output_path)

    # Also copy to src/
    import shutil
    shutil.copy2(output_path, os.path.join(CONFIG["src"], "cuts.json"))
    log.info("cuts.json copied to src/")

    return cuts


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def run_pipeline(video_path: Optional[str] = None) -> dict:
    """
    Run the full AI pipeline:
    1. Find video
    2. Extract audio
    3. Transcribe
    4. Generate cuts.json

    Returns paths to all generated files.
    """
    ensure_dirs()

    # Step 1 — find video
    video = video_path or find_newest_video()
    log.info(f"Processing: {video}")

    # Step 2 — extract audio
    audio = extract_audio(video)

    # Step 3 — transcribe
    model, fp16 = load_whisper_model()
    result = transcribe_audio(audio, model=model, fp16=fp16)

    # Step 4 — generate cuts.json
    cuts_path = os.path.join(CONFIG["drive_temp"], "cuts.json")
    cuts = generate_cuts(result, output_path=cuts_path)

    output = {
        "video":     video,
        "audio":     audio,
        "cuts":      cuts_path,
        "cuts_count": len(cuts),
    }

    log.info("Pipeline complete")
    log.info(json.dumps(output, indent=2))
    return output


if __name__ == "__main__":
    run_pipeline()