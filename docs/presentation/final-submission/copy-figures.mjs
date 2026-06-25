#!/usr/bin/env node
/** Copy presentation figures for final-submission PDF (curated map shots + Playwright welcome). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const dest = path.join(__dirname, "figures");
const curated = path.join(root, "docs/presentation/figures");
const e2e = path.join(root, "e2e/screenshots");

const curatedMap = [
  ["fig01-war-room-overview.png", "fig-war-room-overview.png"],
  ["fig04-osm-intel.png", "fig-osm-intel.png"],
  ["fig03-mitglieder-matching.png", "fig-mitglieder.png"],
  ["fig07-giant-matching-map.png", "fig-matching-map.png"]
];

const e2eMap = [["_shared/00-session-picker.png", "fig-session-picker.png"]]; // desktop only (1440×900)

fs.mkdirSync(dest, { recursive: true });
let copied = 0;

for (const [from, to] of curatedMap) {
  const srcPath = path.join(curated, from);
  const destPath = path.join(dest, to);
  if (!fs.existsSync(srcPath)) {
    console.warn(`skip curated (missing): ${from}`);
    continue;
  }
  fs.copyFileSync(srcPath, destPath);
  copied++;
}

for (const [from, to] of e2eMap) {
  const srcPath = path.join(e2e, from);
  const destPath = path.join(dest, to);
  if (!fs.existsSync(srcPath)) {
    console.warn(`skip e2e (missing): ${from}`);
    continue;
  }
  fs.copyFileSync(srcPath, destPath);
  copied++;
}

console.log(`Copied ${copied} figures → ${dest}`);
