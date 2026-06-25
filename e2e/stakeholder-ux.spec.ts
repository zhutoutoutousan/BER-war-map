import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideDevOverlay, registerHideDevOverlayInit } from "../scripts/hide-dev-overlay.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, "screenshots");

type Persona = "company" | "investor" | "municipality" | "explore";

const PERSONAS: {
  id: Persona;
  label: string;
  defaultTab: string;
  demoMember?: string;
  filterChip?: string;
}[] = [
  { id: "company", label: "Company", defaultTab: "junqingchu", demoMember: "buwog", filterChip: "Developer" },
  { id: "investor", label: "Investor", defaultTab: "members", demoMember: "sector-seven", filterChip: "Investor" },
  {
    id: "municipality",
    label: "Municipality",
    defaultTab: "briefing",
    demoMember: "wfg-lds",
    filterChip: "Public"
  },
  { id: "explore", label: "Explore", defaultTab: "value" }
];

async function goToTab(page: Page, tab: string) {
  const direct = page.getByTestId(`map-tab-${tab}`);
  if (await direct.isVisible({ timeout: 2000 }).catch(() => false)) {
    await direct.click();
    return;
  }
  await page.getByTestId("map-tab-more").click();
  await page.getByTestId(`map-tab-more-${tab}`).click();
}

async function completeGuidedTour(page: Page) {
  const overlay = page.getByTestId("guided-tour-overlay");
  if (!(await overlay.isVisible({ timeout: 5000 }).catch(() => false))) return;
  const skip = page.getByTestId("guided-tour-skip");
  if (!(await skip.isVisible({ timeout: 500 }).catch(() => false))) {
    await page.getByTestId("guided-tour-expand").click();
  }
  await skip.click();
  await expect(overlay).toBeHidden({ timeout: 15_000 });
}

async function completeProblemCameo(page: Page) {
  await expect(page.getByTestId("problem-cameo-gate")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("cameo-continue").click();
  await page.getByTestId("cameo-continue").click();
  await page.locator('[data-testid^="cameo-option-"]').first().click();
  await page.getByTestId("cameo-continue").click();
  await page.getByTestId("cameo-continue").click();
  await page.getByTestId("cameo-enter-board-room").click();
  await expect(page.getByTestId("problem-cameo-gate")).toBeHidden({ timeout: 15_000 });
  await completeGuidedTour(page);
}

async function ensureLeftPanelOpen(page: Page) {
  const panel = page.getByTestId("showcase-panel-left");
  const showBtn = panel.getByRole("button", { name: "Show" });
  if (await showBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await showBtn.click();
  }
}

async function clearSession(page: Page) {
  await registerHideDevOverlayInit(page);
  await page.addInitScript(() => {
    localStorage.removeItem("ber-war-map-session-v1");
    localStorage.removeItem("ber-war-map-cameo-v1");
    localStorage.removeItem("ber-war-map-guided-tour-v4");
  });
}

async function waitForMapReady(page: Page) {
  const map = page.locator('[data-testid="showcase-map"], [data-testid="showcase-map-embedded"]').first();
  await map.waitFor({ state: "visible", timeout: 30_000 });
  await page
    .waitForFunction(
      () => {
        const canvas = document.querySelector(
          '[data-testid="showcase-map"] canvas, [data-testid="showcase-map-embedded"] canvas'
        ) as HTMLCanvasElement | null;
        return Boolean(canvas && canvas.width > 64 && canvas.height > 64);
      },
      { timeout: 30_000 }
    )
    .catch(() => undefined);
  await page.waitForTimeout(2000);
}

async function shot(page: Page, subdir: string, name: string, waitMap = false) {
  if (waitMap) await waitForMapReady(page);
  await hideDevOverlay(page);
  const dir = path.join(SHOTS, subdir);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: false });
}

test.describe.configure({ timeout: 60_000 });

