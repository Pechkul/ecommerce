import { test } from "../setup";
import { loginAsPosAgent } from "../utils/pos";

test("pos agent able to login with that credentials", async ({ adminPage }) => {
    await loginAsPosAgent(adminPage);
});
