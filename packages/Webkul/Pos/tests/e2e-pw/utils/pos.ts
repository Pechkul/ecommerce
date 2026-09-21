import fs from "fs";
import { Page } from "@playwright/test";

/**
 * Log in as the POS agent created by the agent-creation spec and wait until
 * the POS shell is ready.
 *
 * The POS SPA flow is:
 *   /pos (login form) -> /pos/settings/sync (entity sync) -> /pos/home
 *
 * We wait for the final /pos/home state instead of the transient flash
 * message, which auto-removes after ~5 seconds and is a flaky anchor.
 */
export async function loginAsPosAgent(page: Page): Promise<void> {
    const posData = JSON.parse(
        fs.readFileSync("pos-credentials.json", "utf-8")
    );

    await page.goto("pos");
    await page.waitForLoadState("networkidle");

    const usernameField = page.locator("#username");

    const isLoginVisible = await usernameField
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

    if (!isLoginVisible) {
        if (!page.url().includes("/pos/home")) {
            await page.goto("pos/home");
            await page.waitForLoadState("networkidle");
        }

        return;
    }

    await usernameField.fill(posData.username);
    await page.locator("#password").fill(posData.password);
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL("**/pos/home", { timeout: 90_000 });
    await page.waitForLoadState("networkidle");
}

/**
 * Open the cash drawer if the open-drawer modal is currently visible.
 * The drawer modal can appear on multiple POS pages; this helper keeps the
 * tests DRY and tolerant of the modal being absent.
 */
export async function openDrawerIfPresent(page: Page): Promise<void> {
    const openDrawerBtn = page.getByRole("button", { name: "Open Drawer" });

    const isVisible = await openDrawerBtn
        .isVisible({ timeout: 3_000 })
        .catch(() => false);

    if (!isVisible) {
        return;
    }

    await page.getByPlaceholder("100").fill("100");
    await page
        .getByPlaceholder("Enter counter closure remarks.")
        .fill("this is opening balance");
    await openDrawerBtn.click();
}
