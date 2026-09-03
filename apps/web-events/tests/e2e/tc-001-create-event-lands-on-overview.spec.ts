/**
 * E2E: creating a wedding event lands on the overview without crashing.
 *
 * **Status:** placeholder. The Playwright harness for `web-events/` is
 * not wired up yet — see `code/apps/web/tests/e2e/` for the older setup
 * in the `web/` app. To enable this spec:
 *
 *   1. Add `@playwright/test` to `package.json#devDependencies`.
 *   2. Run `pnpm exec playwright install chromium` (one-off).
 *   3. Create `playwright.config.ts` with `webServer` pointing at
 *      `pnpm dev` on port 5174 and a `baseURL`.
 *   4. Stand up the BE (postgres + java-api) per the README.
 *   5. Add a `global-setup.ts` that mints a JWT (or signs in).
 *
 * The spec body lives below — it's `test.skip()` so the file is
 * discoverable in the suite without breaking CI while the harness is
 * missing.
 */

import { test, expect } from '@playwright/test';

test.skip('creating a wedding event lands on the overview without crashing', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.goto('/dashboard/events/new');
  await page.getByLabel(/wedding/i).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByLabel(/title/i).fill('Maya & Luis');
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByLabel(/event date/i).fill('2027-04-15');
  await page.getByTestId('wizard-submit').click();

  await expect(page).toHaveURL(/\/dashboard\/events\/[a-z0-9]+$/);
  await expect(page.locator('body')).not.toContainText('Something went wrong');
  await expect(page.locator('body')).not.toContainText("Cannot read properties of undefined");
});