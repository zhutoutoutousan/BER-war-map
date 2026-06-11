/**
 * Record feature demo clips with Playwright (WebM → MP4 in assemble step).
 * Prerequisite: dev server OR use production URL.
 *
 *   BER_DEMO_URL=https://ber-war-map.vercel.app npm run video:demos
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const outDir = path.join(root, "docs", "presentation", "video", "demos");
const BASE = process.env.BER_DEMO_URL ?? process.env.BER_WAR_MAP_DEMO ?? "https://ber-war-map.vercel.app";

async function waitForServer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return res.status > 0 && res.status < 600;
  } catch {
    return false;
  }
}

async function dismissGuest(page) {
  const guest = page.getByTestId("session-guest");
  if (await guest.isVisible({ timeout: 4000 }).catch(() => false)) {
    await guest.click();
    await page.waitForTimeout(500);
  }
}

const DEMOS = [
  {
    file: "demo-war-room.webm",
    run: async (page) => {
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 180000 });
      await dismissGuest(page);
      await page.waitForFunction(() => window.__berMap?.flyTo, { timeout: 120000 }).catch(() => {});
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        window.__berMap?.flyTo?.({
          center: [13.52, 52.368],
          zoom: 11.2,
          pitch: 48,
          bearing: -25,
          duration: 4000,
          essential: true
        });
      });
      await page.waitForTimeout(4500);
    }
  },
  {
    file: "demo-osm-intel.webm",
    run: async (page) => {
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 180000 });
      await dismissGuest(page);
      await page.getByTestId("map-tab-junqingchu").click();
      await page.waitForTimeout(800);
      await page.getByTestId("osm-tab-infra").click();
      await page.waitForFunction(() => window.__berMap?.flyTo, { timeout: 120000 }).catch(() => {});
      await page.evaluate(() => {
        window.__berMap?.flyTo?.({
          center: [13.56, 52.385],
          zoom: 12.5,
          pitch: 42,
          duration: 3500,
          essential: true
        });
      });
      await page.waitForTimeout(5000);
    }
  },
  {
    file: "demo-matching-focus.webm",
    run: async (page) => {
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 180000 });
      await dismissGuest(page);
      await page.getByTestId("view-mode-matching").click();
      await page.waitForSelector('[data-testid="giant-matching-map"]', { timeout: 60000 });
      await page.locator('[data-testid="giant-matching-map"] button').filter({ hasText: "Taurecon" }).first().click();
      await page.waitForSelector('[data-testid="matching-graph-canvas"]', { timeout: 180000 });
      await page.waitForFunction(
        () => !document.body.textContent?.includes("Building matching graph"),
        { timeout: 180000 }
      );
      await page.waitForTimeout(8000);
    }
  },
  {
    file: "demo-match-review.webm",
    run: async (page) => {
      await page.goto(`${BASE}/?tab=members&member=gsg`, { waitUntil: "domcontentloaded", timeout: 180000 });
      await dismissGuest(page);
      await page.getByTestId("view-mode-matching").click();
      await page.waitForSelector('[data-testid="giant-matching-map"]', { timeout: 60000 });
      await page.locator('[data-testid="giant-matching-map"] button').filter({ hasText: "GSG" }).first().click();
      await page.waitForSelector('[data-testid="matching-graph-canvas"]', { timeout: 180000 });
      await page.waitForTimeout(12000);
      const canvas = page.locator('[data-testid="matching-graph-canvas"]');
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width * 0.68, box.y + box.height * 0.45);
      }
      await page.waitForSelector('[data-testid="matching-node-map-popup"]', { timeout: 60000 });
      await page.waitForTimeout(4000);
    }
  }
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`Recording demos → ${BASE}\n`);

  if (!(await waitForServer(BASE))) {
    console.error(`Cannot reach ${BASE}`);
    process.exit(1);
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });

  for (const demo of DEMOS) {
    console.log(`→ ${demo.file}`);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: outDir, size: { width: 1920, height: 1080 } }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    try {
      await demo.run(page);
    } catch (e) {
      console.error("  ✗", e instanceof Error ? e.message : e);
    }
    const video = page.video();
    await context.close();
    if (video) {
      const tmp = await video.path();
      const dest = path.join(outDir, demo.file);
      fs.copyFileSync(tmp, dest);
      console.log(`  ✓ ${demo.file}`);
    }
  }

  await browser.close();
  console.log("\nSaved to", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
