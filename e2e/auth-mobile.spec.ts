import { test, expect } from "@playwright/test";

test.describe("Auth Pages Mobile Responsiveness (/login & /register)", () => {
  const mobileViewports = [
    { name: "Small Mobile (iPhone SE 1st gen)", width: 320, height: 568 },
    { name: "Standard Mobile (iPhone SE 2nd/3rd)", width: 375, height: 667 },
    { name: "Modern Mobile (iPhone 14/15)", width: 390, height: 844 },
    { name: "Large Mobile (iPhone Plus/Max)", width: 414, height: 896 },
  ];

  for (const vp of mobileViewports) {
    test(`zero horizontal overflow on /login with ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/login");

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

    test(`zero horizontal overflow on /register with ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/register");

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

  test("/login inputs and buttons meet mobile touch targets and full width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");

    const emailInput = page.locator("#login-email");
    const passwordInput = page.locator("#login-password");
    const submitBtn = page.locator("#login-submit");
    const toggleBtn = page.locator(".auth-password-toggle");

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(toggleBtn).toBeVisible();

    const emailBox = await emailInput.boundingBox();
    const passBox = await passwordInput.boundingBox();
    const submitBox = await submitBtn.boundingBox();
    const toggleBox = await toggleBtn.boundingBox();

    expect(emailBox!.height).toBeGreaterThanOrEqual(44);
    expect(passBox!.height).toBeGreaterThanOrEqual(44);
    expect(submitBox!.height).toBeGreaterThanOrEqual(44);
    expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
    expect(toggleBox!.height).toBeGreaterThanOrEqual(44);

    // Full width submit button
    expect(submitBox!.width).toBeGreaterThanOrEqual(300);
  });

  test("/register inputs and buttons meet mobile touch targets", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/register");

    const nameInput = page.locator("input#name, input[name='name']");
    const emailInput = page.locator("input#email, input[name='email']");
    const submitBtn = page.locator("button[type='submit']");

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    const nameBox = await nameInput.boundingBox();
    const emailBox = await emailInput.boundingBox();
    const submitBox = await submitBtn.boundingBox();

    expect(nameBox!.height).toBeGreaterThanOrEqual(44);
    expect(emailBox!.height).toBeGreaterThanOrEqual(44);
    expect(submitBox!.height).toBeGreaterThanOrEqual(44);
    expect(submitBox!.width).toBeGreaterThanOrEqual(300);
  });
});
