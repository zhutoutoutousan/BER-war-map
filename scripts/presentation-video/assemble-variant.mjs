/**
 * Assemble rehearsal MP4 — full / short / mobile layouts.
 *
 *   node assemble-variant.mjs full
 *   node assemble-variant.mjs short
 *   node assemble-variant.mjs mobile   # 9:16 short cut for phone rehearsal
 */
import fs from "node:fs";
import path from "node:path";
import {
  FFMPEG,
  PAD_LANDSCAPE,
  PAD_MOBILE,
  ensureBgm,
  ensureDir,
  probeDuration,
  run,
  videoDir,
  webmToMp4,
  writeAss
} from "./ffmpeg-utils.mjs";

const VARIANT = process.argv[2] ?? "full";

const CONFIG = {
  full: {
    scriptFile: "script.json",
    audioPrefix: "presentation/",
    subtitleKey: "subtitles",
    outFile: "ber-plus-june12-rehearsal.mp4",
    workDir: "full",
    layout: "landscape",
    bgmVolume: 0.12
  },
  short: {
    scriptFile: "script-short.json",
    audioPrefix: "short/",
    subtitleKey: "shortSubtitles",
    outFile: "ber-plus-june12-rehearsal-short.mp4",
    workDir: "short",
    layout: "landscape",
    bgmVolume: 0.1
  },
  mobile: {
    scriptFile: "script-short.json",
    audioPrefix: "short/",
    subtitleKey: "shortSubtitles",
    outFile: "ber-plus-june12-rehearsal-mobile.mp4",
    workDir: "mobile",
    layout: "mobile",
    bgmVolume: 0.1
  }
};

const cfg = CONFIG[VARIANT];
if (!cfg) {
  console.error("Usage: assemble-variant.mjs full|short|mobile");
  process.exit(1);
}

const script = JSON.parse(
  fs.readFileSync(path.join(videoDir, cfg.scriptFile), "utf8")
);
const manifestPath = path.join(videoDir, "audio", "manifest.json");
const slidesDir = path.join(videoDir, "slides-rendered");
const demosDir = path.join(videoDir, "demos");
const workDir = path.join(videoDir, "work", cfg.workDir);
const outDir = path.join(videoDir, "out");
const outFile = path.join(outDir, cfg.outFile);
const bgmPath = path.join(videoDir, "assets", "bgm-stakeholder.mp3");

const isMobile = cfg.layout === "mobile";
const OUT_W = isMobile ? 1080 : 1920;
const OUT_H = isMobile ? 1920 : 1080;
const scalePad = isMobile ? PAD_MOBILE : PAD_LANDSCAPE;

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Missing audio/manifest.json — run: npm run video:tts");
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function concatAudio(files, out) {
  const list = path.join(workDir, "audio-list.txt");
  fs.writeFileSync(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));
  run(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c:a", "aac", "-b:a", "192k", out]);
  return probeDuration(out);
}

function stillVideo(png, duration, out) {
  run(FFMPEG, [
    "-y",
    "-loop",
    "1",
    "-i",
    png,
    "-t",
    String(duration),
    "-vf",
    scalePad,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    isMobile ? 22 : 20,
    "-pix_fmt",
    "yuv420p",
    "-an",
    out
  ]);
}

function demoVideo(src, duration, out) {
  run(FFMPEG, [
    "-y",
    "-i",
    src,
    "-t",
    String(Math.max(duration, 2.5)),
    "-vf",
    scalePad,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    isMobile ? 22 : 20,
    "-pix_fmt",
    "yuv420p",
    "-an",
    out
  ]);
}

function muxAv(video, audio, ass, out) {
  const assEsc = ass.replace(/\\/g, "/").replace(/:/g, "\\:");
  run(FFMPEG, [
    "-y",
    "-i",
    video,
    "-i",
    audio,
    "-vf",
    `ass='${assEsc}',setsar=1`,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    isMobile ? 22 : 20,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    out
  ]);
}

async function main() {
  ensureDir(workDir);
  ensureDir(outDir);

  if (!fs.existsSync(slidesDir)) {
    throw new Error("Missing slides-rendered/ — run: npm run video:slides");
  }

  const meta = loadManifest();
  const subtitles = meta[cfg.subtitleKey] ?? meta.subtitles ?? [];
  ensureBgm(bgmPath, 600);

  console.log(`Assembling ${VARIANT} → ${cfg.outFile} (${cfg.layout})\n`);

  const slideSegments = [];
  let timeline = 0;

  for (const slide of script.slides) {
    const audioFiles = meta.manifest
      .filter((m) => m.slideId === slide.id && m.file.startsWith(cfg.audioPrefix))
      .sort((a, b) => a.file.localeCompare(b.file))
      .map((m) => path.join(videoDir, "audio", m.file));

    if (!audioFiles.length) {
      console.warn(`  skip ${slide.id} (no audio)`);
      continue;
    }

    const slideAudio = path.join(workDir, `${slide.id}-audio.m4a`);
    const audioDur = concatAudio(audioFiles, slideAudio);
    const hold = slide.holdSec ?? 0.4;
    const segDur = audioDur + hold;

    const slideSubs = subtitles.filter((s) => s.slideId === slide.id);
    const slideVideo = path.join(workDir, `${slide.id}-video.mp4`);
    const segOut = path.join(workDir, `${slide.id}-seg.mp4`);

    const slideAssSegs = [];
    let t = 0;
    for (let i = 0; i < slideSubs.length && i < audioFiles.length; i++) {
      const d = probeDuration(audioFiles[i]);
      slideAssSegs.push({ ...slideSubs[i], start: t, end: t + d });
      t += d;
    }

    const assFile = path.join(workDir, `${slide.id}.ass`);
    writeAss(slideAssSegs, assFile, isMobile ? "mobile" : "landscape");

    let demoSrc = null;
    if (slide.demo) {
      const webm = path.join(demosDir, slide.demo);
      const mp4 = path.join(demosDir, slide.demo.replace(".webm", ".mp4"));
      demoSrc = webmToMp4(webm, mp4) || (fs.existsSync(webm) ? webm : null);
    }

    if (demoSrc) {
      demoVideo(demoSrc, segDur, slideVideo);
    } else {
      const png = path.join(slidesDir, `${slide.id}.png`);
      if (!fs.existsSync(png)) throw new Error(`Missing slide PNG: ${png}`);
      stillVideo(png, segDur, slideVideo);
    }

    muxAv(slideVideo, slideAudio, assFile, segOut);
    slideSegments.push(segOut);
    timeline += segDur;
    console.log(`  ✓ ${slide.id} (${segDur.toFixed(1)}s)`);
  }

  const concatList = path.join(workDir, "segments.txt");
  fs.writeFileSync(concatList, slideSegments.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));
  const merged = path.join(workDir, "merged.mp4");
  run(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", merged]);

  run(FFMPEG, [
    "-y",
    "-i",
    merged,
    "-stream_loop",
    "-1",
    "-i",
    bgmPath,
    "-filter_complex",
    `[1:a]volume=${cfg.bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    outFile
  ]);

  console.log(`\n✓ ${outFile}`);
  console.log(`  ~${timeline.toFixed(0)}s · ${OUT_W}×${OUT_H}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
