/**
 * Shared rehearsal assembler — same script.json + audio for all layouts.
 */
import fs from "node:fs";
import path from "node:path";
import {
  FFMPEG,
  PAD_LANDSCAPE,
  PAD_MOBILE_FILL,
  PAD_NATIVE,
  ensureBgm,
  ensureDir,
  probeDuration,
  run,
  videoDir,
  webmToMp4,
  writeAss
} from "./ffmpeg-utils.mjs";

const script = JSON.parse(fs.readFileSync(path.join(videoDir, "script.json"), "utf8"));
const manifestPath = path.join(videoDir, "audio", "manifest.json");
const slidesLandscapeDir = path.join(videoDir, "slides-rendered");
const slidesMobileDir = path.join(videoDir, "slides-rendered-mobile");
const demosDir = path.join(videoDir, "demos");
const bgmPath = path.join(videoDir, "assets", "bgm-stakeholder.mp3");

const LAYOUTS = {
  landscape: {
    outFile: "ber-plus-june12-rehearsal.mp4",
    workDir: "full",
    slidesDir: slidesLandscapeDir,
    slidePad: PAD_LANDSCAPE,
    demoPad: PAD_LANDSCAPE,
    assLayout: "landscape"
  },
  mobile: {
    outFile: "ber-plus-june12-rehearsal-mobile.mp4",
    workDir: "mobile",
    slidesDir: slidesMobileDir,
    slidePad: PAD_NATIVE,
    demoPad: PAD_MOBILE_FILL,
    assLayout: "mobile"
  }
};

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Missing audio/manifest.json — run: npm run video:tts");
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function concatAudio(files, out, workDir) {
  const list = path.join(workDir, "audio-list.txt");
  fs.writeFileSync(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));
  run(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c:a", "aac", "-b:a", "192k", out]);
  return probeDuration(out);
}

function visualVideo(src, isImage, duration, out, padFilter) {
  const input = isImage ? ["-loop", "1", "-i", src] : ["-i", src];
  run(FFMPEG, [
    "-y",
    ...input,
    "-t",
    String(Math.max(duration, 3)),
    "-vf",
    padFilter,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "20",
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
    "20",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    out
  ]);
}

export function assembleRehearsal(layoutKey = "landscape") {
  const layout = LAYOUTS[layoutKey];
  if (!layout) throw new Error(`Unknown layout: ${layoutKey}`);

  const workDir = path.join(videoDir, "work", layout.workDir);
  const outDir = path.join(videoDir, "out");
  const outFile = path.join(outDir, layout.outFile);

  ensureDir(workDir);
  ensureDir(outDir);

  if (!fs.existsSync(layout.slidesDir)) {
    throw new Error(`Missing ${path.basename(layout.slidesDir)}/ — run: npm run video:slides`);
  }

  const { manifest, subtitles } = loadManifest();
  ensureBgm(bgmPath, 900);

  console.log(`Layout: ${layoutKey} — identical stage script (script.json)\n`);

  const slideSegments = [];
  let timeline = 0;

  for (const slide of script.slides) {
    const audioFiles = manifest
      .filter((m) => m.slideId === slide.id && m.file.startsWith("presentation/"))
      .sort((a, b) => a.file.localeCompare(b.file))
      .map((m) => path.join(videoDir, "audio", m.file));

    if (!audioFiles.length) continue;

    const slideAudio = path.join(workDir, `${slide.id}-audio.m4a`);
    const audioDur = concatAudio(audioFiles, slideAudio, workDir);
    const hold = slide.holdSec ?? 0.5;
    const segDur = audioDur + hold;

    const slideSubs = subtitles.filter((s) => s.slideId === slide.id);
    const slideAssSegs = [];
    let t = 0;
    for (let i = 0; i < slideSubs.length && i < audioFiles.length; i++) {
      const d = probeDuration(audioFiles[i]);
      slideAssSegs.push({ ...slideSubs[i], start: t, end: t + d });
      t += d;
    }

    const assFile = path.join(workDir, `${slide.id}.ass`);
    writeAss(slideAssSegs, assFile, layout.assLayout);

    const slideVideo = path.join(workDir, `${slide.id}-video.mp4`);
    const segOut = path.join(workDir, `${slide.id}-seg.mp4`);

    let demoSrc = null;
    if (slide.demo) {
      const webm = path.join(demosDir, slide.demo);
      const mp4 = path.join(demosDir, slide.demo.replace(".webm", ".mp4"));
      demoSrc = webmToMp4(webm, mp4) || (fs.existsSync(webm) ? webm : null);
    }

    if (demoSrc) {
      visualVideo(demoSrc, false, segDur, slideVideo, layout.demoPad);
    } else {
      const png = path.join(layout.slidesDir, `${slide.id}.png`);
      if (!fs.existsSync(png)) throw new Error(`Missing slide PNG: ${png}`);
      visualVideo(png, true, segDur, slideVideo, layout.slidePad);
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
    "[1:a]volume=0.12[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]",
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

  console.log(`\n→ ${outFile}`);
  console.log(`  ~${Math.round(timeline)}s · same narration as desktop rehearsal`);
  return outFile;
}
