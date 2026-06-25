#!/usr/bin/env node
/** Build Graf PDF: sync data → enrich → predict → Playwright → pdflatex */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

function run(cmd, args, cwd = root) {
  console.log(`→ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("0/5 Sync briefing data to public/");
run("node", ["scripts/sync-graf-briefing-data.mjs"]);

console.log("\n1/5 Cross-reference + predict");
run("node", ["enrich-employees.mjs"], __dirname);
run("node", ["predict-employees.mjs"], __dirname);
run("node", ["scripts/sync-graf-briefing-data.mjs"]);

console.log("\n2/5 Playwright screenshots (Board Room /beschaeftigung)");
run("node", ["capture-screenshots.mjs"], __dirname);

console.log("\n3/5 pdflatex");
const reportDir = path.join(__dirname, "report");
run("pdflatex", ["-interaction=nonstopmode", "graf-beschaeftigung-report.tex"], reportDir);
run("pdflatex", ["-interaction=nonstopmode", "graf-beschaeftigung-report.tex"], reportDir);

console.log("\nDone →", path.join(reportDir, "graf-beschaeftigung-report.pdf"));
