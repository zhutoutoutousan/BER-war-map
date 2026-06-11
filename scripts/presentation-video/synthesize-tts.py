#!/usr/bin/env python3
"""Synthesize narration MP3s from script.json using edge-tts (distinct voice per presenter)."""
from __future__ import annotations

import asyncio
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VIDEO = ROOT / "docs" / "presentation" / "video"
SCRIPT_PATH = VIDEO / "script.json"
AUDIO_DIR = VIDEO / "audio"
META_PATH = VIDEO / "audio" / "manifest.json"
FFPROBE = ROOT / "node_modules" / "ffmpeg-static" / "ffprobe.exe"


def ffprobe_duration(path: Path) -> float:
    probe = str(FFPROBE) if FFPROBE.exists() else "ffprobe"
    try:
        r = subprocess.run(
            [probe, "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if r.returncode == 0 and r.stdout.strip():
            return float(r.stdout.strip())
    except Exception:
        pass
    return max(1.5, len(path.read_bytes()) / 6000)  # rough fallback


async def synth_one(text: str, voice: str, out: Path) -> None:
    import edge_tts

    out.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out))


async def main() -> None:
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("Install: pip install edge-tts")
        sys.exit(1)

    data = json.loads(SCRIPT_PATH.read_text(encoding="utf-8"))
    presenters = data["meta"]["presenters"]
    manifest: list[dict] = []
    idx = 0

    async def add_segment(slide_id: str, seg_i: int, speaker: str, en: str, prefix: str) -> None:
        nonlocal idx
        voice = presenters[speaker]["voice"]
        rel = f"{prefix}/{slide_id}-{seg_i:02d}-{speaker}.mp3"
        out = AUDIO_DIR / rel
        await synth_one(en, voice, out)
        dur = max(1.5, len(en.split()) / 2.4)
        try:
            dur = ffprobe_duration(out)
        except Exception:
            pass
        manifest.append(
            {
                "id": f"{prefix}-{slide_id}-{seg_i:02d}",
                "slideId": slide_id,
                "speaker": speaker,
                "voice": voice,
                "file": rel.replace("\\", "/"),
                "durationSec": dur,
                "en": en,
            }
        )
        idx += 1
        print(f"  ok {rel} ({dur:.1f}s) [{speaker}]")

    print("Synthesizing presentation narration…")
    for slide in data["slides"]:
        for i, seg in enumerate(slide["segments"]):
            await add_segment(slide["id"], i, seg["speaker"], seg["en"], "presentation")

    print("Promo: music-only (no TTS) — skipped")

    # Build subtitle lookup from script
    subs: list[dict] = []
    for slide in data["slides"]:
        for i, seg in enumerate(slide["segments"]):
            subs.append(
                {
                    "slideId": slide["id"],
                    "index": i,
                    "speaker": seg["speaker"],
                    "zh": seg["zh"],
                    "en": seg["en"],
                    "de": seg["de"],
                }
            )

    promo_beats = data["promo"].get("beats", [])
    META_PATH.write_text(
        json.dumps({"manifest": manifest, "subtitles": subs, "promoBeats": promo_beats}, indent=2),
        encoding="utf-8",
    )
    print(f"\nSaved {len(manifest)} clips → {AUDIO_DIR}")
    print(f"Manifest → {META_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
