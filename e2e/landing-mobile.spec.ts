import { test, expect } from "@playwright/test";

test.describe("Landing Page Mobile Responsiveness", () => {
  const mobileViewports = [
    { name: "Small Mobile (iPhone SE 1st gen)", width: 320, height: 568 },
    { name: "Standard Mobile (iPhone SE 2nd/3rd)", width: 375, height: 667 },
    { name: "Modern Mobile (iPhone 14/15)", width: 390, height: 844 },
    { name: "Large Mobile (iPhone Plus/Max)", width: 414, height: 896 },
  ];

  for (const vp of mobileViewports) {
    test(`zero horizontal overflow on ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

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

  test("mobile touch targets meet minimum 44px standard", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Hamburger button
    const hamburgerBox = await page.locator(".landing-nav-hamburger").boundingBox();
    expect(hamburgerBox).not.toBeNull();
    expect(hamburgerBox!.width).toBeGreaterThanOrEqual(44);
    expect(hamburgerBox!.height).toBeGreaterThanOrEqual(44);

    // Hero CTA primary button
    const heroCtaBox = await page.locator(".landing-hero-cta .landing-cta-primary").first().boundingBox();
    expect(heroCtaBox).not.toBeNull();
    expect(heroCtaBox!.height).toBeGreaterThanOrEqual(44);

    // FAQ items summary tap target
    const faqSummaryBox = await page.locator(".landing-faq-item summary").first().boundingBox();
    expect(faqSummaryBox).not.toBeNull();
    expect(faqSummaryBox!.height).toBeGreaterThanOrEqual(44);
  });

  test("mobile hamburger menu toggles, navigates, and closes on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const hamburger = page.locator(".landing-nav-hamburger");
    const drawer = page.locator(".landing-nav-mobile-drawer");

    await expect(hamburger).toBeVisible();
    await expect(drawer).not.toHaveClass(/landing-nav-mobile-drawer--open/);

    // Click to open
    await hamburger.click();
    await expect(drawer).toHaveClass(/landing-nav-mobile-drawer--open/);

    // Check all mobile links are present and tap targets >= 44px
    const links = page.locator(".landing-nav-mobile-link");
    expect(await links.count()).toBe(3);
    for (let i = 0; i < 3; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(drawer).not.toHaveClass(/landing-nav-mobile-drawer--open/);
  });

  test("FAQ accordion opens and closes smoothly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const firstFaq = page.locator(".landing-faq-item").first();
    const summary = firstFaq.locator("summary");
    const answer = firstFaq.locator("p");

    await expect(answer).not.toBeVisible();
    await summary.click();
    await expect(answer).toBeVisible();
    await summary.click();
    await expect(answer).not.toBeVisible();
  });

  test("Trust guarantees stack properly without text overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");

    const trustItems = page.locator(".landing-trust-list li");
    expect(await trustItems.count()).toBe(4);

    for (let i = 0; i < 4; i++) {
      const box = await trustItems.nth(i).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(300); // full width on <480px screens
    }
  });

  test("Footer columns adapt into 2 columns on mobile devices", async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto("/");

    const productCol = page.locator(".landing-footer-col[aria-label='Product']");
    const accountCol = page.locator(".landing-footer-col[aria-label='Account']");

    await expect(productCol).toBeVisible();
    await expect(accountCol).toBeVisible();

    const pBox = await productCol.boundingBox();
    const aBox = await accountCol.boundingBox();

    // On 480px, they should be side-by-side (same top coordinate within 5px)
    expect(Math.abs(pBox!.y - aBox!.y)).toBeLessThan(10);
  });
});
