/**
 * Showcase screenshots — each figure maximizes the unique UI region.
 * Prerequisite: npm run dev  (http://localhost:3001)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.BER_WAR_MAP_PORT ?? process.env.PORT ?? 3001);
const BASE = `http://localhost:${PORT}`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs", "presentation", "figures");

async function isUp() {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(8000) });
    return res.status > 0 && res.status < 600;
  } catch {
    return false;
  }
}

async function waitForServer(ms = 120000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await isUp()) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

/** @param {import('playwright').Page} page */
async function setLayout(page, layout) {
  await page.evaluate((layout) => {
    if (layout) document.documentElement.dataset.captureLayout = layout;
    else delete document.documentElement.dataset.captureLayout;
  }, layout);
}

/** @param {import('playwright').Page} page */
async function flyMap(page, center, zoom, pitch = 48, bearing = -20) {
  try {
    await page.waitForFunction(() => window.__berMap?.flyTo, { timeout: 25000 });
    await page.evaluate(
      ({ center, zoom, pitch, bearing }) => {
        window.__berMap.flyTo({ center, zoom, pitch, bearing, duration: 0, essential: true });
      },
      { center, zoom, pitch, bearing }
    );
    await page.waitForTimeout(2500);
  } catch {
    console.warn("  (map flyTo skipped — panel capture still proceeds)");
  }
}

/** @param {import('playwright').Page} page */
async function dismissSessionPicker(page) {
  const explore = page.getByTestId("session-persona-explore");
  if (await explore.isVisible({ timeout: 3000 }).catch(() => false)) {
    await explore.click();
    await page.waitForTimeout(400);
  }
}

/** @param {import('playwright').Page} page */
async function waitScene(page, scene) {
  const full = scene.includes(":") && !scene.startsWith("geo:") && !scene.startsWith("matching:")
    ? scene
    : `geo:${scene}`;
  await page.waitForSelector(
    `[data-scene="${full}"], [data-scene="${scene}"], [data-scene="matching:${scene}"]`,
    { timeout: 120000 }
  );
  await page.waitForTimeout(600);
}

/** Full viewport */
/** @param {import('playwright').Page} page */
async function snapFull(page, file) {
  await page.screenshot({ path: path.join(outDir, file), animations: "disabled", timeout: 120000 });
}

/** Left panel + adjacent map (panel ~55% width) */
/** @param {import('playwright').Page} page */
async function snapLeftShowcase(page, file) {
  const panel = page.locator('[data-testid="showcase-panel-left"]');
  await panel.waitFor({ state: "visible" });
  const box = await panel.boundingBox();
  if (!box) throw new Error("left panel box missing");
  const pad = 12;
  await page.screenshot({
    path: path.join(outDir, file),
    animations: "disabled",
    timeout: 120000,
    clip: {
      x: 0,
      y: Math.max(0, box.y - pad),
      width: Math.min(1920, box.x + box.width + 420),
      height: Math.min(1080, 1080)
    }
  });
}

/** Map-only (full viewport after panels hidden) */
/** @param {import('playwright').Page} page */
async function snapMapShowcase(page, file) {
  await page.locator('[data-testid="showcase-map"]').waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, file), animations: "disabled", timeout: 120000 });
}

/** Right panel + map context */
/** @param {import('playwright').Page} page */
async function snapRightShowcase(page, file) {
  const panel = page.getByTestId("showcase-panel-right");
  await panel.waitFor({ state: "visible", timeout: 30000 });
  await page.getByTestId("panel-member-path").waitFor({ state: "visible", timeout: 15000 });
  const box = await panel.boundingBox();
  if (!box) throw new Error("right panel box missing");
  const pad = 12;
  await page.screenshot({
    path: path.join(outDir, file),
    animations: "disabled",
    timeout: 120000,
    clip: {
      x: Math.max(0, box.x - 520),
      y: Math.max(0, box.y - pad),
      width: 1920 - Math.max(0, box.x - 520),
      height: 1080
    }
  });
}

/** @param {import('playwright').Page} page */
async function shot01(page) {
  await setLayout(page, null);
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 180000 });
  await dismissSessionPicker(page);
  await waitScene(page, "value");
  await flyMap(page, [13.48, 52.355], 10.1);
}

/** @param {import('playwright').Page} page */
async function shot02(page) {
  await setLayout(page, "left-focus");
  await clickTab(page, "map-tab-value");
  await waitScene(page, "value");
  await page.locator('[data-testid="ber-paths-coordination"]').scrollIntoViewIfNeeded();
  await flyMap(page, [13.5, 52.36], 10.3, 45, 0);
}

/** @param {import('playwright').Page} page */
async function shot03(page) {
  await setLayout(page, "left-focus");
  await clickTab(page, "map-tab-members");
  await waitScene(page, "members");
  await page.waitForSelector('[data-testid="panel-members"]');
  await flyMap(page, [13.52, 52.368], 10.5, 50, -30);
}

/** @param {import('playwright').Page} page */
async function shot04(page) {
  await setLayout(page, null);
  await clickTab(page, "map-tab-junqingchu");
  await waitScene(page, "junqingchu");
  await page.getByTestId("osm-tab-infra").click();
  await flyMap(page, [13.56, 52.385], 12.8, 42, -10);
  await page.waitForTimeout(14000);
  await setLayout(page, "map-focus");
}

