import { test, expect } from "../setup";
import { loginAsPosAgent, openDrawerIfPresent } from "../utils/pos";
import { getRandomBankName, getRandomAddress } from "../utils/myfunction";
import { generateEmail, generatePhoneNumber } from "../utils/faker";
import fs from "fs";

test("Payment done by using bank", async ({ adminPage }) => {
    const agentCred = JSON.parse(
        fs.readFileSync("pos-credentials.json", "utf-8")
    );

    const agentName = agentCred.fullName;

    await adminPage.goto("admin/pos/banks");
    await adminPage
        .getByRole("link", { name: " Create Bank ", exact: true })
        .click();

    const bankname = getRandomBankName();
    await adminPage.getByPlaceholder("Name").fill(bankname);
    await adminPage.getByPlaceholder("Address").fill(getRandomAddress());
    await adminPage.getByPlaceholder("Email").fill(generateEmail());
    await adminPage.getByPlaceholder("Phone").fill(generatePhoneNumber());
    await adminPage.locator('label[for="status"]').click();

    await adminPage
        .locator('select[name="agent_id"]')
        .selectOption({ label: agentName });
    await adminPage.getByRole("button", { name: " Save Bank " }).click();
    await expect(
        adminPage.getByText("Bank created successfully!").nth(0)
    ).toBeVisible();

    await loginAsPosAgent(adminPage);

    await openDrawerIfPresent(adminPage);

    const openDrawerModal = await adminPage
        .locator('//span[contains(., "Open Drawer")]')
        .first()
        .isVisible()
        .catch(() => false);

    if (openDrawerModal) {
        await adminPage.locator("span.icon-cross").click();
    }

    await adminPage.goto("pos/customers");
    await adminPage.waitForLoadState("networkidle");

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

    await adminPage.locator("a.secondary-button.w-full").click();

    await adminPage.locator("div.cursor-pointer:has-text('Card')").click();

    await expect(
        adminPage
            .locator("#bank_name")
            .selectOption({ label: `${bankname}` })
    ).toBeTruthy();

    fs.writeFileSync(
        "bank-name.json",
        JSON.stringify({ bankname }, null, 2),
        "utf-8"
    );
});
