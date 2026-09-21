import { test, expect } from "./../setup";
import { loginAsPosAgent, openDrawerIfPresent } from "../utils/pos";

test("It gives alert message in offline mode", async ({ adminPage }) => {
    await loginAsPosAgent(adminPage);

    await openDrawerIfPresent(adminPage);

    const context = adminPage.context();
    await context.setOffline(true);

    await expect(adminPage.locator("i.text-red-500")).toBeVisible();
    await expect(
        adminPage
            .getByText("Warning: You are offline. Limited functionality available")
            .nth(0)
    ).toBeVisible();

    await adminPage.getByRole("link", { name: "Cashier" }).click();
    await expect(
        adminPage.getByText("Warning, You are in offline mode")
    ).toBeVisible();

    await adminPage.getByRole("link", { name: "products" }).click();
    await expect(
        adminPage.getByText("Warning, You are in offline mode")
    ).toBeVisible();

    await adminPage.getByRole("link", { name: "reports" }).click();
    await expect(
        adminPage.getByText("Warning, You are in offline mode")
    ).toBeVisible();
});
