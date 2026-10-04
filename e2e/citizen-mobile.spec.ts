import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Citizen Experience Mobile Responsiveness", () => {
  const mobileViewports = [
    { name: "Small Mobile (iPhone SE 1st gen)", width: 320, height: 568 },
    { name: "Standard Mobile (iPhone SE 2nd/3rd)", width: 375, height: 667 },
    { name: "Modern Mobile (iPhone 14/15)", width: 390, height: 844 },
    { name: "Large Mobile (iPhone Plus/Max)", width: 414, height: 896 },
  ];

  test.beforeEach(async ({ page }) => {
    await loginAs(page, "citizen");
  });

  for (const vp of mobileViewports) {
    test(`zero horizontal overflow on /dashboard with ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/dashboard");

      const overflow = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const offenders: Array<{ tag: string; class: string; width: number }> = [];
        document.querySelectorAll("*").forEach((el) => {
          const h = el as HTMLElement;
          if (h.offsetWidth > clientWidth) {
            offenders.push({ tag: h.tagName, class: h.className, width: h.offsetWidth });
          }
        });
        return { scrollWidth, clientWidth, offenders: offenders.slice(0, 5) };
      });

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
      expect(overflow.offenders).toHaveLength(0);
    });

    test(`zero horizontal overflow on /complaints/new with ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/complaints/new");

      const overflow = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const offenders: Array<{ tag: string; class: string; width: number }> = [];
        document.querySelectorAll("*").forEach((el) => {
          const h = el as HTMLElement;
          if (h.offsetWidth > clientWidth) {
            offenders.push({ tag: h.tagName, class: h.className, width: h.offsetWidth });
          }
        });
        return { scrollWidth, clientWidth, offenders: offenders.slice(0, 5) };
      });

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
      expect(overflow.offenders).toHaveLength(0);
    });

    test(`zero horizontal overflow on /profile with ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/profile");

      const overflow = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const offenders: Array<{ tag: string; class: string; width: number }> = [];
        document.querySelectorAll("*").forEach((el) => {
          const h = el as HTMLElement;
          if (h.offsetWidth > clientWidth) {
            offenders.push({ tag: h.tagName, class: h.className, width: h.offsetWidth });
          }
        });
        return { scrollWidth, clientWidth, offenders: offenders.slice(0, 5) };
      });

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
      expect(overflow.offenders).toHaveLength(0);
    });

    test(`zero horizontal overflow on /notifications with ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/notifications");

      const overflow = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const offenders: Array<{ tag: string; class: string; width: number }> = [];
        document.querySelectorAll("*").forEach((el) => {
          const h = el as HTMLElement;
          if (h.offsetWidth > clientWidth) {
            offenders.push({ tag: h.tagName, class: h.className, width: h.offsetWidth });
          }
        });
        return { scrollWidth, clientWidth, offenders: offenders.slice(0, 5) };
      });

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
      expect(overflow.offenders).toHaveLength(0);
    });
  }

  test("AuthNav mobile controls and drawer have >= 44px touch targets", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    const hamburger = page.locator(".auth-nav-icon-btn.md\\:hidden");
    const notifBtn = page.locator(".auth-nav-icon-btn[aria-label*='Notifications']");
    const userBtn = page.locator("#nav-user-menu-btn");

    await expect(hamburger).toBeVisible();
    await expect(notifBtn).toBeVisible();
    await expect(userBtn).toBeVisible();

    const hBox = await hamburger.boundingBox();
    const nBox = await notifBtn.boundingBox();
    const uBox = await userBtn.boundingBox();

    expect(hBox!.width).toBeGreaterThanOrEqual(44);
    expect(hBox!.height).toBeGreaterThanOrEqual(44);
    expect(nBox!.width).toBeGreaterThanOrEqual(44);
    expect(nBox!.height).toBeGreaterThanOrEqual(44);
    expect(uBox!.height).toBeGreaterThanOrEqual(44);

    // Open mobile nav drawer
    await hamburger.click();
    const mobileLinks = page.locator("nav[aria-label='Mobile primary'] a");
    const count = await mobileLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const linkBox = await mobileLinks.nth(i).boundingBox();
      expect(linkBox!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("New complaint form inputs and buttons adapt for mobile with proper touch targets", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/complaints/new");

    const categorySelect = page.locator("#category");
    const titleInput = page.locator("#title");
    const locationInput = page.locator("#location");
    const submitBtn = page.locator("button[type='submit']");

    await expect(categorySelect).toBeVisible();
    await expect(titleInput).toBeVisible();
    await expect(locationInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    const catBox = await categorySelect.boundingBox();
    const titleBox = await titleInput.boundingBox();
    const locBox = await locationInput.boundingBox();
    const subBox = await submitBtn.boundingBox();

    expect(catBox!.height).toBeGreaterThanOrEqual(44);
    expect(titleBox!.height).toBeGreaterThanOrEqual(44);
    expect(locBox!.height).toBeGreaterThanOrEqual(44);
    expect(subBox!.height).toBeGreaterThanOrEqual(44);

    // On mobile screens, submit button stretches full width
    expect(subBox!.width).toBeGreaterThanOrEqual(300);
  });
});
