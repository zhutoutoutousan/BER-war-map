/**
 * Render slides-rendered/*.png from june12-final.tex (PDF → PNG via pdflatex + pdftoppm).
 * Legacy fallback — prefer: npm run video:slides (Python / slides-content.json).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSlidePng } from "./ffmpeg-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const presDir = path.join(root, "docs", "presentation");
const texFile = path.join(presDir, "june12-final.tex");
const pdfFile = path.join(presDir, "june12-final.pdf");
const outDir = path.join(presDir, "video", "slides-rendered");
const tmpDir = path.join(presDir, "video", "work", "latex-pages");
const slideMap = JSON.parse(
  fs.readFileSync(path.join(presDir, "video", "slide-map.json"), "utf8")
);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed\n${r.stderr || r.stdout}`);
  }
  return r.stdout;
}

function findPdftoppm() {
  const r = spawnSync("where.exe", ["pdftoppm"], { encoding: "utf8", shell: true });
  if (r.status === 0 && r.stdout.trim()) {
    return r.stdout.trim().split(/\r?\n/)[0];
  }
  return "pdftoppm";
}

function compileLatex() {
  console.log("Compiling june12-final.tex …");
  for (let pass = 1; pass <= 2; pass++) {
    run("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", "june12-final.tex"], {
      cwd: presDir,
      stdio: "pipe"
    });
  }
  if (!fs.existsSync(pdfFile)) {
    throw new Error(`PDF not created: ${pdfFile}`);
  }
  console.log(`  PDF → ${pdfFile}`);
}

function exportPages() {
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const pdftoppm = findPdftoppm();
  const prefix = path.join(tmpDir, "page");

  console.log("Exporting PDF pages (1920px wide) …");
  run(pdftoppm, ["-png", "-scale-to-x", "1920", pdfFile, prefix]);

  const exported = fs
    .readdirSync(tmpDir)
    .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
    .sort();

  if (exported.length < slideMap.length) {
    throw new Error(`Expected ${slideMap.length} pages, got ${exported.length} PNGs`);
  }

  for (const { page, id } of slideMap) {
    const srcName = `page-${String(page).padStart(2, "0")}.png`;
    const src = path.join(tmpDir, srcName);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing ${srcName} for slide "${id}"`);
    }
    const dest = path.join(outDir, `${id}.png`);
    normalizeSlidePng(src, dest);
    console.log(`  ✓ ${id}.png  ← page ${page} (1920×1080)`);
  }
}

function main() {
  if (!fs.existsSync(texFile)) {
    throw new Error(`Missing ${texFile}`);
  }
  compileLatex();
  exportPages();
  console.log(`\nSlides (LaTeX) → ${outDir}`);
}

main();
