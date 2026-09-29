import { test, expect } from "@playwright/test";
import { loginAs, loginViaUi, logout } from "./helpers/auth";
import {
  getComplaintIdByNumber,
  getOfficerIdByEmail,
  resetComplaintStatus,
} from "./helpers/db";
import { SEED_COMPLAINTS, SEED_USERS } from "./helpers/users";

test.describe("Manager critical flows", () => {
  test.beforeEach(async () => {
    await resetComplaintStatus(
      SEED_COMPLAINTS.managerAssignable,
      "UNDER_REVIEW",
      null
    );
  });

  test("logs in and lands on manager dashboard", async ({ page }) => {
    await loginViaUi(page, "manager");
    await expect(page).toHaveURL(/\/manager\/dashboard\/?$/);
  });

  test("assigns an officer to a department complaint", async ({ page }) => {
    await loginAs(page, "manager");
    const id = await getComplaintIdByNumber(SEED_COMPLAINTS.managerAssignable);
    await page.goto(`/manager/complaints/${id}`);

    await expect(page.getByText(SEED_COMPLAINTS.managerAssignable)).toBeVisible();

    const officerId = await getOfficerIdByEmail(SEED_USERS.officer.email);
    const officerSelect = page.getByLabel("Assigned officer");
    await expect(officerSelect).toBeVisible({ timeout: 20_000 });

    await officerSelect.selectOption(officerId);
    await expect(officerSelect).toHaveValue(officerId);

    await page.reload();
    await expect(page.getByText(/Currently:\s*Kwame Asante/i)).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });
});
