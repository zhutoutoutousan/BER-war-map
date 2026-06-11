import ffmpegStatic from "ffmpeg-static";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.join(__dirname, "..", "..");
export const videoDir = path.join(root, "docs", "presentation", "video");

export const FFMPEG = ffmpegStatic || "ffmpeg";
export const FFPROBE = FFMPEG.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1");

export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")}\n${r.stderr || r.stdout}`);
  }
  return r.stdout;
}

export function probeDuration(file) {
  try {
    const out = run(FFPROBE, [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      file
    ]);
    return parseFloat(JSON.parse(out).format.duration);
  } catch {
    // ffmpeg-static may not ship ffprobe — parse ffmpeg -i stderr
    const r = spawnSync(FFMPEG, ["-i", file], { encoding: "utf8" });
    const m = (r.stderr || "").match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    if (!m) return 3;
    return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3]);
  }
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** Fit + pad to exact frame; setsar=1 avoids squashed playback on mobile players */
export const PAD_LANDSCAPE =
  "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0f172a,setsar=1";
export const PAD_MOBILE =
  "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0f172a,setsar=1";
/** Demo clips — fill 9:16 frame (crop), no letterbox */
export const PAD_MOBILE_FILL =
  "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1";
export const PAD_NATIVE = "setsar=1";

/** Normalize LaTeX page PNG to 16:9 for consistent video framing */
export function normalizeSlidePng(src, dest) {
  run(FFMPEG, [
    "-y",
    "-i",
    src,
    "-vf",
    PAD_LANDSCAPE,
    "-frames:v",
    "1",
    dest
  ]);
}

/** Trilingual ASS — layout: landscape (1920×1080) | mobile (1080×1920, larger subs) */
function hasCjk(text) {
  return /[\u3000-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text);
}

/** Manual wrap — ASS does not auto-wrap long lines */
function wrapAssText(text, maxLatin, maxCjk) {
  const raw = String(text).trim();
  if (!raw) return "";
  if (hasCjk(raw)) {
    const max = maxCjk;
    const parts = raw.split(/(?<=[，。；：、！？])|(?<=\s)/).filter(Boolean);
    const lines = [];
    let cur = "";
    for (const part of parts) {
      const trial = cur + part;
      if (trial.length <= max || !cur) {
        cur = trial;
      } else {
        lines.push(cur.trim());
        cur = part;
      }
      while (cur.length > max) {
        lines.push(cur.slice(0, max));
        cur = cur.slice(max);
      }
    }
    if (cur.trim()) lines.push(cur.trim());
    if (!lines.length) {
      for (let i = 0; i < raw.length; i += max) lines.push(raw.slice(i, i + max));
    }
    return lines.map(escapeAss).join("\\N");
  }
  const words = raw.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const trial = cur ? `${cur} ${word}` : word;
    if (trial.length <= maxLatin) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = word.length > maxLatin ? word.slice(0, maxLatin) : word;
      while (cur.length > maxLatin) {
        lines.push(cur.slice(0, maxLatin));
        cur = cur.slice(maxLatin);
      }
    }
  }
  if (cur) lines.push(cur);
  return lines.map(escapeAss).join("\\N");
}

