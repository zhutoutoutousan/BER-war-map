/**
 * Stakeholder promo — calm music + feature cameos + copy overlays (no narrator).
 */
import fs from "node:fs";
import path from "node:path";
import {
  FFMPEG,
  PAD_LANDSCAPE,
  ensureDir,
  ensurePromoBgm,
  run,
  videoDir,
  webmToMp4,
  writePromoCopyAss
} from "./ffmpeg-utils.mjs";

const script = JSON.parse(fs.readFileSync(path.join(videoDir, "script.json"), "utf8"));
const slidesDir = path.join(videoDir, "slides-rendered");
const demosDir = path.join(videoDir, "demos");
const workDir = path.join(videoDir, "work", "promo");
const outFile = path.join(videoDir, "out", "ber-plus-promo.mp4");
const bgmPath = path.join(videoDir, "assets", "bgm-promo.mp3");

const PAD = PAD_LANDSCAPE;

function resolveVisual(beat) {
  if (beat.demo) {
    const webm = path.join(demosDir, beat.demo);
    const mp4 = path.join(demosDir, beat.demo.replace(".webm", ".mp4"));
    const src = webmToMp4(webm, mp4) || (fs.existsSync(webm) ? webm : null);
    if (src) return { src, isImage: false };
  }
  if (beat.slide) {
    const png = path.join(slidesDir, `${beat.slide}.png`);
    if (fs.existsSync(png)) return { src: png, isImage: true };
  }
  const fallback = path.join(slidesDir, "title.png");
  return { src: fallback, isImage: true };
}

function buildBeat(beat, out) {
  const { src, isImage } = resolveVisual(beat);
  const assFile = path.join(workDir, `${beat.id}.ass`);
  writePromoCopyAss(beat, assFile);
  const assEsc = assFile.replace(/\\/g, "/").replace(/:/g, "\\:");

  const input = isImage ? ["-loop", "1", "-i", src] : ["-i", src];
  run(FFMPEG, [
    "-y",
    ...input,
    "-t",
    String(beat.durationSec),
    "-vf",
    `${PAD},ass='${assEsc}',setsar=1`,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "19",
    "-pix_fmt",
    "yuv420p",
    "-an",
    out
  ]);
}

function main() {
  ensureDir(workDir);
  ensureDir(path.join(videoDir, "out"));

  if (!fs.existsSync(slidesDir)) {
    throw new Error("Missing slides-rendered/ — run: npm run video:slides");
  }

  const beats = script.promo.beats;
  const totalDur = beats.reduce((s, b) => s + b.durationSec, 0);
  ensurePromoBgm(bgmPath, totalDur + 8);

  console.log("Promo: stakeholder music + feature cameos + copy (no voiceover)\n");

  const segments = [];
  for (const beat of beats) {
    const seg = path.join(workDir, `${beat.id}.mp4`);
    buildBeat(beat, seg);
    segments.push(seg);
    console.log(`  ✓ ${beat.id} — ${beat.headline}`);
  }

  const list = path.join(workDir, "beats.txt");
  fs.writeFileSync(list, segments.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));
  const silent = path.join(workDir, "silent.mp4");
  run(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent]);

  run(FFMPEG, [
    "-y",
    "-i",
    silent,
    "-i",
    bgmPath,
    "-filter_complex",
    `[1:a]afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(1, totalDur - 3)}:d=3,volume=0.55[music]`,
    "-map",
    "0:v",
    "-map",
    "[music]",
    "-vf",
    "setsar=1",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "19",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    outFile
  ]);

  console.log(`\n→ ${outFile} (${totalDur}s)`);
  console.log("  Music: assets/bgm-promo.mp3 (drop in your own track to replace)");
}

main();
