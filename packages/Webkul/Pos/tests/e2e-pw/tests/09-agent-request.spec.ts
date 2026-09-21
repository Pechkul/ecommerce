import { test, expect } from "../setup";
import { loginAsPosAgent, openDrawerIfPresent } from "../utils/pos";
import {
    generateFullName,
    generateSKU,
} from "../utils/faker";

test("low stock visible product", async ({ adminPage }) => {
    await loginAsPosAgent(adminPage);

    await openDrawerIfPresent(adminPage);

    await adminPage
        .locator("div.ml-10.flex.items-center>div.flex>i.icon-box")
        .click();

    const name = generateFullName();
    await adminPage.getByPlaceholder("Name").fill(name);
    await adminPage.getByPlaceholder("SKU").fill(generateSKU());
    await adminPage.getByPlaceholder("Price").fill("100");
    await adminPage.getByPlaceholder("Quantity").fill("5");
    await adminPage.getByPlaceholder("Weight").fill("10");
    await adminPage.locator('button[aria-label="Proceed"]').click();
    await expect.soft(
        adminPage.getByText("Product created successfully!").nth(0)
    ).toBeVisible();

    await adminPage.locator(".icon-sync").click();

    await adminPage.waitForFunction(
        () => {
            const elements = Array.from(
                document.querySelectorAll("div.grid span.text-green-600")
            );
            return (
                elements.length === 3 &&
                elements.every((el) => {
                    const text = el.textContent?.trim().toLowerCase();
                    return text === "completed";
                })
            );
        },
        null,
        { timeout: 30_000 }
    );

    await adminPage.goto("pos/products");
    await adminPage.waitForLoadState("networkidle");

    await openDrawerIfPresent(adminPage);

    await expect.soft(
        adminPage.getByText(`${name}`, { exact: true })
    ).toBeVisible();

    const productBox = adminPage.locator("div.box-shadow", {
        has: adminPage.locator("p.truncate-text-2", { hasText: `${name}` }),
    });

    await expect.soft(productBox).toBeVisible();

    await productBox.click();

    await adminPage.getByPlaceholder("100").fill("10");
    await adminPage
        .getByPlaceholder("Enter comment")
        .fill("this is done by playwright");
    await adminPage
        .getByRole("button", { name: "Add Product", exact: true })
        .click();
    await adminPage.locator('button[aria-label="Send Request"]').click();
    await expect.soft(
        adminPage.getByText("Product request submitted successfully.").nth(0)
    ).toBeVisible();

    await adminPage.goto("pos/products/requested-products");
    await expect.soft(adminPage.getByText(`${name}`).nth(0)).toBeVisible();

    await adminPage.goto("admin/pos/requests");
    await expect.soft(adminPage.getByText(`${name}`).nth(0)).toBeVisible();
});
