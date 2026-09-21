import { test, expect } from "../setup";
import { loginAsPosAgent, openDrawerIfPresent } from "../utils/pos";
import fs from "fs";

test("customer able to place order from pos", async ({ adminPage }) => {
    await loginAsPosAgent(adminPage);

    await adminPage.goto("pos/customers");
    await adminPage.waitForLoadState("networkidle");

    await openDrawerIfPresent(adminPage);

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

    await openDrawerIfPresent(adminPage);

    await adminPage.getByRole("button", { name: "Agree", exact: true }).click();

    await openDrawerIfPresent(adminPage);

    await expect.soft(
        adminPage.getByText("Customer changed successfully.").nth(0)
    ).toBeVisible();

    await adminPage.goto("pos/home");
    await adminPage.waitForLoadState("networkidle");

    const productData = JSON.parse(fs.readFileSync("products.json", "utf-8"));

    await openDrawerIfPresent(adminPage);

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

    await adminPage.locator("a.secondary-button.w-full").click();

    await adminPage
        .locator("div.flex.justify-between > p.text-xl.font-medium")
        .nth(1)
        .textContent();

    await adminPage.locator('div[role="pos_cash"]').click();
    await adminPage.locator('button[label="Confirm Payment"]').click();
    await adminPage.locator('button[role="close_place_order"]').click();

    await adminPage.goto("pos/orders");
});
