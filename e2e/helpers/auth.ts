import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { SEED_USERS, type SeedRole } from "./users";

/**
 * Establish a session via Auth.js credentials callback (stable for flow tests).
 * Prefer this for non-login specs so hydration races do not flake the suite.
 */
export async function loginAs(page: Page, role: SeedRole): Promise<void> {
  const user = SEED_USERS[role];

  const csrf = await page.request
    .get("/api/auth/csrf")
    .then((r) => r.json() as Promise<{ csrfToken: string }>);

  const response = await page.request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken: csrf.csrfToken,
      email: user.email,
      password: user.password,
      redirect: "false",
      json: "true",
      callbackUrl: user.dashboardPath,
    },
  });

  // Auth.js returns 200 (JSON) or 302 depending on version / redirect flags
  if (!response.ok() && response.status() !== 302) {
    throw new Error(
      `Auth.js login failed for ${user.email}: ${response.status()} ${await response.text()}`
    );
  }

  await page.goto(user.dashboardPath);
  await expect(page).toHaveURL(new RegExp(`${user.dashboardPath}(/)?$`));
}

/**
 * Full UI login — used by the dedicated "logs in" specs.
 * Waits for hydration so the client onSubmit handler is attached.
 */
export async function loginViaUi(page: Page, role: SeedRole): Promise<void> {
  const user = SEED_USERS[role];

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("form", { name: "Sign in form" })).toBeVisible();
  await expect(page.locator(".auth-card[aria-busy='true']")).toHaveCount(0);

  // React attaches listeners after paint; wait until submit is handled client-side
  await page.waitForFunction(() => {
    const form = document.querySelector<HTMLFormElement>(
      'form[aria-label="Sign in form"]'
    );
    if (!form) return false;
    // Probe: a temporary listener check — hydrated React forms prevent default navigation
    let prevented = false;
    const probe = (e: Event) => {
      e.preventDefault();
      prevented = true;
    };
    form.addEventListener("submit", probe);
    form.requestSubmit();
    form.removeEventListener("submit", probe);
    return prevented;
  });

  await page.locator("#login-email").fill(user.email);
  await page.locator("#login-password").fill(user.password);

  await Promise.all([
    page.waitForURL(
      (url) =>
        url.pathname === user.dashboardPath ||
        url.pathname === `${user.dashboardPath}/`,
      { timeout: 30_000 }
    ),
    page.locator("#login-submit").click(),
  ]);
}

/** Clear session cookies so the next login starts clean. */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
}
