#!/usr/bin/env node
/** Camera-ready DE PDF für Thomas Graf — nutzt vorhandene Screenshots */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportDir = path.join(__dirname, "report");
const tex = "graf-beschaeftigung-thomas-graf-de.tex";
const pdf = "graf-beschaeftigung-thomas-graf-de.pdf";
const figures = path.join(reportDir, "figures");

function run(cmd, args, cwd) {
  console.log(`→ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const required = ["fig-app-hero.png", "fig-app-map.png", "fig-app-pilot.png"];
const missing = required.filter((f) => !fs.existsSync(path.join(figures, f)));
if (missing.length) {
  console.log("Screenshots fehlen — Playwright zuerst:");
  run("node", ["capture-screenshots.mjs"], __dirname);
}

console.log("\npdflatex (2×) …");
run("pdflatex", ["-interaction=nonstopmode", tex], reportDir);
run("pdflatex", ["-interaction=nonstopmode", tex], reportDir);

console.log("\nFertig →", path.join(reportDir, pdf));
