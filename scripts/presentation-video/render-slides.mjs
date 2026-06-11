/**
 * Render slide PNGs from slides.html for video assembly.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const slidesHtml = path.join(root, "docs", "presentation", "video", "slides.html");
const outDir = path.join(root, "docs", "presentation", "video", "slides-rendered");
const script = JSON.parse(
  fs.readFileSync(path.join(root, "docs", "presentation", "video", "script.json"), "utf8")
);

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const fileUrl = `file:///${slidesHtml.replace(/\\/g, "/")}`;

  for (const slide of script.slides) {
    const url = `${fileUrl}?slide=${slide.id}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(600);
    await page.evaluate(() =>
      Promise.all(
        [...document.images].map((img) =>
          img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })
        )
      )
    );
    const out = path.join(outDir, `${slide.id}.png`);
    await page.screenshot({ path: out, animations: "disabled" });
    console.log(`  ✓ ${slide.id}.png`);
  }

  await browser.close();
  console.log("\nSlides →", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
