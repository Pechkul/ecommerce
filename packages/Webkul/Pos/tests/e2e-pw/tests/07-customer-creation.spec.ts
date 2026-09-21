import { test, expect } from "../setup";
import { loginAsPosAgent, openDrawerIfPresent } from "../utils/pos";
import fs from "fs";

import {
    generateEmail,
    generateFirstName,
    generateLastName,
    generatePhoneNumber,
} from "../utils/faker";

test("customer can be created by pos agent ", async ({ adminPage }) => {
    await loginAsPosAgent(adminPage);

    await adminPage.goto("pos/customers");
    await adminPage.waitForLoadState("networkidle");

    await openDrawerIfPresent(adminPage);

    let customer = "";

    for (let i = 0; i < 3; i++) {
        await adminPage.getByRole("link", { name: "Add New Customer" }).click();

        const firstName = generateFirstName();
        const lastName = generateLastName();

        await adminPage.getByPlaceholder("First Name").fill(firstName);
        await adminPage.getByPlaceholder("Last Name").fill(lastName);
        await adminPage.getByPlaceholder("Phone Number").fill(generatePhoneNumber());
        await adminPage.getByPlaceholder("Email").fill(generateEmail());
        await adminPage.getByPlaceholder("Address").fill("America");
        await adminPage.locator('select[name="country"]').selectOption("US");
        await adminPage.locator('select[name="state"]').selectOption("CA");
        await adminPage.getByPlaceholder("City").fill("California");
        await adminPage.getByPlaceholder("Pin code").fill("94046");
        await adminPage.locator('button[aria-label="Add Customer"]').click();
        await expect.soft(
            adminPage.getByText("Customer created successfully!").nth(0)
        ).toBeVisible();

        customer = `${firstName} ${lastName}`;

        await adminPage.waitForLoadState("networkidle");
    }

    fs.writeFileSync("customer.json", JSON.stringify(customer, null, 2), "utf-8");
});
