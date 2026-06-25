#!/usr/bin/env node
/** Copy Graf briefing JSON into public/ for Board Room page */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "demos/graf-beschaeftigung-briefing/data");
const dest = path.join(root, "public/data/graf");

const files = ["employee-crossref.json", "employee-predictions.json", "sources.json"];

fs.mkdirSync(dest, { recursive: true });
for (const f of files) {
  fs.copyFileSync(path.join(src, f), path.join(dest, f));
}
console.log(`Synced ${files.length} files → public/data/graf/`);