test.describe("Stakeholder UX — session & board room", () => {
  test("session picker — screenshot", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    await clearSession(page);
    await page.goto("/");
    await expect(page.getByTestId("session-picker-modal")).toBeVisible({ timeout: 30_000 });
    await shot(page, "_shared", isMobile ? "00-session-picker-mobile" : "00-session-picker");
  });

  for (const persona of PERSONAS) {
    test(`${persona.label} — critical path & screenshots`, async ({ page }, testInfo) => {
      const isMobile = testInfo.project.name === "mobile";
      const prefix = isMobile ? `mobile-${persona.id}` : persona.id;

      await clearSession(page);
      await page.goto("/");
      await expect(page.getByTestId("session-picker-modal")).toBeVisible({ timeout: 30_000 });
      await page.getByTestId(`session-persona-${persona.id}`).click();
      await expect(page.getByTestId("session-picker-modal")).toBeHidden({ timeout: 15_000 });
      await completeProblemCameo(page);
      await expect
        .poll(async () => {
          const s = await page.locator("[data-scene]").first().getAttribute("data-scene");
          return s?.includes(persona.defaultTab) ?? false;
        })
        .toBe(true);

      await expect(page.getByTestId("persona-view-banner").first()).toBeVisible();
      await expect(page.getByTestId("session-switch-user")).toContainText(persona.label);

      const scene = await page.locator("[data-scene]").first().getAttribute("data-scene");
      expect(scene).toContain(persona.defaultTab);
      if (persona.demoMember) expect(scene).toContain(persona.demoMember);

      await shot(page, prefix, "01-after-role-select", true);

      if (!isMobile && (persona.id === "investor" || persona.id === "company")) {
        await ensureLeftPanelOpen(page);
        await goToTab(page, "members");
        await expect(page.getByTestId("members-persona-filter-hint")).toBeVisible();
      }

      await shot(page, prefix, "02-default-view", true);

      if (!isMobile) {
        await ensureLeftPanelOpen(page);
        await goToTab(page, "value");
        const leftPanel = page.getByTestId("showcase-panel-left");
        const benchmarks = leftPanel.getByTestId("panel-benchmarks");
        await benchmarks.scrollIntoViewIfNeeded();
        await expect(benchmarks).toBeVisible({ timeout: 10_000 });
        await shot(page, prefix, "02b-benchmarks");
      }

      if (!isMobile) {
        await ensureLeftPanelOpen(page);
        const leftPanel = page.getByTestId("showcase-panel-left");
        await goToTab(page, "junqingchu");
        await expect(leftPanel.getByTestId("panel-osm-intel")).toBeVisible({ timeout: 10_000 });
        const osmReady = leftPanel.getByTestId("osm-intel-ready");
        if (await osmReady.isVisible({ timeout: 30_000 }).catch(() => false)) {
          await expect(leftPanel.getByTestId("asset-inventory-summary")).toBeVisible();
        }
        await shot(page, prefix, "03-assets-osm", true);

        await goToTab(page, "members");
        await page.waitForTimeout(500);
        await shot(page, prefix, "04-mitglieder", true);

        await page.getByTestId("view-mode-matching").click();
        await page.waitForTimeout(1500);
        await shot(page, prefix, "05-matching-map");
      } else {
        await page.getByTestId("mobile-nav-explore").click();
        await expect(page.getByTestId("showcase-panel-left-mobile")).toBeVisible();
        await shot(page, prefix, "03-mobile-explore-sheet");
      }
    });
  }
});

test.describe("Board room branding", () => {
  test("header shows BER+ Board Room", async ({ page }) => {
    await clearSession(page);
    await page.goto("/");
    await expect(page.getByTestId("session-picker-modal")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("session-persona-explore").click();
    await expect(page.getByTestId("session-picker-modal")).toBeHidden({ timeout: 15_000 });
    await completeProblemCameo(page);
    await expect(page.getByTestId("showcase-header")).toContainText("Board Room", { timeout: 15_000 });
  });
});
