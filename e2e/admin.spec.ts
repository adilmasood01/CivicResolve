import { test, expect } from "@playwright/test";
import { loginAs, loginViaUi, logout } from "./helpers/auth";
import { SEED_USERS } from "./helpers/users";

test.describe("Admin critical flows", () => {
  test("logs in and lands on admin dashboard", async ({ page }) => {
    await loginViaUi(page, "admin");
    await expect(page).toHaveURL(/\/admin\/dashboard\/?$/);
    await expect(
      page.getByRole("heading", { name: /Control center/i })
    ).toBeVisible();
  });

  test("manages a user (edit permissions)", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/users");

    await page
      .getByPlaceholder("Search by name or email…")
      .fill(SEED_USERS.citizenB.email);
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page.getByText(SEED_USERS.citizenB.email)).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).first().click();

    await expect(
      page.getByRole("heading", { name: "Edit User Permissions" })
    ).toBeVisible();
    await expect(page.getByText(SEED_USERS.citizenB.email)).toBeVisible();

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("User permissions updated successfully.")
    ).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });
});
