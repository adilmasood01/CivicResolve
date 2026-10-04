import { test, expect } from "@playwright/test";

test.describe("Public Pages Mobile Responsiveness (/track & /about)", () => {
  const mobileViewports = [
    { name: "Small Mobile (iPhone SE 1st gen)", width: 320, height: 568 },
    { name: "Standard Mobile (iPhone SE 2nd/3rd)", width: 375, height: 667 },
    { name: "Modern Mobile (iPhone 14/15)", width: 390, height: 844 },
    { name: "Large Mobile (iPhone Plus/Max)", width: 414, height: 896 },
  ];

  for (const vp of mobileViewports) {
    test(`zero horizontal overflow on /track with ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/track");

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

    test(`zero horizontal overflow on /about with ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/about");

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

  test("/track touch targets meet minimum 44px standard and adapt to full width on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/track");

    const input = page.locator(".track-input");
    const submitBtn = page.locator(".track-submit");

    await expect(input).toBeVisible();
    await expect(submitBtn).toBeVisible();

    const inputBbox = await input.boundingBox();
    const btnBbox = await submitBtn.boundingBox();

    expect(inputBbox).not.toBeNull();
    expect(btnBbox).not.toBeNull();
    expect(inputBbox!.height).toBeGreaterThanOrEqual(44);
    expect(btnBbox!.height).toBeGreaterThanOrEqual(44);

    // On 375px mobile, button is stacked to full width of inner container (> 300px)
    expect(btnBbox!.width).toBeGreaterThanOrEqual(300);
  });

  test("/about actions stack nicely on mobile with >= 44px touch targets", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/about");

    const trackAction = page.locator(".about-actions a[href='/track']");
    const registerAction = page.locator(".about-actions a[href='/register']");

    await expect(trackAction).toBeVisible();
    await expect(registerAction).toBeVisible();

    const trackBox = await trackAction.boundingBox();
    const registerBox = await registerAction.boundingBox();

    expect(trackBox).not.toBeNull();
    expect(registerBox).not.toBeNull();
    expect(trackBox!.height).toBeGreaterThanOrEqual(44);
    expect(registerBox!.height).toBeGreaterThanOrEqual(44);

    // Stacked full-width buttons on mobile
    expect(trackBox!.width).toBeGreaterThanOrEqual(300);
    expect(registerBox!.width).toBeGreaterThanOrEqual(300);
  });
});
