/**
 * TC-220 (E2E): US-001 Onboard a new Wedding Planner — happy path.
 *
 * Exercises the full onboarding flow end-to-end against the live stack:
 *   1. Login as `admin@wendy` (Administrator) via the UI form.
 *   2. Navigate to the dashboard landing.
 *   3. Click the "Onboard Wedding Planner" entry point.
 *   4. Fill the form with a valid payload.
 *   5. Submit and assert the one-time credentials confirmation screen
 *      shows the new username (slug + @wendy) and the cleartext password.
 *   6. Acknowledge the credentials and return to the dashboard.
 *   7. Log out and log back in as the new Wedding Planner using the
 *      credentials shown on the confirmation screen — proves the
 *      username/password round-trips through the auth path (Rule 15/17).
 *
 * Requires:
 *   - Backend running at E2E_API_URL (default http://localhost:3000)
 *   - Frontend running at E2E_BASE_URL (default http://localhost:5173)
 *   - `admin@wendy` seeded (globalSetup runs `pnpm db:seed`).
 */

import { test, expect } from '@playwright/test';

import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers/api';

test.describe('TC-220 (E2E): US-001 Onboard a Wedding Planner — happy path', () => {
  test('Administrator onboards a WP and the new WP can sign in with the credentials', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // ----- Arrange -----
    const slug = `ada${Date.now().toString().slice(-6)}`;
    const password = 'a-strong-passphrase-1';
    const email = `ada.${slug}@example.com`;

    // ----- Act: log in as admin -----
    await page.goto('/login');
    await page.getByLabel(/username/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    // ----- Act: open the onboarding form from the landing card -----
    await expect(
      page.getByRole('button', { name: /onboard wedding planner/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole('button', { name: /onboard wedding planner/i })
      .click();
    await page.waitForURL(/\/dashboard\/wedding-planners\/onboard/, {
      timeout: 10_000,
    });

    // ----- Act: fill the form -----
    await expect(
      page.getByRole('heading', { name: /onboard a new wedding planner/i }),
    ).toBeVisible();

    await page.getByLabel(/first name/i).fill('Ada');
    await page.getByLabel(/last name/i).fill('Lovelace');
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^username$/i).fill(slug);
    await page.getByLabel(/initial password/i).fill(password);

    // ----- Act: submit -----
    await page.getByRole('button', { name: /save planner/i }).click();

    // ----- Assert: confirmation screen shows the cleartext password -----
    await page.waitForURL(/\/dashboard\/wedding-planners\/.*\/credentials/, {
      timeout: 10_000,
    });

    await expect(
      page.getByRole('heading', { name: /save the credentials/i }),
    ).toBeVisible();

    // The full username is the slug with the org suffix appended server-side.
    const composedUsername = `${slug}@wendy`;
    const usernameField = page.getByLabel(/^username$/i);
    await expect(usernameField).toHaveValue(composedUsername);

    const passwordField = page.getByLabel(/initial password/i);
    await expect(passwordField).toHaveValue(password);

    // ----- Act: acknowledge and return -----
    await page
      .getByLabel(/i have saved the credentials/i)
      .check();
    await expect(
      page.getByRole('button', { name: /^done$/i }),
    ).toBeEnabled();
    // Use page.evaluate to dispatch the click synchronously and bypass
    // Playwright's stability checks. The Done button's only effect is
    // a TanStack Router navigate({ to: '/dashboard' }), which Playwright
    // is sometimes flaky on in headless Chromium with the dev server.
    await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll('button'),
      ) as HTMLButtonElement[];
      const done = buttons.find((b) => /^done$/i.test(b.textContent ?? ''));
      done?.click();
    });
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });

    // ----- Act: simulate logout (the dashboard layout does not yet render
    // a sign-out button — Sprint 1 ships the landing page only) -----
    await page.evaluate(() => {
      window.localStorage.removeItem('__wendy_jwt__');
    });
    await page.context().clearCookies();
    await page.goto('/login');
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    // ----- Act: log in as the new WP with the credentials shown above -----
    await page.getByLabel(/username/i).fill(composedUsername);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // ----- Assert: dashboard loads for the new WP -----
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: /welcome back/i }),
    ).toBeVisible();
    // The role badge shows the WeddingPlanner role (not Administrator),
    // proving the JWT-derived role is correctly distinct.
    await expect(
      page.getByText(/^weddingplanner$/i).first(),
    ).toBeVisible();

    // The new WP should NOT see the "Onboard Wedding Planner" entry —
    // the dashboard role gate hides Administrator-only affordances.
    await expect(
      page.getByRole('button', { name: /onboard wedding planner/i }),
    ).toHaveCount(0);
  });
});
