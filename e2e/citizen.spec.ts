import { test, expect } from "@playwright/test";
import { loginAs, loginViaUi, logout } from "./helpers/auth";
import { getComplaintIdByNumber } from "./helpers/db";
import { SEED_COMPLAINTS } from "./helpers/users";

test.describe("Citizen critical flows", () => {
  test("logs in and lands on citizen dashboard", async ({ page }) => {
    await loginViaUi(page, "citizen");
    await expect(page).toHaveURL(/\/dashboard\/?$/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("submits a new complaint", async ({ page }) => {
    await loginAs(page, "citizen");
    await page.goto("/complaints/new");

    await page.locator("#category").selectOption({ index: 1 });
    const title = `E2E street light outage ${Date.now()}`;
    await page.locator("#title").fill(title);
    await page
      .locator("#description")
      .fill(
        "Playwright E2E: street light near the junction has been dark for several nights and needs repair."
      );
    await page.locator("#location").fill("Market Road and Chapel Square");

    await page.getByRole("button", { name: "Submit complaint" }).click();

    await expect(page.getByText("Complaint submitted")).toBeVisible();
    await expect(page).toHaveURL(/\/complaints\/[a-z0-9-]+$/i, {
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("views an owned complaint", async ({ page }) => {
    await loginAs(page, "citizen");
    const id = await getComplaintIdByNumber(SEED_COMPLAINTS.aliceAssigned);

    await page.goto(`/complaints/${id}`);
    await expect(page.getByText(SEED_COMPLAINTS.aliceAssigned)).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Large pothole on Main Street/i,
      })
    ).toBeVisible();
  });

  test("adds a public comment", async ({ page }) => {
    await loginAs(page, "citizen");
    const id = await getComplaintIdByNumber(SEED_COMPLAINTS.aliceAssigned);
    await page.goto(`/complaints/${id}`);

    const comment = `E2E public follow-up ${Date.now()}`;
    await page.getByPlaceholder("Write a comment or response…").fill(comment);
    await page.getByRole("button", { name: "Post comment" }).click();

    await expect(page.getByRole("button", { name: "Posting…" })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(comment)).toBeVisible();
  });

  test("cannot access another citizen's complaint", async ({ page }) => {
    const bobComplaintId = await getComplaintIdByNumber(
      SEED_COMPLAINTS.bobOwned
    );

    await loginAs(page, "citizen");
    await page.goto(`/complaints/${bobComplaintId}`);

    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });
});
