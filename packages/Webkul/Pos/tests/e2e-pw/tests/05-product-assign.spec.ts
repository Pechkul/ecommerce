import { test, expect } from "../setup";
import { createSimpleProduct } from "../utils/myfunction";
import { loginAsPosAgent, openDrawerIfPresent } from "../utils/pos";
import fs from "fs";

test("assigned product visible in pos", async ({ adminPage }) => {
    const products: { [key: string]: string } = {};

    for (let i = 0; i < 5; i++) {
        const name = await createSimpleProduct(adminPage);
        products[`product${i + 1}`] = name;
    }

    fs.writeFileSync("products.json", JSON.stringify(products, null, 2), "utf-8");

    await adminPage.goto("admin/pos/outlets");
    await adminPage.locator("span.pos-listing-icon").click();
    await adminPage.locator('label[for="mass_action_select_all_records"]').click();
    await adminPage.locator("button > span").nth(0).click();
    await adminPage.getByRole("link", { name: "Update Assign" }).hover();
    await adminPage.locator("li>a").nth(1).click();
    await adminPage.getByRole("button", { name: "Agree", exact: true }).nth(0).click();
    await expect.soft(
        adminPage.getByText("Product assign updated successfully!").nth(0)
    ).toBeVisible();

    await loginAsPosAgent(adminPage);

    await openDrawerIfPresent(adminPage);

    await adminPage.goto("pos/home");
});
