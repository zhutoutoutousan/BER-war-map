#!/usr/bin/env node
/**
 * Playwright screenshots for Graf report → report/figures/
 * Captures integrated Board Room page (/beschaeftigung) on dev server.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { registerHideDevOverlayInit, hideDevOverlay } from "../../scripts/hide-dev-overlay.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const PORT = Number(process.env.BER_WAR_MAP_PORT ?? process.env.PORT ?? 3001);
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(__dirname, "report", "figures");

async function waitForServer(ms = 120_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(`${BASE}/beschaeftigung`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

function startDevServer() {
  return spawn("npm", ["run", "dev"], {
    cwd: root,
    stdio: "ignore",
    shell: true,
    env: { ...process.env, PORT: String(PORT) }
  });
}

/** @param {import('playwright').Page} page */
async function snap(page, name, opts = {}) {
  await hideDevOverlay(page);
  await page.waitForTimeout(opts.wait ?? 500);
  const file = path.join(OUT, name);
  if (opts.locator) {
    const el = page.locator(opts.locator);
    await el.waitFor({ state: opts.attached ? "attached" : "visible", timeout: 45_000 });
    await el.scrollIntoViewIfNeeded().catch(() => undefined);
    await el.screenshot({ path: file, animations: "disabled", ...(opts.force ? { force: true } : {}) });
  } else if (opts.fullPage) {
    await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
  } else {
    await page.screenshot({ path: file, animations: "disabled" });
  }
  console.log(`  ✓ ${name}`);
}

/** @param {import('playwright').Page} page */
async function seedBoardRoomSession(page) {
  await page.addInitScript(() => {
    localStorage.setItem("ber-war-map-session-v1", JSON.stringify({ role: "guest", persona: "municipality" }));
    localStorage.setItem("ber-war-map-cameo-v1", "done");
    localStorage.setItem("ber-war-map-guided-tour-v4", "done");
  });
}

/** @param {import('playwright').Page} page */
async function openBoardRoomBriefingTab(page) {
  await page.goto(`${BASE}/?tab=briefing&panel=open`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForSelector('[data-testid="showcase-map"]', { timeout: 60_000 });

  const picker = page.getByTestId("session-picker-modal");
  if (await picker.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByTestId("session-persona-municipality").click();
    await picker.waitFor({ state: "hidden", timeout: 20_000 });
  }

  const cameo = page.getByTestId("problem-cameo-gate");
  if (await cameo.isVisible({ timeout: 3000 }).catch(() => false)) {
    for (let i = 0; i < 4; i++) {
      const btn = page.getByTestId("cameo-continue");
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) await btn.click();
    }
    const opt = page.locator('[data-testid^="cameo-option-"]').first();
    if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) await opt.click();
    await page.getByTestId("cameo-enter-board-room").click({ timeout: 5000 }).catch(() => undefined);
    await cameo.waitFor({ state: "hidden", timeout: 20_000 }).catch(() => undefined);
  }

  const tour = page.getByTestId("guided-tour-overlay");
  if (await tour.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByTestId("guided-tour-skip").click();
    await tour.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => undefined);
  }

  const leftPanel = page.getByTestId("showcase-panel-left");
  const showBtn = leftPanel.getByRole("button", { name: "Show" });
  if (await showBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await showBtn.click();
  }

  const briefingTab = page.getByTestId("map-tab-briefing");
  if (await briefingTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await briefingTab.click();
  } else if (await page.getByTestId("map-tab-more").isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByTestId("map-tab-more").click();
    await page.getByTestId("map-tab-more-briefing").click();
  }

  await page.waitForSelector('[data-testid="panel-briefing"]', { state: "visible", timeout: 30_000 });
  await page.waitForTimeout(1200);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const reuse = process.env.PW_REUSE_SERVER === "1";
  let dev = null;
  if (!reuse) {
    dev = startDevServer();
    if (!(await waitForServer())) {
      dev?.kill();
      console.error("Start dev server failed:", BASE);
      process.exit(1);
    }
  } else if (!(await waitForServer(15_000))) {
    console.error("Dev server not running. Start: npm run dev");
    process.exit(1);
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await registerHideDevOverlayInit(page);
  await seedBoardRoomSession(page);
  page.setDefaultTimeout(60_000);

  try {
    await page.goto(`${BASE}/beschaeftigung`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForSelector('[data-testid="graf-briefing-page"]', { timeout: 45_000 });
    await page.waitForSelector('[data-testid="graf-kpi-grid"]', { timeout: 45_000 });
    await page.waitForTimeout(2500);

    await snap(page, "fig-app-hero.png", { locator: '[data-section="hero"]' });
    await snap(page, "fig-app-header.png", { locator: "header.panel" });
    await page.locator('[data-section="reframe"]').scrollIntoViewIfNeeded();
    await snap(page, "fig-app-reframe.png", { locator: '[data-section="reframe"]' });
    await page.locator('[data-section="evidence"]').scrollIntoViewIfNeeded();
    await snap(page, "fig-app-dashboard.png", { locator: '[data-section="evidence"]' });
    await page.locator('[data-section="map"]').scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('[data-testid="graf-briefing-map"] canvas');
        return Boolean(canvas && canvas.width > 64 && canvas.height > 64);
      },
      { timeout: 45_000 }
    );
    await page.waitForTimeout(1500);
    await snap(page, "fig-app-map.png", { locator: '[data-section="map"]' });
    await page.locator('[data-section="model"]').scrollIntoViewIfNeeded();
    await snap(page, "fig-app-model.png", { locator: '[data-section="model"]' });
    await page.locator('[data-section="table"]').scrollIntoViewIfNeeded();
    await snap(page, "fig-app-table.png", { locator: '[data-section="table"] .panel' });
    await page.locator('[data-section="pilot"]').scrollIntoViewIfNeeded();
    await snap(page, "fig-app-pilot.png", { locator: '[data-section="pilot"]' });
    await snap(page, "fig-app-full.png", { fullPage: true, wait: 1000 });

    await openBoardRoomBriefingTab(page);
    await snap(page, "fig-app-board-briefing-tab.png", { locator: '[data-testid="panel-briefing"]' });
    await snap(page, "fig-app-nav-workforce.png", {
      locator: '[data-testid="capture-chrome"] a[href="/beschaeftigung"]',
      wait: 300
    });
  } finally {
    await browser.close();
    if (dev) dev.kill();
  }

  console.log("\nSaved →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