/** @param {import('playwright').Page} page */
async function shot05(page) {
  await setLayout(page, null);
  await page.goto(`${BASE}/?tab=members&member=buwog`, { waitUntil: "domcontentloaded", timeout: 180000 });
  await dismissSessionPicker(page);
  await waitScene(page, "members:buwog");
  const pathPanel = page.getByTestId("panel-member-path");
  await pathPanel.waitFor({ state: "visible", timeout: 60000 });
  await pathPanel.getByText(/Your path · BUWOG/i).waitFor({ timeout: 30000 });
  await flyMap(page, [13.582, 52.392], 13.0, 48, -15);
  await page.waitForTimeout(1500);
  await setLayout(page, "right-focus");
  await page.getByTestId("showcase-panel-right").waitFor({ state: "visible", timeout: 15000 });
}

/** @param {import('playwright').Page} page */
async function waitForMatchingGraph(page) {
  await page.waitForSelector('[data-testid="matching-graph-canvas"]', { timeout: 180000 });
  await page.waitForFunction(
    () => !document.body.textContent?.includes("Building matching graph"),
    { timeout: 180000 }
  );
  await page.waitForTimeout(10000);
}

/** @param {import('playwright').Page} page */
async function openMatchingFocus(page, memberShortName) {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 180000 });
  await dismissSessionPicker(page);
  await page.getByTestId("view-mode-matching").click();
  await page.waitForSelector('[data-testid="giant-matching-map"]', { timeout: 120000 });
  await page.locator('[data-testid="giant-matching-map"] button').filter({ hasText: memberShortName }).first().click();
  await page.waitForSelector(`[data-scene="matching:focus:${memberShortName.toLowerCase()}"]`, {
    timeout: 120000
  }).catch(() => {});
  await waitForMatchingGraph(page);
}

/** @param {import('playwright').Page} page */
async function shot06(page) {
  await openMatchingFocus(page, "GSG");
  const canvas = page.locator('[data-testid="matching-graph-canvas"]');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.72, box.y + box.height * 0.48);
  }
  await page.waitForSelector('[data-testid="matching-node-map-popup"]', { timeout: 60000 });
  await page.waitForTimeout(3000);
}

/** @param {import('playwright').Page} page */
async function shot07(page) {
  await openMatchingFocus(page, "Taurecon");
}

/** @param {import('playwright').Page} page */
async function shot08Mobile(page) {
  await setLayout(page, null);
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 180000 });
  await dismissSessionPicker(page);
  await waitScene(page, "value");
  await page.getByTestId("mobile-nav-explore").click();
  await page.waitForSelector('[data-testid="panel-ber-paths"]', { timeout: 60000 });
  await page.waitForTimeout(800);
}

/** @param {import('playwright').Page} page */
async function clickTab(page, testId) {
  await page.getByTestId(testId).click();
}

const shots = [
  { file: "fig01-war-room-overview.png", setup: shot01, snap: snapFull },
  { file: "fig02-coordination-paths.png", setup: shot02, snap: snapLeftShowcase },
  { file: "fig03-mitglieder-matching.png", setup: shot03, snap: snapLeftShowcase },
  { file: "fig04-osm-intel.png", setup: shot04, snap: snapMapShowcase },
  { file: "fig05-member-path.png", setup: shot05, snap: snapRightShowcase },
  { file: "fig06-matching-review-popup.png", setup: shot06, snap: snapFull },
  { file: "fig07-giant-matching-map.png", setup: shot07, snap: snapFull }
];

const mobileShots = [{ file: "fig08-mobile-war-room.png", setup: shot08Mobile, snap: snapFull }];

function filterShots(list, only) {
  if (!only) return list;
  const names = new Set(
    only.split(",").map((s) => String(parseInt(s.trim(), 10))).filter((n) => n !== "NaN")
  );
  return list.filter((shot) => {
    const n = shot.file.match(/fig(\d+)/)?.[1];
    return n && names.has(String(parseInt(n, 10)));
  });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const only = process.env.BER_SCREENSHOTS_ONLY ?? "";
  console.log(`Showcase capture → ${BASE}${only ? ` (only: ${only})` : ""}\n`);

  if (!(await waitForServer(10000))) {
    console.error("Start dev server: npm run dev");
    process.exit(1);
  }

  const desktopShots = filterShots(shots, only);
  const mobileOnly = filterShots(mobileShots, only);

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
  const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  desktop.setDefaultTimeout(120000);

  for (const shot of desktopShots) {
    console.log(`→ ${shot.file}`);
    try {
      await shot.setup(desktop);
      await shot.snap(desktop, shot.file);
      console.log(`  ✓ ${shot.snap.name.replace("snap", "")}`);
    } catch (e) {
      console.error(`  ✗`, e instanceof Error ? e.message : e);
    }
  }

  if (mobileOnly.length === 0) {
    await browser.close();
    console.log("\nSaved to", outDir);
    return;
  }

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  mobile.setDefaultTimeout(120000);
  for (const shot of mobileOnly) {
    console.log(`→ ${shot.file} (mobile)`);
    try {
      await shot.setup(mobile);
      await shot.snap(mobile, shot.file);
      console.log(`  ✓ mobile`);
    } catch (e) {
      console.error(`  ✗`, e instanceof Error ? e.message : e);
    }
  }

  await browser.close();
  console.log("\nSaved to", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
