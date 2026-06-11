#!/usr/bin/env node
/**
 * Full pipeline: demos → LaTeX slides → TTS → desktop + mobile rehearsal + promo.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");

function step(label, cmd, args) {
  console.log(`\n══ ${label} ══\n`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const only = process.env.VIDEO_ONLY ?? "";

if (!only || only.includes("demos")) {
  step("Feature demos (Playwright)", "node", ["scripts/presentation-video/record-demos.mjs"]);
}
if (!only || only.includes("slides")) {
  step("Slides from LaTeX PDF", "node", ["scripts/presentation-video/render-slides-from-latex.mjs"]);
}
if (!only || only.includes("tts")) {
  step("TTS narration (edge-tts)", "python", ["scripts/presentation-video/synthesize-tts.py"]);
}
if (!only || only.includes("script")) {
  step("Stage script handout", "node", ["scripts/presentation-video/export-stage-script.mjs"]);
}
if (!only || only.includes("rehearsal")) {
  step("Desktop rehearsal (16:9)", "node", ["scripts/presentation-video/assemble-rehearsal.mjs"]);
  step("Mobile rehearsal (9:16, same script)", "node", ["scripts/presentation-video/assemble-rehearsal-mobile.mjs"]);
}
if (!only || only.includes("promo")) {
  step("Promo MP4", "node", ["scripts/presentation-video/assemble-promo.mjs"]);
}

console.log("\nDone → docs/presentation/video/out/");
