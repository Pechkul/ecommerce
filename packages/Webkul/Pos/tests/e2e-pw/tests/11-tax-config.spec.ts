import { test, expect } from "./../setup";
import { loginAsPosAgent, openDrawerIfPresent } from "../utils/pos";
import fs from "fs";

test("if text is configured then it should be visible in pos ", async ({
    adminPage,
}) => {
    await adminPage.goto("admin/settings/taxes/rates");
    await adminPage
        .getByRole("link", { name: " Create Tax Rate " })
        .nth(0)
        .click();
    await adminPage.getByPlaceholder("Identifier").fill("us-tax");
    await adminPage.locator('select[name="country"]').selectOption("US");
    await adminPage.getByPlaceholder("Rate").fill("20");
    await adminPage.getByRole("button", { name: " Save Tax Rate " }).click();
    await expect.soft(
        adminPage.getByText("Tax rate created successfully.").nth(0)
    ).toBeVisible();

    await adminPage.goto("admin/settings/taxes/categories");
    await adminPage
        .getByRole("button", { name: " Create Tax Category " })
        .click();

    const uniqueCode = `tax-pos-${Date.now()}`;
    await adminPage.getByPlaceholder("Code").fill(uniqueCode);
    await adminPage.getByPlaceholder("Name").fill("tax-pos");
    await adminPage
        .getByPlaceholder("Description")
        .fill("This is tax description");
    await adminPage
        .locator('select[name="taxrates[]"]')
        .selectOption({ label: "us-tax" });
    await adminPage.getByRole("button", { name: "Save Tax Category" }).click();

    await adminPage.waitForLoadState("networkidle");

    await expect.soft(
        adminPage.getByText(uniqueCode).first()
    ).toBeVisible();

    await adminPage.goto("admin/configuration/sales/taxes");
    await adminPage
        .locator('select[id="sales[taxes][categories][shipping]"]')
        .selectOption({ label: "None" });
    await adminPage
        .locator('select[name="sales[taxes][categories][product]"]')
        .selectOption({ label: "tax-pos" });
    await adminPage
        .locator('select[id="sales[taxes][calculation][based_on]"]')
        .selectOption("billing_address");
    await adminPage
        .locator('select[id="sales[taxes][calculation][product_prices]"]')
        .selectOption("excluding_tax");
    await adminPage
        .locator('select[id="sales[taxes][calculation][shipping_prices]"]')
        .selectOption("excluding_tax");
    await adminPage
        .locator('select[id="sales[taxes][shopping_cart][display_prices]"]')
        .selectOption("excluding_tax");
    await adminPage
        .locator('select[id="sales[taxes][shopping_cart][display_subtotal]"]')
        .selectOption("both");
    await adminPage
        .locator(
            'select[id="sales[taxes][shopping_cart][display_shipping_amount]"]'
        )
        .selectOption("both");
    await adminPage
        .locator('select[id="sales[taxes][sales][display_prices]"]')
        .selectOption("excluding_tax");
    await adminPage
        .locator('select[id="sales[taxes][sales][display_subtotal]"]')
        .selectOption("both");
    await adminPage
        .locator('select[id="sales[taxes][sales][display_shipping_amount]"]')
        .selectOption("both");
    await adminPage
        .getByRole("button", { name: " Save Configuration " })
        .click();
    await expect.soft(
        adminPage.getByText("Configuration saved successfully").nth(0)
    ).toBeVisible();

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
    await expect.soft(
        adminPage.getByText("Customer changed successfully.").nth(0)
    ).toBeVisible();

    await adminPage.goto("pos/home");
    await adminPage.waitForLoadState("networkidle");

    const productData = JSON.parse(fs.readFileSync("products.json", "utf-8"));

    for (let i = 1; i < 3; i++) {
        const no = Math.floor(Math.random() * 5) + 1;
        const productName = productData[`product${no}`];
        await adminPage
            .locator("div.box-shadow", { hasText: productName })
            .click();
    }

    const priceText = await adminPage
        .locator("div.grid>div.grid>div>p")
        .nth(3)
        .textContent();
    expect.soft(priceText?.trim()).toMatch(/^\$\d+\.\d{2}$/);
});
