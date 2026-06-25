/**
 * Hide Next.js dev "N Issue(s)" badge during automated screenshots.
 * Works in dev mode via DOM removal + CSS hook on documentElement.
 */

/** @param {import('playwright').Page} page */
export async function registerHideDevOverlayInit(page) {
  await page.addInitScript(() => {
    document.documentElement.dataset.captureScreenshot = "true";

    const hide = () => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    };

    hide();
    const observe = () => {
      new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
    };
    if (document.body) observe();
    else document.addEventListener("DOMContentLoaded", observe, { once: true });
  });
}

/** @param {import('playwright').Page} page */
export async function hideDevOverlay(page) {
  await page.evaluate(() => {
    document.documentElement.dataset.captureScreenshot = "true";
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
  await page.waitForTimeout(50);
}
