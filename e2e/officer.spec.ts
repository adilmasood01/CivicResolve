import { test, expect } from "@playwright/test";
import { loginAs, loginViaUi, logout } from "./helpers/auth";
import { getComplaintIdByNumber, resetComplaintStatus } from "./helpers/db";
import { SEED_COMPLAINTS, SEED_USERS } from "./helpers/users";

test.describe("Officer critical flows", () => {
  test.beforeEach(async () => {
    await resetComplaintStatus(
      SEED_COMPLAINTS.aliceAssigned,
      "IN_PROGRESS",
      SEED_USERS.officer.email
    );
  });

  test("logs in and lands on staff dashboard", async ({ page }) => {
    await loginViaUi(page, "officer");
    await expect(page).toHaveURL(/\/staff\/dashboard\/?$/);
  });

  test("views an assigned complaint", async ({ page }) => {
    await loginAs(page, "officer");
    const id = await getComplaintIdByNumber(SEED_COMPLAINTS.aliceAssigned);

    await page.goto(`/staff/complaints/${id}`);
    await expect(page.getByText(SEED_COMPLAINTS.aliceAssigned)).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Large pothole on Main Street/i,
      })
    ).toBeVisible();
  });

  test("changes complaint status", async ({ page }) => {
    await loginAs(page, "officer");
    const id = await getComplaintIdByNumber(SEED_COMPLAINTS.aliceAssigned);
    await page.goto(`/staff/complaints/${id}`);

    await page.getByRole("button", { name: "Transition to Resolved" }).click();
    await page
      .getByPlaceholder("Add context or notes for this status change...")
      .fill("E2E: pothole repaired and site cleared.");
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByRole("button", { name: "Confirm" })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText("Resolved").first()).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });
});
