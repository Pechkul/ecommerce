import { expect, test } from "../setup";

test("check if graphql installed", async ({ adminPage }) => {
  await adminPage.goto('graphiql');
  await expect(adminPage.getByRole('button', { name: 'Show Documentation Explorer' })).toBeVisible();

})
