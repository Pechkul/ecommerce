import { test, expect } from "./../setup";
import { loginAsPosAgent, openDrawerIfPresent } from "../utils/pos";
import fs from "fs";

test("agent can also complete an order in offline mode", async ({
    adminPage,
}) => {
    await loginAsPosAgent(adminPage);

    await openDrawerIfPresent(adminPage);

    await adminPage.goto("pos/customers");
    await adminPage.waitForLoadState("networkidle");

    const context = adminPage.context();
    await context.setOffline(true);

    await expect(adminPage.locator("i.text-red-500")).toBeVisible();
    await expect(
        adminPage
            .getByText("Warning: You are offline. Limited functionality available")
            .nth(0)
    ).toBeVisible();

    const customerName = JSON.parse(fs.readFileSync("customer.json", "utf-8"));

    await adminPage
        .locator("div.grid > p.text-base", { hasText: customerName })
        .nth(0)
        .click();

    await (
        await adminPage
            .getByRole("button", { name: "Change Customer" })
            .isVisible()
            ? adminPage.getByRole("button", { name: "Change Customer" })
            : adminPage.getByRole("button", { name: "Select Customer" })
    ).click();

    await adminPage.getByRole("button", { name: "Agree", exact: true }).click();
    await expect.soft(
        adminPage.getByText("Customer changed successfully.").nth(0)
    ).toBeVisible();

    await adminPage.getByRole("link", { name: "Home" }).click();

    const productData = JSON.parse(fs.readFileSync("products.json", "utf-8"));

    for (let i = 1; i < 3; i++) {
        const no = Math.floor(Math.random() * 5) + 1;
        const productName = productData[`product${no}`];
        await adminPage
            .locator("div.box-shadow", { hasText: productName })
            .click();
    }

    const cross = adminPage.locator(".phpdebugbar-close-btn").nth(0);
    if (await cross.isVisible().catch(() => false)) {
        await cross.click();
    }

    await adminPage.getByRole("button", { name: " Hold Order" }).click();
    await adminPage.getByRole("button", { name: "Agree", exact: true }).click();

    await expect(
        adminPage.getByText("Order has been hold successfully.").nth(0)
    ).toBeVisible();

    await adminPage
        .locator('a>span.font-medium:has-text("Orders")')
        .click();
    await adminPage
        .locator('div>div.font-medium:has-text("Orders On Hold")')
        .click();
    await expect(adminPage.getByText(`${customerName}`)).toBeVisible();
});