export function writeAss(segments, outPath, layout = "landscape") {
  const mobile = layout === "mobile";
  const resX = mobile ? 1080 : 1920;
  const resY = mobile ? 1920 : 1080;
  const fsMain = mobile ? 40 : 36;
  const fsZh = mobile ? 36 : 32;
  const fsEn = mobile ? 32 : 30;
  const fsDe = mobile ? 30 : 28;
  const marginV = mobile ? 48 : 72;
  const marginH = mobile ? 56 : 48;
  const maxCjk = mobile ? 20 : 34;
  const maxLatin = mobile ? 32 : 52;

  const header = `[Script Info]
Title: BER+ June 12
ScriptType: v4.00+
PlayResX: ${resX}
PlayResY: ${resY}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Segoe UI,${fsMain},&H00F8FAFC,&H000000FF,&H00101820,&HC0000000,0,0,0,0,100,100,0,0,3,3,0,2,${marginH},${marginH},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines = segments.map((s) => {
    const start = assTime(s.start);
    const end = assTime(s.end);
    const speaker = s.speaker === "qin" ? "Qin" : s.speaker === "yi" ? "Yi" : "Tian";
    const zh = wrapAssText(s.zh, maxLatin, maxCjk);
    const en = wrapAssText(s.en, maxLatin, maxCjk);
    const de = wrapAssText(s.de, maxLatin, maxCjk);
    const text = `{\\an2}${escapeAss(speaker)}\\N{\\fs${fsZh}}${zh}\\N{\\fs${fsEn}}${en}\\N{\\fs${fsDe}}${de}`;
    return `Dialogue: 0,${start},${end},Default,${speaker},0,0,0,,${text}`;
  });

  fs.writeFileSync(outPath, header + lines.join("\n"), "utf8");
}

function assTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const cs = Math.floor((s % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(Math.floor(s)).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function assDisplayText(text) {
  // ASS Dialogue lines use ASCII comma as field separator; fullwidth comma displays cleanly
  return String(text).replace(/,/g, "\uFF0C");
}

function escapeAss(t) {
  return assDisplayText(t)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\N")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}");
}

/** Stakeholder promo bed — calm C-major pad, not energetic EDM. Override: assets/bgm-promo.mp3 */
export function ensurePromoBgm(outPath, durationSec = 90) {
  if (fs.existsSync(outPath)) return outPath;
  ensureDir(path.dirname(outPath));
  const fadeOut = Math.max(4, durationSec - 5);
  run(FFMPEG, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=261.63:duration=${durationSec}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=329.63:duration=${durationSec}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=392:duration=${durationSec}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=130.81:duration=${durationSec}`,
    "-filter_complex",
    `[0:a]volume=0.035[a0];[1:a]volume=0.028[a1];[2:a]volume=0.022[a2];[3:a]volume=0.045[bass];
     [a0][a1][a2][bass]amix=inputs=4:duration=first,
     afade=t=in:st=0:d=2.5,afade=t=out:st=${fadeOut}:d=4,
     lowpass=f=1400,highpass=f=70,volume=1.2[aout]`,
    "-map",
    "[aout]",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "4",
    outPath
  ]);
  return outPath;
}

/** Promo copy overlays — headline + subline (+ optional tagline), no narrator subs */
export function writePromoCopyAss(beat, outPath) {
  const d = beat.durationSec;
  const header = `[Script Info]
Title: BER+ Promo
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Headline,Segoe UI,52,&H00F8FAFC,&H000000FF,&H00101820,&H90000000,1,0,0,0,100,100,0,0,1,3,1,2,80,80,0,1
Style: Subline,Segoe UI,30,&H00B8E0FF,&H000000FF,&H00101820,&H90000000,0,0,0,0,100,100,0,0,1,2,1,2,80,80,0,1
Style: Tagline,Segoe UI,22,&H0094A3B8,&H000000FF,&H00101820,&H80000000,0,0,0,0,100,100,0,0,1,1,0,2,80,80,0,1
Style: CameoLabel,Segoe UI,18,&H00FBBF24,&H000000FF,&H00101820,&H80000000,1,0,0,0,100,100,2,0,1,2,0,7,48,48,48,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = [];
  const end = assTime(d);
  if (beat.type === "cameo") {
    lines.push(
      `Dialogue: 0,0:00:00.00,${end},CameoLabel,,0,0,0,,FEATURE`
    );
  }
  lines.push(
    `Dialogue: 0,0:00:00.50,${end},Headline,,0,0,0,,${escapeAss(beat.headline)}`
  );
  if (beat.subline) {
    lines.push(
      `Dialogue: 0,0:00:01.20,${end},Subline,,0,0,0,,${escapeAss(beat.subline)}`
    );
  }
  if (beat.tagline) {
    lines.push(
      `Dialogue: 0,0:00:02.00,${end},Tagline,,0,0,0,,${escapeAss(beat.tagline)}`
    );
  }
  fs.writeFileSync(outPath, header + lines.join("\n"), "utf8");
}

/** Soft stakeholder-friendly ambient bed (rehearsal videos). */
export function ensureBgm(outPath, durationSec = 600) {
  if (fs.existsSync(outPath)) return outPath;
  ensureDir(path.dirname(outPath));
  run(FFMPEG, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `anoisesrc=color=pink:amplitude=0.012:duration=${durationSec}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=110:duration=${durationSec}`,
    "-filter_complex",
    "[0:a][1:a]amix=inputs=2:duration=first,volume=0.35,lowpass=f=800,afade=t=in:st=0:d=3,afade=t=out:st=" +
      (durationSec - 6) +
      ":d=6",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "6",
    outPath
  ]);
  return outPath;
}

export function webmToMp4(webm, mp4) {
  if (fs.existsSync(mp4)) return mp4;
  if (!fs.existsSync(webm)) return null;
  run(FFMPEG, ["-y", "-i", webm, "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-an", mp4]);
  return mp4;
}
