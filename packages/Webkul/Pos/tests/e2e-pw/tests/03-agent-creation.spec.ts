import { test, expect } from "../setup"
import fs from "fs";

import {
  generateEmail, generateFirstName,
  generateLastName
} from "../utils/faker";


test("pos agent creation", async ({ adminPage }) => {
  await adminPage.goto('admin/pos/users')
  await adminPage.getByRole('link', { name: ' Create Agent ' }).click()
  await adminPage.waitForLoadState('networkidle');
  const name = generateFirstName();
  const lastName = generateLastName();

  const fullName = `${name} ${lastName}`;

  // Wait until the Username field is visible
  await adminPage.waitForSelector('[placeholder="Username"]', { state: 'visible' });
  await adminPage.getByPlaceholder("Username").fill(name);

  await adminPage.waitForSelector('[placeholder="First Name"]', { state: 'visible' });
  await adminPage.getByPlaceholder("First Name").fill(name);

  await adminPage.waitForSelector('[placeholder="Last Name"]', { state: 'visible' });
  await adminPage.getByPlaceholder("Last Name").fill(lastName);

  await adminPage.waitForSelector('[placeholder="Email"]', { state: 'visible' });
  await adminPage.getByPlaceholder("Email").fill(generateEmail());

  await adminPage.waitForSelector('label[for="status"]', { state: 'visible' });
  await adminPage.locator('label[for="status"]').click();

  const { outletname: savedOutletName } = JSON.parse(
    fs.readFileSync("outlet.json", "utf-8")
  );

  await adminPage.waitForLoadState('networkidle');

  const select = adminPage.locator('select[name="outlet_id"]').nth(0);
  const options = await select.locator('option').all();

  let matchedValue = null;

  // Normalize function to remove " - (Active)"
  const normalize = (str) =>
    str.toLowerCase().replace(/\s*-\s*\(.*?\)/, '').trim();

  for (const option of options) {
    const text = await option.textContent();

    if (text && normalize(text) === normalize(savedOutletName)) {
      matchedValue = await option.getAttribute('value');
      break;
    }
  }

  if (matchedValue) {
    await select.selectOption({ value: matchedValue });
  } else {
    throw new Error(`No matching outlet found for: ${savedOutletName}`);
  }

  await adminPage.getByPlaceholder("Password").nth(0).fill("admin123")
  await adminPage.getByPlaceholder("Confirm Password").fill("admin123")

  const posdata = {
    userName: name,
    username: name,
    password: "admin123",
    fullName: fullName
  }

  fs.writeFileSync('pos-credentials.json', JSON.stringify(posdata, null, 2), 'utf-8');

  await adminPage.getByRole('button', { name: ' Save Agent ' }).click()
  await adminPage.waitForLoadState('networkidle');

  const check = adminPage.locator('//p[span[contains(@class, "icon-toast-done")]]')

  if (await check.isVisible()) {
    const text = await check.innerText()
  }

  await expect(
    adminPage.getByText(name).first()
  ).toBeVisible();


})
